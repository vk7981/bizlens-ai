import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Inject project root path to allow absolute imports in python
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load environmental configs
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from backend.db.session import init_db
from backend.routers import upload, agent, chat, alerts, history, auth

app = FastAPI(
    title="BizLens AI Backend",
    description="Multilingual agentic business intelligence backend supporting Excel/CSV sandboxing, cross-file pattern joins, and SMTP alerts.",
    version="1.0.0"
)

# Configure CORS for Vite Frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints routers
app.include_router(upload.router)
app.include_router(agent.router)
app.include_router(chat.router)
app.include_router(alerts.router)
app.include_router(history.router)
app.include_router(auth.router)

@app.on_event("startup")
def startup_event():
    # Make sure central database metadata is created
    init_db()
    print("BizLens central SQLite metadata database initialized.")

@app.get("/")
def read_root():
    return {"status": "ONLINE", "service": "BizLens AI BI Engine"}
