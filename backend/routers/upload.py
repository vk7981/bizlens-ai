from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import os
import shutil
from backend.db.session import get_db
from backend.db.models import SessionMetadata
from backend.utils.file_processor import process_file_to_sqlite

router = APIRouter(prefix="/api/upload", tags=["Upload"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_dataset_files(
    files: list[UploadFile] = File(...),
    email: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Accepts multiple CSV/Excel files, converts them into a single session-specific SQLite database,
    and initializes session metadata records.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
        
    session_id = str(uuid.uuid4())
    db_path = os.path.join(UPLOAD_DIR, f"{session_id}.db")
    
    # Track metadata about the uploaded tables
    tables_summary = []
    
    # To determine display name
    first_filename = files[0].filename
    db_name = first_filename if len(files) == 1 else f"{first_filename} + {len(files)-1} files"
    
    try:
        for file in files:
            # Secure write temporary file
            temp_path = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}_{file.filename}")
            with open(temp_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
                
            try:
                # Convert the file to a SQLite table
                table_info = process_file_to_sqlite(temp_path, file.filename, db_path)
                tables_summary.append(table_info)
            except Exception as pe:
                raise HTTPException(status_code=400, detail=f"Error parsing file '{file.filename}': {str(pe)}")
            finally:
                # Remove temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    
        # Record session metadata in central DB
        session_meta = SessionMetadata(
            session_id=session_id,
            db_name=db_name,
            db_path=db_path,
            email=email,
            status="UPLOADED"
        )
        db.add(session_meta)
        db.commit()
        
        return {
            "session_id": session_id,
            "db_name": db_name,
            "tables": tables_summary
        }
        
    except Exception as e:
        # Clean up database if failed
        if os.path.exists(db_path):
            os.remove(db_path)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")
