from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from backend.db.session import get_db
from backend.db.models import SessionMetadata, ChatMessage, InsightReport, Alert
from backend.services.language_service import detect_language, get_multilingual_chat_prompt
from backend.utils.schema_reader import get_database_schema
from backend.utils.sql_runner import execute_select_query

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.get("/{session_id}/history")
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Retrieves previous chat messages for this session."""
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp.asc()).all()
    return [{
        "role": m.role,
        "content": m.content,
        "detected_language": m.detected_language,
        "timestamp": m.timestamp.isoformat()
    } for m in messages]

@router.post("/{session_id}")
async def chat_with_data(
    session_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Multilingual chatbot endpoint. Automatically detects language (EN, TA, HI),
    generates SQLite SQL to fetch answer, executes query, and returns response in user's language.
    """
    message_text = payload.get("message", "").strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Empty message.")
        
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # 1. Detect user's language
    detected_lang = detect_language(message_text)
    
    # Save user message to history
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=message_text,
        detected_language=detected_lang
    )
    db.add(user_msg)
    db.commit()
    
    # 2. Get database schema for SQL generation context
    schema = get_database_schema(meta.db_path)
    schema_str = json.dumps(schema, indent=2)
    
    # 3. Ask Gemini to generate the SQL query
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini key not configured.")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    sql_prompt = f"""
    You are a SQL translator. Translate this business owner question into a single read-only SQLite SELECT query.
    Question: {message_text}
    Database Schema: {schema_str}
    
    Guidelines:
    - Return ONLY valid SQLite SELECT queries.
    - If the question cannot be answered with SQL, return an empty string.
    - Group or filter names as close to the spelling in schema as possible.
    
    Output as JSON:
    {{
        "query": "SELECT ..."
    }}
    """
    
    query_result_data = None
    query_used = ""
    
    try:
        response = await asyncio.wait_for(
            model.generate_content_async(
                sql_prompt,
                generation_config={"response_mime_type": "application/json"}
            ),
            timeout=10.0
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text.split("```json")[1].split("```")[0].strip()
        elif text.startswith("```"):
            text = text.split("```")[1].split("```")[0].strip()
            
        sql_decision = json.loads(text)
        query_used = sql_decision.get("query", "").strip()
        
        # Run SQL query if generated
        if query_used:
            res = execute_select_query(meta.db_path, query_used)
            if res.get("success"):
                query_result_data = res.get("data")
    except Exception as e:
        print("Chat SQL generation/execution failed:", str(e))
        
    # 4. Fetch compiled insights and alerts report for this session to provide conversational context
    report_record = db.query(InsightReport).filter(InsightReport.session_id == session_id).first()
    report_data = {}
    if report_record:
        try:
            report_data = json.loads(report_record.report_json)
        except Exception:
            pass

    alerts_records = db.query(Alert).filter(Alert.session_id == session_id).all()
    
    summary_parts = []
    insights_list = report_data.get("insights", [])
    if insights_list:
        summary_parts.append("Here are the compiled business discoveries/insights:")
        for idx, ins in enumerate(insights_list, 1):
            summary_parts.append(f"{idx}. {ins.get('title')}: {ins.get('finding')} (Why it matters: {ins.get('why_it_matters')})")
            
    if alerts_records:
        summary_parts.append("\nHere are the critical proactive alerts/warnings:")
        for idx, alt in enumerate(alerts_records, 1):
            summary_parts.append(f"{idx}. {alt.title}: {alt.finding} (Severity: {alt.severity})")
            
    report_summary_ctx = "\n".join(summary_parts) if summary_parts else "No insights compiled yet."

    data_ctx = ""
    if query_result_data:
        data_ctx += f"Current User Question SQL Query: {query_used}\nResults: {json.dumps(query_result_data, indent=2)}\n\n"
    data_ctx += f"General Business Insights Report for this session:\n{report_summary_ctx}"
    
    system_prompt = get_multilingual_chat_prompt(detected_lang, data_ctx)
    
    try:
        # Load previous 6 messages for context
        history = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp.desc()).limit(6).all()
        history_list = []
        for h in reversed(history):
            history_list.append(f"{h.role}: {h.content}")
        history_str = "\n".join(history_list)
        
        chat_prompt = f"""
        {system_prompt}
        
        Previous Conversation History:
        {history_str}
        
        User's New Question: {message_text}
        """
        
        ans_res = await asyncio.wait_for(
            model.generate_content_async(chat_prompt),
            timeout=10.0
        )
        answer = ans_res.text.strip()
    except Exception as e:
        print("Chat response formulation failed:", str(e))
        # Simple fallback message
        fallbacks = {
            "en": "I experienced a connection issue. Can you please repeat that?",
            "ta": "இணைப்புப் பிரச்சினை ஏற்பட்டது. தயவுசெய்து மீண்டும் கேட்கிறீர்களா?",
            "hi": "कनेक्शन की समस्या हुई। क्या आप कृपया इसे दोहरा सकते हैं?"
        }
        answer = fallbacks.get(detected_lang, fallbacks["en"])
        
    # Save assistant message to history
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=answer,
        detected_language=detected_lang
    )
    db.add(assistant_msg)
    db.commit()
    
    return {
        "response": answer,
        "language": detected_lang
    }
