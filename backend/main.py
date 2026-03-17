from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import transactions, voice, tts, ocr, whatsapp
from dotenv import load_dotenv

load_dotenv()  # loads your .env file

app = FastAPI(title="KhataAI Backend")

# Allow React frontend (localhost:5173) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables on startup
@app.on_event("startup")
def startup():
    init_db()
    print("✅ Database initialized")

# Register routes
app.include_router(transactions.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(whatsapp.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "KhataAI backend is running 🚀"}