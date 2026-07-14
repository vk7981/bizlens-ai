import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class SessionMetadata(Base):
    __tablename__ = "sessions"
    
    session_id = Column(String(50), primary_key=True)
    db_name = Column(String(200), nullable=True) # Display name
    db_path = Column(String(500), nullable=False) # Session sandboxed SQLite file path
    email = Column(String(200), nullable=True) # Email configured for alerts
    alerts_enabled = Column(Boolean, default=True) # Send email alerts
    reports_enabled = Column(Boolean, default=True) # Send email reports
    status = Column(String(50), default="UPLOADED") # UPLOADED, RUNNING, COMPLETED, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InsightReport(Base):
    __tablename__ = "reports"
    
    session_id = Column(String(50), primary_key=True)
    report_json = Column(Text, nullable=False) # JSON containing structured ranked insights
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    
    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), nullable=False)
    title = Column(String(250), nullable=False)
    finding = Column(Text, nullable=False)
    sql_proof = Column(Text, nullable=True)
    severity = Column(String(20), default="HIGH") # HIGH, WARNING
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    message_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False) # user, assistant
    content = Column(Text, nullable=False)
    detected_language = Column(String(10), default="en")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
