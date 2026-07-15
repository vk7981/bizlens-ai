from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
import asyncio
import json
from backend.db.session import get_db
from backend.db.models import SessionMetadata, InsightReport
from backend.agent.insight_agent import InsightAgent
from backend.services.email_service import send_alert_email, send_full_report_email

router = APIRouter(prefix="/api/agent", tags=["Agent"])

# In-memory queue storage for active agent runs
active_queues = {}
active_tasks = {}

async def run_agent_workflow(session_id: str, db_path: str):
    """Asynchronous background worker task running the 5-phase investigation."""
    queue = active_queues[session_id]
    db = SessionLocal()
    
    try:
        meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
        if meta:
            meta.status = "RUNNING"
            db.commit()
            
        agent = InsightAgent(db_path=db_path, session_id=session_id)
        
        final_report = None
        async for event in agent.explore_and_report():
            await queue.put(event)
            if event.get("type") == "complete":
                final_report = event.get("report")
                
        # Send emails if triggered
        if final_report:
            # Load fresh metadata inside workflow transaction
            meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
            if meta and meta.email:
                loop = asyncio.get_event_loop()
                # 1. Proactive alerts dispatch (if alerts found)
                if final_report.get("alerts") and meta.alerts_enabled:
                    await loop.run_in_executor(
                        None,
                        lambda: send_alert_email(meta.email, final_report["alerts"], meta.db_name)
                    )
                # 2. Complete report dispatch (if report enabled)
                if meta.reports_enabled:
                    await loop.run_in_executor(
                        None,
                        lambda: send_full_report_email(meta.email, final_report, meta.db_name)
                    )
                    
    except Exception as e:
        print(f"Agent execution crashed: {str(e)}")
        await queue.put({"type": "error", "message": f"Agent workflow halted: {str(e)}"})
        meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
        if meta:
            meta.status = "FAILED"
            db.commit()
    finally:
        db.close()
        # Sleep briefly to ensure queue drains before removing
        await asyncio.sleep(5)
        active_queues.pop(session_id, None)
        active_tasks.pop(session_id, None)

# Import SessionLocal inside file locally to avoid circular dependencies
from backend.db.session import SessionLocal

@router.post("/run/{session_id}")
async def run_agent(session_id: str, db: Session = Depends(get_db)):
    """Triggers the agent exploration process for the given session ID in the background."""
    meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == session_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    if session_id in active_tasks:
        return {"status": "RUNNING", "message": "Agent analysis already running."}
        
    # Initialize session communication queue
    active_queues[session_id] = asyncio.Queue()
    
    # Spawn background task
    task = asyncio.create_task(run_agent_workflow(session_id, meta.db_path))
    active_tasks[session_id] = task
    
    return {"status": "STARTED", "message": "Agent exploration initiated."}

@router.get("/stream/{session_id}")
def stream_agent_run(session_id: str):
    """Event stream (SSE) yielding real-time steps of agent progress."""
    if session_id not in active_queues:
        raise HTTPException(status_code=404, detail="Active run stream not found or completed.")
        
    async def event_generator():
        queue = active_queues[session_id]
        while True:
            try:
                # Retrieve next log event from queue
                event = await queue.get()
                yield {"data": json.dumps(event)}
                if event.get("type") in ["complete", "error"]:
                    break
            except asyncio.CancelledError:
                break
            except Exception as e:
                yield {"data": json.dumps({"type": "error", "message": str(e)})}
                break
                
    return EventSourceResponse(event_generator(), headers={"X-Accel-Buffering": "no"})

@router.get("/report/{session_id}")
def get_report(session_id: str, db: Session = Depends(get_db)):
    """Retrieves the completed insight report for the session."""
    report = db.query(InsightReport).filter(InsightReport.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found. The agent may still be running or failed.")
    return json.loads(report.report_json)
