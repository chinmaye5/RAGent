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
    """
    doc_id: str
    question: str
    chunks: List[dict]
    answer: str
    grounded: bool
    retry_count: int
    limit: int


def call_llm(messages: list) -> str:
    """
    Sends a list of prompt messages to the Groq LLM API.
    If the default model fails, automatically tries a fallback model.
    """
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


def format_context(chunks: list) -> str:
    """
    Helper to combine retrieved text chunks into a single formatted string.
    """
    context = ""
    for chunk in chunks:
        text = f"[Chunk {chunk['chunk_index']}] {chunk['text']}"
        context = context + text + "\n\n"
    return context
