from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import hashlib
import secrets

from backend.db.session import get_db
from backend.db.models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

def hash_password(password: str) -> str:
    """Secure password hashing using PBKDF2 with a random salt."""
    salt = secrets.token_bytes(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{pwd_hash.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a password against its PBKDF2 hash."""
    try:
        salt_hex, hash_hex = hashed_password.split(':')
        salt = bytes.fromhex(salt_hex)
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return pwd_hash.hex() == hash_hex
    except Exception:
        return False

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Secure login validation verifying password against database hash.
    """
    email = payload.email.strip().lower()
    password = payload.password
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password.")
        
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
        
    return {
        "status": "SUCCESS",
        "name": user.name,
        "email": user.email,
        "token": f"session-token-{user.email}"
    }

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new user in the database, checking for duplicates.
    """
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password
    
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="All fields are required.")
        
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format.")
        
    # Check duplicate
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered.")
        
    # Create new user
    new_user = User(
        name=name,
        email=email,
        password_hash=hash_password(password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "status": "SUCCESS",
        "name": new_user.name,
        "email": new_user.email,
        "token": f"session-token-{new_user.email}"
    }

import time
from backend.services.email_service import send_otp_email

otp_storage = {}

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Return success for security
        return {"status": "SUCCESS", "message": "If this email is registered, you will receive an OTP code shortly."}
        
    # Generate 6-digit numeric OTP
    otp = f"{secrets.randbelow(900000) + 100000}"
    expires_at = time.time() + 600 # 10 minutes
    
    otp_storage[email] = {
        "otp": otp,
        "expires_at": expires_at
    }
    
    # Send email
    res = send_otp_email(email, otp)
    
    response_data = {
        "status": "SUCCESS",
        "message": "If this email is registered, you will receive an OTP code shortly."
    }
    if res.get("sender_type") == "ethereal":
        response_data["ethereal_info"] = {
            "user": res.get("ethereal_user"),
            "pass": res.get("ethereal_pass"),
            "msg": "Ethereal sandbox used. View the inbox at https://ethereal.email using these login details!"
        }
    elif res.get("sender_type") == "mock":
        response_data["mock_otp"] = otp # So they can copy it from UI if SMTP is totally offline
        
    return response_data

@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()
    
    if email not in otp_storage:
        raise HTTPException(status_code=400, detail="No active password reset request found for this email.")
        
    stored = otp_storage[email]
    if time.time() > stored["expires_at"]:
        otp_storage.pop(email, None)
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")
        
    if stored["otp"] != otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP verification code.")
        
    return {"status": "SUCCESS", "message": "OTP verified successfully."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()
    new_password = payload.new_password
    
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
        
    if email not in otp_storage:
        raise HTTPException(status_code=400, detail="Invalid session.")
        
    stored = otp_storage[email]
    if time.time() > stored["expires_at"]:
        otp_storage.pop(email, None)
        raise HTTPException(status_code=400, detail="OTP code has expired.")
        
    if stored["otp"] != otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP verification code.")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Update password
    user.password_hash = hash_password(new_password)
    db.commit()
    
    # Clean up OTP
    otp_storage.pop(email, None)
    
    return {"status": "SUCCESS", "message": "Password changed successfully."}
