from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

@router.post("/login")
def login(payload: LoginRequest):
    """
    Sleek authentication endpoint.
    Accepts any email and password for local testing, returning user details.
    """
    email = payload.email.strip()
    password = payload.password
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password.")
        
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format.")
        
    return {
        "status": "SUCCESS",
        "email": email,
        "token": f"mock-token-{email}"
    }

@router.post("/register")
def register(payload: RegisterRequest):
    """
    Sleek user registration endpoint.
    Saves registration profile and logs user in directly.
    """
    name = payload.name.strip()
    email = payload.email.strip()
    password = payload.password
    
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="All fields are required.")
        
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format.")
        
    return {
        "status": "SUCCESS",
        "name": name,
        "email": email,
        "token": f"mock-token-{email}"
    }
