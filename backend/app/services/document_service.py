import os
from typing import List

from fastapi import HTTPException
from groq import Groq
from pdfplumber import open as open_pdf
from pgvector.psycopg2 import register_vector
import psycopg2
from sentence_transformers import SentenceTransformer

from app.core.config import settings

# Lazy Singleton Embedder (prevents HF hub check & model load on server startup/reload)
_embedder_instance = None


def get_embedder() -> SentenceTransformer:
    global _embedder_instance
    if _embedder_instance is None:
        os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
        _embedder_instance = SentenceTransformer("BAAI/bge-small-en-v1.5")
    return _embedder_instance


class LazyEmbedderProxy:
    def encode(self, *args, **kwargs):
        return get_embedder().encode(*args, **kwargs)


embedder = LazyEmbedderProxy()


def get_groq_client() -> Groq:
    """Returns initialized Groq API client."""
    api_key = os.environ.get("GROQ_API_KEY") or settings.groq_api_key
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured in environment variables or .env file."
        )
    return Groq(api_key=api_key)


def get_conn():
    """Returns PostgreSQL connection with pgvector registered."""
    db_url = settings.psycopg_db_url
    if not db_url:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_DB_URL or DATABASE_URL environment variable is not configured."
        )
    conn = psycopg2.connect(db_url)
    register_vector(conn)  # lets psycopg2 read/write vector type directly
    return conn


def extract_pdf_text(path: str) -> str:
    """Extracts all text content from a PDF file path."""
    with open_pdf(path) as pdf:
        return "\n\n".join(p.extract_text() or "" for p in pdf.pages)
