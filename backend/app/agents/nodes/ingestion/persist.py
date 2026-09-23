import logging
from app.agents.nodes.ingestion.classify import IngestionState
from app.core.database import SessionSync
from app.models.models import Document, Chunk as ChunkModel

logger = logging.getLogger("ingestion_graph")


def persist_node(state: IngestionState) -> dict:
    """Worker 5: save everything to Postgres using SQLAlchemy ORM."""
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
