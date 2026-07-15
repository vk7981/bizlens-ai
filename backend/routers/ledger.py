from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import datetime

from backend.db.session import get_db
from backend.db.models import DailyLedger, SessionMetadata
from backend.utils.ledger_extractor import auto_extract_financial_ledger

router = APIRouter(prefix="/api/ledger", tags=["Ledger"])

class LedgerSaveRequest(BaseModel):
    email: str
    date: str # YYYY-MM-DD or YYYY-MM
    income: float
    expenses: float
    notes: Optional[str] = ""

class ExtractRequest(BaseModel):
    session_id: str
    email: str

@router.get("")
def get_ledger(email: str, db: Session = Depends(get_db)):
    """Retrieves all historical ledger records for this owner email."""
    if not email:
        raise HTTPException(status_code=400, detail="Missing email parameter.")
    records = db.query(DailyLedger).filter(DailyLedger.email == email.strip().lower()).order_by(DailyLedger.date.asc()).all()
    return [{
        "id": r.id,
        "date": r.date,
        "income": r.income,
        "expenses": r.expenses,
        "profit": r.profit,
        "notes": r.notes,
        "source": r.source
    } for r in records]

@router.post("")
def save_ledger_entry(payload: LedgerSaveRequest, db: Session = Depends(get_db)):
    """Saves or updates a daily/monthly ledger log entry."""
    email = payload.email.strip().lower()
    date_str = payload.date.strip()
    
    if not email or not date_str:
        raise HTTPException(status_code=400, detail="Email and Date are required.")
        
    # Check if entry already exists for this date
    entry = db.query(DailyLedger).filter(
        DailyLedger.email == email,
        DailyLedger.date == date_str
    ).first()
    
    profit = round(payload.income - payload.expenses, 2)
    
    if entry:
        # Update
        entry.income = round(payload.income, 2)
        entry.expenses = round(payload.expenses, 2)
        entry.profit = profit
        entry.notes = payload.notes
        entry.source = "MANUAL"
    else:
        # Create
        entry = DailyLedger(
            email=email,
            date=date_str,
            income=round(payload.income, 2),
            expenses=round(payload.expenses, 2),
            profit=profit,
            notes=payload.notes,
            source="MANUAL"
        )
        db.add(entry)
        
    db.commit()
    db.refresh(entry)
    
    return {
        "status": "SUCCESS",
        "entry": {
            "id": entry.id,
            "date": entry.date,
            "income": entry.income,
            "expenses": entry.expenses,
            "profit": entry.profit,
            "notes": entry.notes,
            "source": entry.source
        }
    }

@router.delete("/{entry_id}")
def delete_ledger_entry(entry_id: int, db: Session = Depends(get_db)):
    """Deletes a ledger log entry."""
    entry = db.query(DailyLedger).filter(DailyLedger.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found.")
    db.delete(entry)
    db.commit()
    return {"status": "SUCCESS", "message": "Ledger entry deleted."}

@router.post("/auto-extract")
async def extract_ledger_from_session(payload: ExtractRequest, db: Session = Depends(get_db)):
    """AI scans session CSVs and auto-creates daily ledger logs."""
    email = payload.email.strip().lower()
    session_id = payload.session_id.strip()
    
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session files not found.")
        
    # Extract records
    extracted = await auto_extract_financial_ledger(meta.db_path)
    
    if not extracted:
        raise HTTPException(status_code=400, detail="No financial transaction columns detected in uploaded files.")
        
    saved_entries = []
    
    for item in extracted:
        date_val = item["date"]
        # Check duplicate
        entry = db.query(DailyLedger).filter(
            DailyLedger.email == email,
            DailyLedger.date == date_val
        ).first()
        
        if entry:
            entry.income = item["income"]
            entry.expenses = item["expenses"]
            entry.profit = item["profit"]
            entry.notes = item["notes"]
            entry.source = "AUTO_FILE"
        else:
            entry = DailyLedger(
                email=email,
                date=date_val,
                income=item["income"],
                expenses=item["expenses"],
                profit=item["profit"],
                notes=item["notes"],
                source="AUTO_FILE"
            )
            db.add(entry)
        saved_entries.append(entry)
        
    db.commit()
    
    return {
        "status": "SUCCESS",
        "extracted_count": len(saved_entries)
    }

from backend.utils.schema_reader import get_database_schema

@router.get("/schema/{session_id}")
def get_session_schema(session_id: str, db: Session = Depends(get_db)):
    """Fetches the complete structural schema catalog of the session's database."""
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found.")
    return get_database_schema(meta.db_path)

from backend.utils.sql_runner import execute_select_query

class QueryRequest(BaseModel):
    query: str

@router.post("/query/{session_id}")
def execute_session_query(session_id: str, payload: QueryRequest, db: Session = Depends(get_db)):
    """Executes a secure read-only SELECT query against the session's SQLite database."""
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found.")
    res = execute_select_query(meta.db_path, payload.query)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res
