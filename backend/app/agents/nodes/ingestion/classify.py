import logging
import os
from typing import List, Optional, TypedDict

from app.core.config import settings
from app.services.document_service import extract_pdf_text, get_groq_client

logger = logging.getLogger("ingestion_graph")


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
