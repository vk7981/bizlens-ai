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
