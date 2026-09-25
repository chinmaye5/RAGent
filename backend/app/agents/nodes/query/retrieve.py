import logging
from sqlalchemy import select

from app.agents.nodes.query.state import QueryState, call_llm
from app.core.database import SessionSync
from app.models.models import Chunk as ChunkModel
from app.services.document_service import embedder

logger = logging.getLogger("query_graph")

DECOMPOSE_PROMPT = (
    "You are a search query optimizer. Given a user question, generate 1 to 3 targeted search queries.\n"
    "If the question is simple, return just the original question.\n"
    "If the question asks to compare or covers multiple topics, break it down into 2 or 3 distinct sub-queries.\n"
    "Output each search query on a new line. Do not include numbers, bullet points, or extra explanation."
)


def generate_sub_queries(question: str) -> list[str]:
    """
    Asks the LLM to break complex or multi-part questions into 1-3 simple search queries.
    If it's a simple question, returns just the original question.
    """
    # Fast-path check: If question is short (< 8 words) and contains no comparison words, skip LLM call
    words = question.lower().split()
    comparison_keywords = {"compare", "versus", "vs", "difference", "between", "both", "and", "also"}
    has_comparison = any(w in comparison_keywords for w in words)

    if len(words) < 8 and not has_comparison:
        logger.info("[QUERY AGENT] Fast-path single query used for short question: '%s'", question)
        return [question]

    messages = [
        {"role": "system", "content": DECOMPOSE_PROMPT},
        {"role": "user", "content": question},
    ]

    try:
        response = call_llm(messages)
        sub_queries = []
        for line in response.split("\n"):
            clean_line = line.strip(" -*0123456789.")
            if clean_line and len(clean_line) > 2:
                sub_queries.append(clean_line)

        # Fallback to original question if parsing failed
        if not sub_queries:
            sub_queries = [question]

        # Limit to max 3 sub-queries for speed
        return sub_queries[:3]
    except Exception as e:
        logger.warning("[QUERY AGENT] Sub-query decomposition failed (%s). Using original question.", e)
        return [question]



def retrieve_node(state: QueryState) -> dict:
    """
    Worker 1 (Retrieve): Uses Multi-Query Fan-Out Search.
    Breaks complex user questions into sub-queries, searches the database for each query,
    and combines unique matching chunks.
    """
    limit = state.get("limit", 5)
    question = state["question"]

    logger.info(
        "[QUERY AGENT] Worker 1 (Retrieve): Generating sub-queries for question='%s'...",
        question
    )

    # 1. Generate 1-3 targeted sub-queries
    sub_queries = generate_sub_queries(question)
    logger.info("[QUERY AGENT] Worker 1 (Retrieve): Generated sub-queries: %s", sub_queries)

    # Calculate max chunks to fetch per sub-query
    per_query_limit = max(3, limit // len(sub_queries))
    seen_indexes = set()
    chunks = []

    # 2. Query database for each sub-query and combine unique results
    with SessionSync() as session:
        for sub_q in sub_queries:
            query_embedding = embedder.encode([sub_q])[0].tolist()

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
                .limit(per_query_limit)
            )

            result = session.execute(stmt)
            rows = result.all()

            for row in rows:
                if row.chunk_index not in seen_indexes:
                    seen_indexes.add(row.chunk_index)
                    chunks.append({
                        "text": row.text,
                        "chunk_index": row.chunk_index
                    })

    logger.info(
        "[QUERY AGENT] Worker 1 (Retrieve): Total %d unique chunks gathered across %d sub-queries",
        len(chunks),
        len(sub_queries)
    )

    return {
        "chunks": chunks
    }
