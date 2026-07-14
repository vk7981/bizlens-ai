from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import json
from backend.db.session import get_db
from backend.db.models import SessionMetadata, InsightReport
from backend.services.email_service import send_full_report_email

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.post("/configure")
def configure_alerts(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Saves email alert settings for a session."""
    session_id = payload.get("session_id")
    email = payload.get("email")
    alerts_enabled = payload.get("alerts_enabled", True)
    reports_enabled = payload.get("reports_enabled", True)
    
    if not session_id or not email:
        raise HTTPException(status_code=400, detail="Missing session_id or email.")
        
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    meta.email = email
    meta.alerts_enabled = alerts_enabled
    meta.reports_enabled = reports_enabled
    db.commit()
    
    return {"status": "SUCCESS", "message": "Email alert preferences saved."}

@router.post("/send-report/{session_id}")
def trigger_report_email(
    session_id: str,
    email: str = None,
    db: Session = Depends(get_db)
):
    """Manually triggers sending the full analysis report via email."""
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    if email:
        meta.email = email.strip()
        db.commit()
        
    if not meta.email:
        raise HTTPException(status_code=400, detail="Recipient email address is required.")
        
    report = db.query(InsightReport).filter(InsightReport.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Insight report not compiled yet.")
        
    report_data = json.loads(report.report_json)
    
    res = send_full_report_email(meta.email, report_data, meta.db_name)
    if not res.get("success"):
         raise HTTPException(status_code=500, detail=res.get("error", "SMTP failure"))
         
    return {
        "status": "SUCCESS", 
        "message": f"Full report dispatched to {meta.email}.",
        "sender_type": res.get("sender_type"),
        "ethereal_user": res.get("ethereal_user"),
        "ethereal_pass": res.get("ethereal_pass")
    }
