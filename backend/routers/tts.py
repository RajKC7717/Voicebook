from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import os, io, requests

load_dotenv()

router = APIRouter()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Rachel voice — works well for Indian English/Hindi mix
# You can change this voice ID later
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

def build_confirmation_text(transaction: dict) -> str:
    tx_type = transaction.get("transaction_type", "")
    party = transaction.get("party_name", "")
    amount = transaction.get("amount", 0)

    if tx_type == "receivable":
        return f"{party} ko aapko {amount} rupaye dene hain. Entry save ho gayi."
    elif tx_type == "payable":
        return f"Aapko {party} ko {amount} rupaye dene hain. Entry save ho gayi."
    elif tx_type == "expense":
        return f"{amount} rupaye ka kharcha note kar liya. Entry save ho gayi."
    else:
        return f"{amount} rupaye ki entry save ho gayi."


@router.post("/tts/confirm")
async def speak_confirmation(transaction: dict):
    text = build_confirmation_text(transaction)

    try:
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": "eleven_multilingual_v2",   # supports Hindi
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            },
            timeout=15
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"ElevenLabs error: {response.text}"
            )

        # Stream audio bytes back to frontend
        audio_stream = io.BytesIO(response.content)
        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=confirmation.mp3"}
        )

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="ElevenLabs timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))