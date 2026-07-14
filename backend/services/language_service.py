from langdetect import detect
import re

def detect_language(text: str) -> str:
    """
    Detects the language of a text string.
    Supports keyword overrides for 'tamil' or 'hindi' and character block ranges.
    """
    text_lower = text.lower().strip()
    if not text_lower:
        return "en"
        
    # Explicit English-transliterated keyword overrides
    if "tamil" in text_lower or "தமிழ்" in text_lower or "tamizh" in text_lower:
        return "ta"
    if "hindi" in text_lower or "हिंदी" in text_lower:
        return "hi"
    if "telugu" in text_lower or "తెలుగు" in text_lower:
        return "te"
        
    # Check for Tamil character block range (0B80 - 0BFF)
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "ta"
        
    # Check for Devanagari character block range (Hindi) (0900 - 097F)
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
        
    # Check for Telugu character block range (0C00 - 0C7F)
    if re.search(r'[\u0C00-\u0C7F]', text):
        return "te"
        
    try:
        lang = detect(text)
        if lang in ["ta", "hi", "te"]:
            return lang
    except:
        pass
        
    return "en"

def get_multilingual_chat_prompt(language: str, data_summary: str) -> str:
    """Synthesizes the system prompt for Gemini based on the detected language."""
    lang_names = {
        "en": "English",
        "ta": "Tamil (தமிழ்)",
        "hi": "Hindi (हिंदी)",
        "te": "Telugu (తెలుగు)"
    }
    lang_name = lang_names.get(language, "English")
    
    return f"""
    The user is a small business owner in India with no technical knowledge.
    They are asking a question about their business data.
    You are their friendly, helpful virtual business assistant.
    
    CRITICAL RULES:
    1. Respond in {lang_name}. If the user explicitly asks you to speak or explain in another language (e.g. Tamil or Hindi), fulfill their request immediately and translate your explanation to that language.
    2. Use very simple, friendly, non-technical business language.
    3. Never mention SQL, database, query, tables, schemas, joins, or technical database terms.
    4. Speak in terms of sales, expenses, cash flow, stock, and customers.
    5. FORMATTING RULE: Break down your answer into clear, spaced-out bullet points or short paragraphs. Avoid long, congested blocks of text. Make each point a short, actionable sentence. Put blank lines between points for maximum readability.
    
    Context about their business tables and data:
    {data_summary}
    
    Please answer their question accurately based on this context. Keep the answer structured, clean, and direct.
    """
