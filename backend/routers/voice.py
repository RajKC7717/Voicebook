from fastapi import APIRouter, UploadFile, File, HTTPException
from groq import Groq
from dotenv import load_dotenv
import json, os, tempfile
from database import get_connection

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Step A: Transcribe audio via Whisper ──────────────────────────────────────
def transcribe_audio(file_path: str) -> str:
    with open(file_path, "rb") as audio_file:
        result = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio_file,
            language="hi",        # Hindi — handles Hinglish too
            response_format="text"
        )
    return result

# ── Step B: Extract structured data via Llama ────────────────────────────────
def extract_transaction(transcribed_text: str) -> dict:
    prompt = f"""You are an accounting assistant for Indian SMEs.
Extract structured data from this vernacular sentence.
Return ONLY valid JSON, no explanation, no markdown:
{{
  "party_name": "",
  "amount": 0,
  "transaction_type": "receivable|payable|expense|income",
  "due_date": "YYYY-MM-DD or null",
  "item": "item name or null",
  "confidence": 0.0,
  "clarification_needed": "question to ask if unclear, else null"
}}

Rules:
- receivable = someone owes YOU money
- payable = YOU owe someone money
- expense = you spent money (no specific party)
- income = you earned money (no specific party)
- If amount is in thousands like "3 hazaar" or "3k", set amount to 3000
- party_name should be a person/business name only

Sentence: "{transcribed_text}"
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=300,
    )
    raw = response.choices[0].message.content.strip()

    # Strip markdown fences if model adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())

# ── Step C: Save to DB ────────────────────────────────────────────────────────
def save_transaction(data: dict, raw_text: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transactions
        (party_name, amount, transaction_type, item, due_date, confidence, raw_text)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data["party_name"],
        data["amount"],
        data["transaction_type"],
        data.get("item"),
        data.get("due_date"),
        data.get("confidence", 0.9),
        raw_text
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {**data, "id": new_id, "raw_text": raw_text}

# ── Main Route ────────────────────────────────────────────────────────────────
@router.post("/voice/process")
async def process_voice(audio: UploadFile = File(...)):
    filename = audio.filename or "recording.webm"
    suffix = ".ogg" if "ogg" in filename else ".webm"

    # ── Save uploaded audio to temp file ──
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    # ── Guard: reject empty/too-short audio ──
    if len(content) < 1000:
        os.unlink(tmp_path)
        raise HTTPException(
            status_code=400,
            detail="Audio too short or empty. Please speak for at least 1 second."
        )

    try:
        # Step A: Transcribe
        transcribed = transcribe_audio(tmp_path)
        if not transcribed or len(transcribed.strip()) < 2:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")

        # Step B: Extract structured data
        extracted = extract_transaction(transcribed)

        # Step C: Only save if no clarification needed
        if extracted.get("clarification_needed"):
            return {
                "status": "clarification_needed",
                "transcribed_text": transcribed,
                "clarification_question": extracted["clarification_needed"],
                "partial_data": extracted
            }

        # Save and return
        saved = save_transaction(extracted, transcribed)
        return {
            "status": "success",
            "transcribed_text": transcribed,
            "transaction": saved
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="LLM returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)   # always clean up temp file