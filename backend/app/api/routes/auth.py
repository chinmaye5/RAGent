from datetime import datetime, timedelta, timezone
import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
import jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


# Helper function to convert plain text password into a hashed string
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# Helper function to create JWT access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiration_hours)
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


# Request body schema for Registration (Name, Email, Password)
class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


# Request body schema for Login (Email, Password)
class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# FastAPI Dependency to verify if request comes from a logged-in user (verifies JWT)
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

    if not user_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized. Missing authentication token.",
        )

    try:
        payload = jwt.decode(
            user_token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token payload.",
            )
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )


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

    # Generate JWT token
    auth_token = create_access_token({"sub": user.email})

    return {
        "message": "Login successful!",
        "token": auth_token,
        "name": user.name,
        "email": user.email,
    }


@router.get("/me")
async def get_me(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == current_user))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return {
        "email": user.email,
        "name": user.name,
        "status": "Logged in",
    }
