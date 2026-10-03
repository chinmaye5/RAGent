import os
import requests
from fastapi import HTTPException
from pdfplumber import open as open_pdf
from groq import Groq

from app.core.config import settings

class JinaEmbedder:
    """Lightweight API-based embedder using Jina AI embeddings (no heavy PyTorch / local models)."""
    def __init__(self):
        self.url = "https://api.jina.ai/v1/embeddings"
        self.model = "jina-embeddings-v3"
        self.dimensions = 384

    def _get_api_key(self) -> str:
        return os.environ.get("JINA_API_KEY") or settings.jina_api_key

    def encode(self, texts, **kwargs):
        """
        Encodes a single string or list of strings into embedding vectors.
        Matches the interface expected by sentence-transformers / embedder.encode.
        """
        api_key = self._get_api_key()
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="JINA_API_KEY is missing from environment variables or .env file."
            )

        is_single = isinstance(texts, str)
        input_list = [texts] if is_single else list(texts)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": self.model,
            "dimensions": self.dimensions,
            "input": input_list
        }

        try:
            response = requests.post(self.url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Sort vectors by index to preserve input order
            embeddings_data = sorted(data["data"], key=lambda x: x["index"])
            vectors = [item["embedding"] for item in embeddings_data]

            import numpy as np
            result_array = np.array(vectors, dtype=np.float32)
            
            if is_single:
                return result_array[0]
            return result_array

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Jina AI Embeddings API call failed: {str(e)}"
            )

embedder = JinaEmbedder()


def get_groq_client() -> Groq:
    """Returns initialized Groq API client."""
    api_key = os.environ.get("GROQ_API_KEY") or settings.groq_api_key
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured in environment variables or .env file."
        )
    return Groq(api_key=api_key)


def extract_pdf_text(path: str) -> str:
    """Extracts all text content from a PDF file path."""
    with open_pdf(path) as pdf:
        return "\n\n".join(p.extract_text() or "" for p in pdf.pages)
