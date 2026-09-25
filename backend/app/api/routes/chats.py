import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.agents.query_graph import query_graph
from app.api.routes.auth import get_current_user
from app.core.database import get_db
from app.models.models import Chat, ChatMessage, User

router = APIRouter(prefix="/chats", tags=["chats"])


class CreateChatRequest(BaseModel):
    doc_id: Optional[str] = None
    title: Optional[str] = "New Chat"


class SendMessageRequest(BaseModel):
    chat_id: Optional[str] = None
    doc_id: str
    question: str


# Helper to fetch User DB object from email returned by get_current_user
async def get_user_by_email(email: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("")
async def list_chats(
    current_user_email: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all chat conversations for the logged in user (perfect for sidebar listing)."""
    user = await get_user_by_email(current_user_email, db)

    result = await db.execute(
        select(Chat)
        .where(Chat.user_id == user.id)
        .order_by(Chat.created_at.desc())
    )
    chats = result.scalars().all()

    return [
        {
            "chat_id": str(chat.id),
            "doc_id": str(chat.doc_id) if chat.doc_id else None,
            "title": chat.title,
            "created_at": chat.created_at.isoformat() if chat.created_at else None,
        }
        for chat in chats
    ]


@router.post("")
async def create_chat(
    req: CreateChatRequest,
    current_user_email: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new empty chat session."""
    user = await get_user_by_email(current_user_email, db)

    doc_uuid = uuid.UUID(req.doc_id) if req.doc_id else None

    new_chat = Chat(
        user_id=user.id,
        doc_id=doc_uuid,
        title=req.title or "New Chat",
    )
    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)

    return {
        "chat_id": str(new_chat.id),
        "doc_id": str(new_chat.doc_id) if new_chat.doc_id else None,
        "title": new_chat.title,
        "created_at": new_chat.created_at.isoformat() if new_chat.created_at else None,
    }


@router.get("/{chat_id}/messages")
async def get_chat_messages(
    chat_id: str,
    current_user_email: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetches all past messages for a specific chat conversation."""
    user = await get_user_by_email(current_user_email, db)

    try:
        chat_uuid = uuid.UUID(chat_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid chat_id format")

    result = await db.execute(
        select(Chat).where(Chat.id == chat_uuid, Chat.user_id == user.id)
    )
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")

    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_id == chat_uuid)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msg_result.scalars().all()

    return [
        {
            "id": str(msg.id),
            "sender": msg.sender,
            "text": msg.text,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        for msg in messages
    ]


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user_email: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a chat conversation and all its messages."""
    user = await get_user_by_email(current_user_email, db)

    try:
        chat_uuid = uuid.UUID(chat_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid chat_id format")

    result = await db.execute(
        select(Chat).where(Chat.id == chat_uuid, Chat.user_id == user.id)
    )
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")

    await db.delete(chat)
    await db.commit()

    return {"message": "Chat session deleted successfully"}
