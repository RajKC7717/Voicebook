from fastapi import APIRouter, HTTPException
from twilio.rest import Client
from dotenv import load_dotenv
from database import get_connection
from groq import Groq
import os
from datetime import datetime

load_dotenv()

router = APIRouter()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM        = os.getenv("TWILIO_WHATSAPP_FROM")
TWILIO_TO          = os.getenv("TWILIO_WHATSAPP_TO")


# ── Step A: Fetch today's transactions from DB ────────────────────────────────
def get_todays_data() -> dict:
    conn = get_connection()
    cursor = conn.cursor()

    today = datetime.now().strftime("%Y-%m-%d")

    # All of today's transactions
    cursor.execute("""
        SELECT * FROM transactions
        WHERE DATE(created_at) = ?
        ORDER BY created_at DESC
    """, (today,))
    rows = [dict(r) for r in cursor.fetchall()]

    # Today's totals
    cursor.execute("""
        SELECT
            COALESCE(SUM(CASE WHEN transaction_type IN ('receivable','income')
                THEN amount ELSE 0 END), 0) as total_in,
            COALESCE(SUM(CASE WHEN transaction_type IN ('payable','expense')
                THEN amount ELSE 0 END), 0) as total_out,
            COUNT(*) as total_count
        FROM transactions
        WHERE DATE(created_at) = ?
    """, (today,))
    summary = dict(cursor.fetchone())

    # Biggest receivable today
    cursor.execute("""
        SELECT party_name, amount FROM transactions
        WHERE DATE(created_at) = ?
        AND transaction_type = 'receivable'
        ORDER BY amount DESC LIMIT 1
    """, (today,))
    biggest = cursor.fetchone()

    conn.close()
    return {
        "transactions": rows,
        "summary": summary,
        "biggest_receivable": dict(biggest) if biggest else None,
        "date": today
    }


# ── Step B: Build Hindi summary via LLM ──────────────────────────────────────
def generate_hindi_summary(data: dict) -> str:
    if data["summary"]["total_count"] == 0:
        return (
            f"📒 *KhataAI Daily Report*\n"
            f"📅 {data['date']}\n\n"
            f"Aaj koi transaction record nahi hua.\n\n"
            f"_KhataAI se bheja gaya_ ✨"
        )

    tx_lines = ""
    for tx in data["transactions"][:5]:   # max 5 entries in message
        emoji = "🟢" if tx["transaction_type"] in ("receivable", "income") else "🔴"
        tx_lines += f"{emoji} {tx['party_name']} — ₹{int(tx['amount']):,}\n"

    prompt = f"""Write a WhatsApp summary message in Hindi (use Devanagari script).
Keep it under 5 lines. Friendly, professional tone.
Include:
- Total money coming in: ₹{int(data['summary']['total_in']):,}
- Total money going out: ₹{int(data['summary']['total_out']):,}
- Net balance: ₹{int(data['summary']['total_in'] - data['summary']['total_out']):,}
- Biggest receivable: {data['biggest_receivable']['party_name'] + ' se ₹' + str(int(data['biggest_receivable']['amount'])) + ' aane hain' if data['biggest_receivable'] else 'koi nahi'}

Return ONLY the Hindi message text. No explanation. No markdown code blocks.
Start with: आज का हिसाब 📊
"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=300,
    )
    hindi_text = response.choices[0].message.content.strip()

    # Build full formatted message
    full_message = (
        f"📒 *KhataAI Daily Report*\n"
        f"📅 {data['date']}\n\n"
        f"{hindi_text}\n\n"
        f"*Aaj ke transactions:*\n"
        f"{tx_lines}\n"
        f"_KhataAI se bheja gaya_ ✨"
    )
    return full_message


# ── Step C: Send via Twilio ───────────────────────────────────────────────────
def send_whatsapp(message: str) -> str:
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            from_=TWILIO_FROM,
            to=TWILIO_TO,
            body=message
        )
        return msg.sid
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Twilio error: {str(e)}")


# ── Main Route ────────────────────────────────────────────────────────────────
@router.post("/whatsapp/send-summary")
async def send_daily_summary():
    # Get today's data
    data = get_todays_data()

    # Generate Hindi summary
    message = generate_hindi_summary(data)

    # Send via Twilio
    sid = send_whatsapp(message)

    return {
        "status": "sent",
        "message_sid": sid,
        "preview": message,
        "transaction_count": data["summary"]["total_count"]
    }


# ── Preview Route (check message without sending) ────────────────────────────
@router.get("/whatsapp/preview")
async def preview_summary():
    data = get_todays_data()
    message = generate_hindi_summary(data)
    return {
        "status": "preview",
        "message": message,
        "data": data["summary"]
    }