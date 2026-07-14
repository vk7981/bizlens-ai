import os
import sys
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Add parent path of backend to sys.path
sys.path.append(r"C:\Users\vaish\.gemini\antigravity\scratch\bizlens-ai")

from backend.db.session import SessionLocal
from backend.db.models import SessionMetadata, ChatMessage

# Load env variables
load_dotenv(r"C:\Users\vaish\.gemini\antigravity\scratch\bizlens-ai\backend\.env")

api_key = os.getenv("GEMINI_API_KEY")
print("API KEY:", api_key[:15] + "...")

# Get a session ID from the metadata DB
db = SessionLocal()
meta = db.query(SessionMetadata).order_by(SessionMetadata.created_at.desc()).first()

if not meta:
    print("No session metadata found. Please run an exploration first.")
    exit(1)

session_id = meta.session_id
print("Testing Chat with Session:", session_id, "DB Path:", meta.db_path)

message_text = "tell me in tamil"

# Configure gemini
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-flash-lite-latest")

sql_prompt = f"Available Tables schema: []\nQuestion: {message_text}\nOutput JSON with query."

try:
    print("Testing SQL generation...")
    response = model.generate_content(
        sql_prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    print("SQL Output:", response.text)
except Exception as e:
    print("SQL generation failed:", str(e))

from backend.services.language_service import get_multilingual_chat_prompt

system_prompt = get_multilingual_chat_prompt("en", "No data matches found or query was empty.")
chat_prompt = f"{system_prompt}\nUser's Question: {message_text}"

try:
    print("Testing Answer generation...")
    ans_res = model.generate_content(chat_prompt)
    print("Answer Output:", ans_res.text)
except Exception as e:
    print("Answer generation failed:", str(e))
    import traceback
    traceback.print_exc()

db.close()
