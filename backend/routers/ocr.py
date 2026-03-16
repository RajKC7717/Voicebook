from fastapi import APIRouter, UploadFile, File, HTTPException
from groq import Groq
from dotenv import load_dotenv
import cv2, pytesseract, json, os, tempfile
import numpy as np
from PIL import Image
from database import get_connection

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Windows only — point to tesseract install path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


# ── Step A: OpenCV Pre-processing ─────────────────────────────────────────────
def preprocess_image(file_path: str) -> np.ndarray:
    img = cv2.imread(file_path)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # Adaptive threshold — handles uneven lighting on paper
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )

    # Slightly sharpen
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(thresh, -1, kernel)

    return sharpened


# ── Step B: Tesseract OCR ─────────────────────────────────────────────────────
def run_ocr(processed_img: np.ndarray) -> str:
    pil_img = Image.fromarray(processed_img)

    # Try Hindi + English combined first
    try:
        text = pytesseract.image_to_string(pil_img, lang="hin+eng")
    except Exception:
        # Fallback to English only if Hindi pack not installed
        text = pytesseract.image_to_string(pil_img, lang="eng")

    return text.strip()


# ── Step C: LLM Parsing ───────────────────────────────────────────────────────
def parse_ocr_with_llm(ocr_text: str) -> list:
    prompt = f"""This is raw OCR output from a handwritten Indian khata (ledger) book.
It may contain Hindi, English, or mixed text with informal notations.
Parse every transaction entry you can find.
Return ONLY a valid JSON array, no explanation, no markdown:
[
  {{
    "party_name": "",
    "amount": 0,
    "transaction_type": "receivable|payable|expense|income",
    "due_date": "YYYY-MM-DD or null",
    "item": "item description or null"
  }}
]

Interpretation rules:
- "R-3k-15/3" = Ramesh, 3000 rupees, March 15, receivable
- "Su 1500 dena" = Suresh, 1500, payable (you owe him)
- Numbers like "3k", "3000", "3,000" are all 3000
- If party name unclear, use best guess from context
- Skip entries that are completely unreadable
- Return empty array [] if nothing parseable found

Raw OCR text:
{ocr_text}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1000,
    )
    raw = response.choices[0].message.content.strip()

    # Strip markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw.strip())


# ── Step D: Bulk Save ─────────────────────────────────────────────────────────
def bulk_save_transactions(entries: list, raw_ocr: str) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    saved = []

    for entry in entries:
        cursor.execute("""
            INSERT INTO transactions
            (party_name, amount, transaction_type, item, due_date, confidence, raw_text)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            entry.get("party_name", "Unknown"),
            entry.get("amount", 0),
            entry.get("transaction_type", "receivable"),
            entry.get("item"),
            entry.get("due_date"),
            0.75,           # OCR entries get lower confidence than voice
            f"[OCR] {raw_ocr[:100]}"
        ))
        saved.append({**entry, "id": cursor.lastrowid})

    conn.commit()
    conn.close()
    return saved


# ── Main Route: Preview (don't save yet) ─────────────────────────────────────
@router.post("/ocr/preview")
async def ocr_preview(image: UploadFile = File(...)):
    # Validate file type
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    suffix = ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await image.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Pre-process
        processed = preprocess_image(tmp_path)

        # OCR
        ocr_text = run_ocr(processed)
        if not ocr_text or len(ocr_text.strip()) < 3:
            raise HTTPException(status_code=422, detail="Could not read text from image")

        # LLM parse
        entries = parse_ocr_with_llm(ocr_text)

        return {
            "status": "preview",
            "ocr_text": ocr_text,
            "entries": entries,
            "entry_count": len(entries)
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="LLM could not parse OCR output")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


# ── Main Route: Confirm + Save ────────────────────────────────────────────────
@router.post("/ocr/confirm")
async def ocr_confirm(payload: dict):
    entries = payload.get("entries", [])
    ocr_text = payload.get("ocr_text", "")

    if not entries:
        raise HTTPException(status_code=400, detail="No entries to save")

    saved = bulk_save_transactions(entries, ocr_text)
    return {
        "status": "success",
        "saved_count": len(saved),
        "transactions": saved
    }