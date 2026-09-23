import logging
import os
import random
from typing import List, Optional, TypedDict
import json

from langgraph.graph import END, StateGraph

from app.core.config import settings
from app.services.document_service import embedder, extract_pdf_text, get_groq_client

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

    """Add context to each chunk."""

    pending = []

    # Find chunks that don't have context yet
    for chunk in state["chunks"]:
        if chunk["context"] == "":
            pending.append(chunk)

    batch_size = 6

    # Process 6 chunks at a time
    for i in range(0, len(pending), batch_size):

        batch = pending[i:i + batch_size]

        chunk_list = ""

        for chunk in batch:
            chunk_list += (
                f"[{chunk['chunk_index']}] "
                f"{chunk['text']}\n\n"
            )

        prompt = (
            f"Full document:\n{state['full_text'][:4000]}\n\n"
            f"Chunks:\n{chunk_list}\n\n"
            "For each chunk, write one short sentence saying what it's about. "
            'Reply with ONLY a JSON object like {"0": "...", "1": "..."} mapping '
            "each chunk's number to its sentence."
        )

        reply = call_llm([
            {
                "role": "user",
                "content": prompt
            }
        ])

        notes = json.loads(reply)

        for chunk in batch:
            number = str(chunk["chunk_index"])
            note = notes.get(number, "")

            chunk["context"] = note

            chunk["embedding"] = embedder.encode(
                f"{note}\n\n{chunk['text']}"
            ).tolist()

    return {"chunks": state["chunks"]}



def critic_node(state: IngestionState) -> dict:

    """Check some chunks to see if their generated context is good."""

    # If there are no chunks, return
    if len(state["chunks"]) == 0:
        retry_count = state.get("retry_count", 0)

        return {
            "chunks": [],
            "retry_count": retry_count + 1
        }

    # Choose about 20% of the chunks
    number_to_check = max(1, len(state["chunks"]) // 5)

    sample = random.sample(
        state["chunks"],
        number_to_check
    )

    logger.info(
        "[INGESTION AGENT] Worker 4 (Critic): Spot-checking %d chunk(s) for quality...",
        len(sample)
    )

    passed_count = 0

    # Check each selected chunk
    for chunk in sample:

        prompt = (
            f"Chunk: {chunk['text']}\n"
            f"Generated note: {chunk['context']}\n\n"
            "Is this note accurate and is the chunk understandable "
            "on its own? Reply 'yes' or 'no'."
        )

        reply = call_llm([
            {
                "role": "user",
                "content": prompt
            }
        ])

        reply = reply.lower()

        if "yes" in reply:
            passed = True
        else:
            passed = False

        chunk["critic_passed"] = passed

        if passed:
            passed_count += 1

        else:
            chunk["context"] = ""

            logger.warning(
                "[INGESTION AGENT] Worker 4 (Critic): "
                "Chunk %d failed review. Flagged for re-enrichment.",
                chunk["chunk_index"]
            )

    logger.info(
        "[INGESTION AGENT] Worker 4 (Critic): %d/%d spot-checked chunk(s) passed",
        passed_count,
        len(sample)
    )

    retry_count = state.get("retry_count", 0)

    return {
        "chunks": state["chunks"],
        "retry_count": retry_count + 1
    }

def needs_redo(state: IngestionState) -> str:

    """Decide whether failed chunks should be processed again."""

    failed = False

    for chunk in state["chunks"]:
        if chunk["critic_passed"] is False:
            failed = True
            break

    retries = state.get("retry_count", 0)

    if failed and retries < 2:
        decision = "redo"
    else:
        decision = "done"

    logger.info(
        "[INGESTION AGENT] Conditional Edge: failed=%s, retry_count=%d -> %s",
        failed,
        retries,
        decision
    )

    return decision


from app.core.database import SessionSync
from app.models.models import Document, Chunk as ChunkModel


def persist_node(state: IngestionState) -> dict:
    """Worker 5: save everything to Postgres using SQLAlchemy ORM (Synchronous session for LangGraph)."""
    logger.info("[INGESTION AGENT] Worker 5 (Persist): Saving document metadata and %d chunk(s) via SQLAlchemy ORM...", len(state["chunks"]))
    
    with SessionSync() as session:
        doc = Document(
            filename=state["filename"],
            domain_type=state["domain_type"]
        )
        session.add(doc)
        session.flush()  # Populates doc.doc_id
        
        chunk_models = [
            ChunkModel(
                doc_id=doc.doc_id,
                chunk_index=c["chunk_index"],
                content_type=c["content_type"],
                text=c["text"],
                context=c["context"],
                embedding=c["embedding"],
            )
            for c in state["chunks"]
        ]
        session.add_all(chunk_models)
        session.commit()
        doc_id_str = str(doc.doc_id)

    logger.info("[INGESTION AGENT] Worker 5 (Persist): Document successfully persisted with doc_id=%s", doc_id_str)
    return {"doc_id": doc_id_str}


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
