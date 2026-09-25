import logging
import os
from typing import List, TypedDict

from app.core.config import settings
from app.services.document_service import get_groq_client

logger = logging.getLogger("query_graph")

# Prompt given to the AI model so it only uses context from the database
SYSTEM_PROMPT = (
    "Answer using only the provided context. If the answer isn't in the "
    "context, say so plainly instead of guessing."
)


class QueryState(TypedDict):
    """
    State dictionary that holds data passed between graph nodes.
    
    Fields:
    - doc_id: ID of the document being searched
    - question: The user's question
    - chunks: List of matching document text snippets
    - answer: The final generated answer string
    - grounded: True if answer is supported by text chunks, False otherwise
    - retry_count: Number of retries attempted so far
    - limit: How many chunks to fetch from the database
    - query_type: Type of query ('chitchat' or 'rag')
    """
    doc_id: str
    question: str
    chunks: List[dict]
    answer: str
    grounded: bool
    retry_count: int
    limit: int
    query_type: str



def call_llm(messages: list) -> str:
    """
    Sends prompt messages through the LLM Gateway (with automatic fallback routing & token tracking).
    """
    from app.core.gateway import call_llm_gateway
    return call_llm_gateway(messages)



def format_context(chunks: list) -> str:
    """
    Helper to combine retrieved text chunks into a single formatted string.
    """
    context = ""
    for chunk in chunks:
        text = f"[Chunk {chunk['chunk_index']}] {chunk['text']}"
        context = context + text + "\n\n"
    return context
