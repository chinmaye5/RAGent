import logging
from sqlalchemy import select

from app.core.database import SessionSync
from app.models.models import Chunk as ChunkModel
from app.services.document_service import embedder
from app.agents.nodes.query.state import QueryState

logger = logging.getLogger("query_graph")


def retrieve_node(state: QueryState) -> dict:
    """
    Worker 1: Find the text chunks in the database that are most relevant
    to the user's question using vector similarity search.
    """
    limit = state.get("limit", 5)

    logger.info(
        "[QUERY AGENT] Worker 1 (Retrieve): Searching top %d chunks for doc_id=%s...",
        limit,
        state.get("doc_id")
    )

    # 1. Convert user's question into vector embedding numbers
    question = state["question"]
    query_embedding = embedder.encode([question])[0].tolist()

    # 2. Connect to database and find closest matching chunks
    with SessionSync() as session:
        stmt = (
            select(
                ChunkModel.text,
                ChunkModel.chunk_index
            )
            .where(
                ChunkModel.doc_id == state["doc_id"]
            )
            .order_by(
                ChunkModel.embedding.l2_distance(query_embedding)
            )
            .limit(limit)
        )

        result = session.execute(stmt)
        rows = result.all()

        chunks = []
        for row in rows:
            chunk = {
                "text": row.text,
                "chunk_index": row.chunk_index
            }
            chunks.append(chunk)

    logger.info(
        "[QUERY AGENT] Worker 1 (Retrieve): Retrieved %d matching chunks",
        len(chunks)
    )

    # Return updated state dictionary containing retrieved chunks
    return {
        "chunks": chunks
    }
