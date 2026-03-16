# KhataAI 🧾
### Voice-First Smart Ledger for Indian SMEs

KhataAI lets small business owners record transactions by **speaking in Hindi or Hinglish**, upload handwritten khata photos via **OCR**, and receive **WhatsApp summaries** — all in real time.

Built for hackathon @ MITWPU Ignisia.

---

## ✨ Features

- 🎙️ **Voice Entry** — Speak in Hindi/Hinglish → transaction extracted and saved automatically
- 📒 **Live Ledger** — Real-time dashboard with color-coded transactions and running balance
- 📷 **Khata OCR** — Upload a photo of handwritten ledger → entries auto-extracted via CV + LLM
- 📱 **WhatsApp Summary** — Daily transaction summary sent to your phone *(Chunk 6)*

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind (inline styles) |
| Backend | FastAPI (Python) |
| Database | SQLite |
| Speech-to-Text | Groq Whisper Large v3 |
| LLM | Groq Llama 3.3 70B |
| TTS | Browser SpeechSynthesis (hi-IN) |
| OCR | OpenCV + Tesseract + Groq LLM |
| WhatsApp | Twilio Sandbox |

---

## 📁 Project Structure

```
khata-ai/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── database.py              # SQLite setup
│   ├── models.py                # Pydantic models
│   ├── .env                     # API keys (never commit this)
│   └── routers/
│       ├── transactions.py      # GET/POST ledger routes
│       ├── voice.py             # Voice pipeline route
│       ├── ocr.py               # Khata OCR route
│       └── tts.py               # TTS route
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app with routing
│   │   ├── api.js               # Axios API calls
│   │   ├── index.css            # Global theme
│   │   └── components/
│   │       ├── Sidebar.jsx
│   │       ├── SummaryCards.jsx
│   │       ├── LedgerTable.jsx
│   │       ├── VoiceEntry.jsx
│   │       └── KhataOCR.jsx
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Download |
|---|---|---|
| Python | 3.10 or 3.11 | python.org |
| Node.js | 18+ | nodejs.org |
| Git | Any | git-scm.com |
| Tesseract OCR | 5.x | See Step 3 below |

---

## 🔑 API Keys Required

You'll need free accounts on these platforms:

| Service | What it's used for | Link |
|---|---|---|
| Groq | Whisper transcription + Llama LLM | console.groq.com |
| ElevenLabs | TTS (optional, browser TTS used as fallback) | elevenlabs.io |
| Twilio | WhatsApp sandbox summary | twilio.com |

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/khata-ai.git
cd khata-ai
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# Install all Python dependencies
pip install fastapi uvicorn python-multipart groq \
            opencv-python pytesseract pillow \
            twilio python-dotenv aiofiles requests
```

---

### Step 3 — Install Tesseract OCR (System Install)

Tesseract is a separate system tool — not a Python package.

**Windows:**
1. Go to: https://github.com/UB-Mannheim/tesseract/wiki
2. Download `tesseract-ocr-w64-setup-5.x.x.exe`
3. Run the installer
4. On the language selection screen → scroll down → **check "Hindi"**
5. Install to the default path: `C:\Program Files\Tesseract-OCR\`
6. Add to PATH:
   - Search "Environment Variables" in Start Menu
   - System Variables → Path → Edit → New
   - Add: `C:\Program Files\Tesseract-OCR`
   - Click OK → OK → OK
7. **Reopen terminal** and verify:
```bash
tesseract --version
```

**Mac:**
```bash
brew install tesseract
brew install tesseract-lang   # includes Hindi
```

**Linux (Ubuntu):**
```bash
sudo apt install tesseract-ocr
sudo apt install tesseract-ocr-hin   # Hindi language pack
```

---

### Step 4 — Create `.env` File

Inside the `backend/` folder, create a file called `.env`:

```bash
# Navigate to backend folder
cd backend

# Create the .env file and open it in any text editor
```

Paste this into `.env` and fill in your keys:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=your_elevenlabs_key_here
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+91XXXXXXXXXX
```

