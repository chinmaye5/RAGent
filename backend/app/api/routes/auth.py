import hashlib
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory session store mapping active token -> user email
active_tokens: dict[str, str] = {}


# Helper function to convert plain text password into a hashed string
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# Request body schema for Registration (Name, Email, Password)
class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


# Request body schema for Login (Email, Password)
class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# FastAPI Dependency to verify if request comes from a logged-in user
async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Header(None),
) -> str:
    user_token = None
    if authorization:
        if authorization.startswith("Bearer "):
            user_token = authorization.split(" ")[1]
        else:
            user_token = authorization
    elif token:
        user_token = token

    if not user_token or user_token not in active_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized. Please log in first.",
        )

    return active_tokens[user_token]


@router.post("/register")
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.lower().strip()

    # Check if email is already registered
    result = await db.execute(select(User).where(User.email == clean_email))
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Please login instead.",
        )

    # Hash the password and store the new user
    hashed_pwd = hash_password(req.password)
    new_user = User(
        name=req.name.strip(),
        email=clean_email,
        password_hash=hashed_pwd,
    )
    db.add(new_user)
    await db.commit()

    return {"message": "User registered successfully!"}


@router.post("/login")
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.lower().strip()

    # Find user by email
    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalars().first()

    # Verify user existence and password hash match
    if not user or user.password_hash != hash_password(req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Generate a random login token
    auth_token = secrets.token_hex(16)
    active_tokens[auth_token] = user.email

    return {
        "message": "Login successful!",
        "token": auth_token,
        "name": user.name,
        "email": user.email,
    }


@router.get("/me")
async def get_me(current_user: str = Depends(get_current_user)):
    return {"email": current_user, "status": "Logged in"}
