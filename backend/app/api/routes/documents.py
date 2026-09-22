import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.agents.ingestion_graph import ingestion_graph
from app.agents.query_graph import query_graph
# Re-export helper functions for backwards compatibility
from app.services.document_service import embedder, extract_pdf_text, get_conn, get_groq_client

router = APIRouter()


class ChatRequest(BaseModel):
    doc_id: str
    question: str


@router.post("/document/upload")
async def upload_pdf(file: UploadFile = File(...)):
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
def chat_with_pdf(req: ChatRequest):
    result = query_graph.invoke(
        {"doc_id": req.doc_id, "question": req.question, "chunks": [], "retry_count": 0, "limit": 5}
    )
    if not result.get("chunks"):
        raise HTTPException(status_code=404, detail="No document found with that doc_id, or it has no chunks")
    return {"answer": result["answer"], "sources": [c["chunk_index"] for c in result["chunks"]]}