> ⚠️ Never commit the `.env` file — it's already in `.gitignore`

**How to get each key:**
- **GROQ_API_KEY** → console.groq.com → API Keys → Create API Key
- **ELEVENLABS_API_KEY** → elevenlabs.io → Profile → API Key
- **TWILIO keys** → console.twilio.com → Account Info (click 👁 to reveal Auth Token)
- **TWILIO_WHATSAPP_TO** → your own WhatsApp number with country code

**Twilio WhatsApp Sandbox setup (one-time):**
1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. WhatsApp the join code shown (e.g. `join word-word`) to `+14155238886`
3. You'll get a confirmation message — sandbox is now active

---

### Step 5 — Run the Backend

```bash
# Make sure you're in backend/ and venv is active
cd backend
uvicorn main:app --reload --port 8000
```

You should see:
```
✅ Database initialized
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Verify it works by opening: http://localhost:8000

You should see: `{"status": "KhataAI backend is running 🚀"}`

View all API routes at: http://localhost:8000/docs

---

### Step 6 — Frontend Setup

Open a **new terminal** (keep backend running in the first one):

```bash
cd khata-ai/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

### Step 7 — Verify Everything Works

**Quick smoke test:**

1. Open http://localhost:5173 → dark dashboard should load
2. Summary cards should show ₹0 / ₹0 / ₹0
3. Go to http://localhost:8000/docs → POST `/api/transactions` with:
```json
{
  "party_name": "Ramesh",
  "amount": 3000,
  "transaction_type": "receivable",
  "item": "cement"
}
```
4. Switch back to dashboard → row should appear within 2 seconds ✅

---

## 🎙️ Using Voice Entry

1. Click **🎙️ Voice Entry** in sidebar
2. Click the mic button to start recording
3. Speak in Hindi or Hinglish, for example:
   > *"Ramesh ne teen hazaar rupaye dene hain cement ke liye"*
4. Click the stop button (⏹️)
5. Wait 3–5 seconds for transcription + extraction
6. Review the confirm card → click **Confirm & Save**
7. Browser will speak a Hindi confirmation
8. Switch to Ledger → your entry appears ✅

---

## 📷 Using Khata OCR

1. Click **📷 Khata OCR** in sidebar
2. Click the upload zone
3. Select a photo of a handwritten ledger page
4. Wait ~5 seconds for OCR processing
5. Review extracted entries
6. Click **Save All Entries**
7. Switch to Ledger → all entries appear ✅

**Tips for best OCR results:**
- Good lighting — avoid shadows
- Camera directly above paper (not at an angle)
- Plain white paper, dark pen
- Clear handwriting

---

## 🐛 Common Issues & Fixes

### Backend won't start
```
GroqError: The api_key client option must be set
```
→ Your `.env` file is missing or the key has spaces around `=`. Check format: `GROQ_API_KEY=gsk_...` (no spaces)

---

### Tesseract not found
```
tesseract is not recognized...
```
→ Add `C:\Program Files\Tesseract-OCR` to Windows PATH (see Step 3). Then **fully close and reopen** your terminal.

---

### Mic not working in browser
→ Make sure you're accessing via `http://localhost:5173` (not an IP address). Chrome requires localhost or HTTPS for microphone access.

---

### Voice transcription returns gibberish
→ Speak clearly and slowly. Groq Whisper handles Hindi and Hinglish well. Make sure you're not in a noisy environment.

---

### CORS error in browser console
→ Make sure backend is running on port `8000` and frontend on `5173`. Check `main.py` has both origins in `allow_origins`.

---

### SQLite DB not found
→ The `khata.db` file is created automatically on first backend startup. Make sure you ran `uvicorn main:app --reload --port 8000` at least once.

---

## 📌 Ports Reference

| Service | URL |
|---|---|
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Frontend | http://localhost:5173 |

---

## 👥 Team

Built by Raaj & team for MITWPU Ignisia Hackathon.