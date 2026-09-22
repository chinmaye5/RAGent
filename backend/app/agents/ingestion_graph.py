import logging
import os
import random
from typing import List, Optional, TypedDict
import json

from langgraph.graph import END, StateGraph
from psycopg2.extras import execute_values

from app.core.config import settings
from app.services.document_service import embedder, extract_pdf_text, get_conn, get_groq_client

logger = logging.getLogger("ingestion_graph")


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


class Chunk(TypedDict):
    chunk_index: int
    content_type: str
    text: str
    context: str
    embedding: Optional[list]
    critic_passed: Optional[bool]


class IngestionState(TypedDict):
    doc_path: str
    filename: str
    doc_id: str
    full_text: str
    domain_type: str
    chunks: List[Chunk]
    retry_count: int


def classify_node(state: IngestionState) -> dict:
    """Worker 1: read the whole document once, decide what kind it is."""
    logger.info("[INGESTION AGENT] Worker 1 (Classify): Reading document '%s'...", state.get("filename", "unknown"))
    full_text = extract_pdf_text(state["doc_path"])
    prompt = (
        "Classify this document as exactly one of: research_paper, legal_contract, "
        "financial_filing, general. Reply with only that one word.\n\n" + full_text[:3000]
    )
    domain = call_llm([{"role": "user", "content": prompt}]).lower()
    logger.info("[INGESTION AGENT] Worker 1 (Classify): Classified document domain as '%s'", domain)
    return {"full_text": full_text, "domain_type": domain}


def chunk_node(state: IngestionState) -> dict:
    """Worker 2: split the text into pieces. No LLM call — just splitting."""
    logger.info("[INGESTION AGENT] Worker 2 (Chunk): Splitting full text into chunks...")
    words = state["full_text"].split()
    size, overlap = 500, 50
    step = size - overlap
    pieces = [" ".join(words[i:i + size]) for i in range(0, len(words), step) if words[i:i + size]]
    chunks = [
        {
            "chunk_index": i,
            "content_type": "narrative",
            "text": text,
            "context": "",
            "embedding": None,
            "critic_passed": None,
        }
        for i, text in enumerate(pieces)
    ]
    logger.info("[INGESTION AGENT] Worker 2 (Chunk): Created %d chunk(s)", len(chunks))
    return {"chunks": chunks}



def enrich_node(state: IngestionState) -> dict:
    """Batch chunks together so one LLM call handles many chunks, not one call per chunk."""
    pending = [c for c in state["chunks"] if not c["context"]]
    batch_size = 6
    for i in range(0, len(pending), batch_size):
        batch = pending[i:i + batch_size]
        chunk_list = "\n\n".join(f"[{c['chunk_index']}] {c['text']}" for c in batch)
        prompt = (
            f"Full document:\n{state['full_text'][:4000]}\n\n"
            f"Chunks:\n{chunk_list}\n\n"
            "For each chunk, write one short sentence saying what it's about. "
            'Reply with ONLY a JSON object like {"0": "...", "1": "..."} mapping '
            "each chunk's number to its sentence."
        )
        reply = call_llm([{"role": "user", "content": prompt}])
        notes = json.loads(reply)
        for c in batch:
            note = notes.get(str(c["chunk_index"]), "")
            c["context"] = note
            c["embedding"] = embedder.encode(f"{note}\n\n{c['text']}").tolist()
    return {"chunks": state["chunks"]}


def critic_node(state: IngestionState) -> dict:
    """Worker 4: spot-check ~20% of chunks. Flags bad ones so enrich_node redoes just those."""
    if not state["chunks"]:
        return {"chunks": [], "retry_count": state.get("retry_count", 0) + 1}
    sample = random.sample(state["chunks"], max(1, len(state["chunks"]) // 5))
    logger.info("[INGESTION AGENT] Worker 4 (Critic): Spot-checking %d chunk(s) for quality...", len(sample))
    passed_count = 0
    for chunk in sample:
        prompt = (
            f"Chunk: {chunk['text']}\nGenerated note: {chunk['context']}\n\n"
            "Is this note accurate and is the chunk understandable on its own? Reply 'yes' or 'no'."
        )
        reply_text = call_llm([{"role": "user", "content": prompt}]).lower()
        passed = "yes" in reply_text
        chunk["critic_passed"] = passed
        if passed:
            passed_count += 1
        else:
            chunk["context"] = ""  # blank it so enrich_node regenerates just this one
            logger.warning("[INGESTION AGENT] Worker 4 (Critic): Chunk %d failed review. Flagged for re-enrichment.", chunk["chunk_index"])
    logger.info("[INGESTION AGENT] Worker 4 (Critic): %d/%d spot-checked chunk(s) passed", passed_count, len(sample))
    return {"chunks": state["chunks"], "retry_count": state.get("retry_count", 0) + 1}


def needs_redo(state: IngestionState) -> str:
    """The fork: any chunk failed, and haven't retried too many times yet?"""
    failed = any(c["critic_passed"] is False for c in state["chunks"])
    retries = state.get("retry_count", 0)
    decision = "redo" if failed and retries < 2 else "done"
    logger.info("[INGESTION AGENT] Conditional Edge (needs_redo): failed=%s, retry_count=%d -> Routing to '%s'", failed, retries, decision)
    return decision


def persist_node(state: IngestionState) -> dict:
    """Worker 5: save everything to Postgres."""
    logger.info("[INGESTION AGENT] Worker 5 (Persist): Saving document metadata and %d chunk(s) to PostgreSQL...", len(state["chunks"]))
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            "insert into documents (filename, domain_type) values (%s, %s) returning doc_id",
            (state["filename"], state["domain_type"]),
        )
        doc_id = cur.fetchone()[0]
        rows = [
            (doc_id, c["chunk_index"], c["content_type"], c["text"], c["context"], c["embedding"])
            for c in state["chunks"]
        ]
        execute_values(
            cur,
            "insert into chunks (doc_id, chunk_index, content_type, text, context, embedding) values %s",
            rows,
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()
    logger.info("[INGESTION AGENT] Worker 5 (Persist): Document successfully persisted with doc_id=%s", doc_id)
    return {"doc_id": str(doc_id)}


builder = StateGraph(IngestionState)
builder.add_node("classify", classify_node)
builder.add_node("chunk", chunk_node)
builder.add_node("enrich", enrich_node)
builder.add_node("critic", critic_node)
builder.add_node("persist", persist_node)

builder.set_entry_point("classify")
builder.add_edge("classify", "chunk")
builder.add_edge("chunk", "enrich")
builder.add_edge("enrich", "critic")
builder.add_conditional_edges("critic", needs_redo, {"redo": "enrich", "done": "persist"})
builder.add_edge("persist", END)

ingestion_graph = builder.compile()
