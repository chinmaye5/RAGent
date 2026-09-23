import logging
from app.agents.nodes.ingestion.classify import IngestionState

logger = logging.getLogger("ingestion_graph")


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
