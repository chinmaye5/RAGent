import os
import tempfile
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.agents.ingestion_graph import ingestion_graph
from app.agents.query_graph import query_graph
from app.api.routes.auth import get_current_user
from app.core.database import get_db
from app.models.models import Chat, ChatMessage, User
# Re-export helper functions for backwards compatibility
from app.services.document_service import embedder, extract_pdf_text, get_groq_client

router = APIRouter()


class ChatRequest(BaseModel):
    doc_id: str
    question: str
    chat_id: Optional[str] = None


@router.post("/document/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp_path = tmp.name
        content = await file.read()
        tmp.write(content)

    try:
        result = ingestion_graph.invoke(
            {"doc_path": tmp_path, "filename": file.filename, "chunks": [], "retry_count": 0}
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {"doc_id": result["doc_id"], "chunks_indexed": len(result["chunks"])}


@router.post("/chat")
async def chat_with_pdf(
    req: ChatRequest,
    current_user_email: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch logged in user
    user_res = await db.execute(select(User).where(User.email == current_user_email))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find or create Chat session
    chat = None
    if req.chat_id:
        try:
            chat_uuid = uuid.UUID(req.chat_id)
            chat_res = await db.execute(
                select(Chat).where(Chat.id == chat_uuid, Chat.user_id == user.id)
            )
            chat = chat_res.scalars().first()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid chat_id format")

    if not chat:
        try:
            doc_uuid = uuid.UUID(req.doc_id)
        except ValueError:
            doc_uuid = None

        title = req.question[:30] + "..." if len(req.question) > 30 else req.question
        chat = Chat(
            user_id=user.id,
            doc_id=doc_uuid,
            title=title,
        )
        db.add(chat)
        await db.commit()
        await db.refresh(chat)

    # Save user message to DB
    user_msg = ChatMessage(chat_id=chat.id, sender="user", text=req.question)
    db.add(user_msg)

    # Run LangGraph RAG chain
    result = query_graph.invoke(
        {"doc_id": req.doc_id, "question": req.question, "chunks": [], "retry_count": 0, "limit": 5}
    )
    if not result.get("chunks") and not result.get("answer"):
        raise HTTPException(status_code=404, detail="No document found with that doc_id, or it has no chunks")


    answer_text = result["answer"]

    # Save assistant message to DB
    assistant_msg = ChatMessage(chat_id=chat.id, sender="assistant", text=answer_text)
    db.add(assistant_msg)
    await db.commit()

    return {
        "chat_id": str(chat.id),
        "answer": answer_text,
        "sources": [c["chunk_index"] for c in result["chunks"]],
    }

