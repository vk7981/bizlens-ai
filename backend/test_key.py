import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load env file
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

api_key = os.getenv("GEMINI_API_KEY")
print("Loading API Key:", api_key[:15] + "..." if api_key else "None")

if not api_key:
    print("[Error] No GEMINI_API_KEY found in backend/.env")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-flash-lite-latest")

try:
    print("Testing connection to Gemini...")
    response = model.generate_content("Hello! Respond with the word 'SUCCESS' if you can read this.")
    print("Gemini Response:", response.text.strip())
    print("[Status] SUCCESS! Your API Key is fully active and working.")
except Exception as e:
    print("[Status] FAILED! Gemini API returned an error:")
    print("Error Details:", str(e))
