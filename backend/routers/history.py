from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.db.models import SessionMetadata

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("")
def get_all_sessions(db: Session = Depends(get_db)):
    """Retrieves all past user sessions ordered by creation date."""
    sessions = db.query(SessionMetadata).order_by(SessionMetadata.created_at.desc()).all()
    return [{
        "session_id": s.session_id,
        "db_name": s.db_name,
        "email": s.email,
        "status": s.status,
        "created_at": s.created_at.isoformat()
    } for s in sessions]

@router.get("/session/{session_id}")
def get_session_info(session_id: str, db: Session = Depends(get_db)):
    """Gets metadata for a specific session."""
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {
        "session_id": meta.session_id,
        "db_name": meta.db_name,
        "email": meta.email,
        "alerts_enabled": meta.alerts_enabled,
        "reports_enabled": meta.reports_enabled,
        "status": meta.status,
        "created_at": meta.created_at.isoformat()
    }
