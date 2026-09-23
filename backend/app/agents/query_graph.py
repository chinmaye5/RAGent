import logging
import os
from typing import List, TypedDict

from langgraph.graph import END, StateGraph

from app.core.config import settings
from app.services.document_service import embedder, get_groq_client

logger = logging.getLogger("query_graph")

SYSTEM_PROMPT = (
    "Answer using only the provided context. If the answer isn't in the "
    "context, say so plainly instead of guessing."
)


def call_llm(messages: list) -> str:
    """Helper to invoke Groq LLM with fallback model if primary model fails."""
    client = get_groq_client()
    model = os.environ.get("GROQ_MODEL") or settings.groq_model
    try:
        reply = client.chat.completions.create(model=model, messages=messages)
        return reply.choices[0].message.content.strip()
    except Exception as e:
        if "openai/gpt-oss-120b" in model or "model_not_found" in str(e).lower():
            reply = client.chat.completions.create(
                model="meta-llama/llama-prompt-guard-2-22m",
                messages=messages
            )
            return reply.choices[0].message.content.strip()
        raise e


class QueryState(TypedDict):
    doc_id: str
    question: str
    chunks: List[dict]
    answer: str
    grounded: bool
    retry_count: int
    limit: int


def format_context(chunks) -> str:
    return "\n\n".join(f"[Chunk {c['chunk_index']}] {c['text']}" for c in chunks)


from sqlalchemy import select
from app.core.database import SessionSync
from app.models.models import Chunk as ChunkModel


def retrieve_node(state: QueryState) -> dict:
    """Worker 1: find the most relevant chunks for this question using SQLAlchemy ORM vector search."""
    limit = state.get("limit", 5)
    logger.info("[QUERY AGENT] Worker 1 (Retrieve): Searching top %d vector matching chunk(s) for doc_id=%s...", limit, state.get("doc_id"))
    query_embedding = embedder.encode([state["question"]])[0].tolist()

    with SessionSync() as session:
        stmt = (
            select(ChunkModel.text, ChunkModel.chunk_index)
            .where(ChunkModel.doc_id == state["doc_id"])
            .order_by(ChunkModel.embedding.l2_distance(query_embedding))
            .limit(limit)
        )
        res = session.execute(stmt)
        chunks = [{"text": row.text, "chunk_index": row.chunk_index} for row in res.all()]

    logger.info("[QUERY AGENT] Worker 1 (Retrieve): Retrieved %d matching chunk(s)", len(chunks))
    return {"chunks": chunks}


def answer_node(state: QueryState) -> dict:
    """Worker 2: write the answer using only those chunks."""
    logger.info("[QUERY AGENT] Worker 2 (Answer): Generating grounded answer from %d chunk(s)...", len(state.get("chunks", [])))
    context_str = format_context(state["chunks"])
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {state['question']}"},
    ]
    answer_text = call_llm(messages)
    logger.info("[QUERY AGENT] Worker 2 (Answer): Generated answer (%d chars)", len(answer_text))
    return {"answer": answer_text}


def verify_node(state: QueryState) -> dict:
    """Worker 3: is every claim in the answer actually backed by the context?"""
    logger.info("[QUERY AGENT] Worker 3 (Verify): Verifying if answer is fully supported by context...")
    context_str = format_context(state["chunks"])
    prompt = (
        f"Context:\n{context_str}\n\nAnswer given: {state['answer']}\n\n"
        "Is every claim in this answer actually supported by the context above? Reply 'yes' or 'no'."
    )
    reply_text = call_llm([{"role": "user", "content": prompt}]).lower()
    grounded = "yes" in reply_text
    retries = state.get("retry_count", 0) + 1
    updates = {"grounded": grounded, "retry_count": retries}
    if not grounded:
        new_limit = state.get("limit", 5) + 5
        updates["limit"] = new_limit  # widen the search net on retry
        logger.warning("[QUERY AGENT] Worker 3 (Verify): Answer not grounded. Widening retrieval limit to %d", new_limit)
    else:
        logger.info("[QUERY AGENT] Worker 3 (Verify): Answer verified as grounded!")
    return updates


def route_after_verify(state: QueryState) -> str:
    grounded = state.get("grounded", True)
    retries = state.get("retry_count", 0)
    decision = "retry" if not grounded and retries < 2 else "done"
    logger.info("[QUERY AGENT] Conditional Edge (route_after_verify): grounded=%s, retries=%d -> Routing to '%s'", grounded, retries, decision)
    return decision


builder = StateGraph(QueryState)
builder.add_node("retrieve", retrieve_node)
builder.add_node("answer", answer_node)
builder.add_node("verify", verify_node)

builder.set_entry_point("retrieve")
builder.add_edge("retrieve", "answer")
builder.add_edge("answer", "verify")
builder.add_conditional_edges("verify", route_after_verify, {"retry": "retrieve", "done": END})

query_graph = builder.compile()
