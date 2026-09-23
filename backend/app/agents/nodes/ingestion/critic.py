import logging
import random
from app.agents.nodes.ingestion.classify import IngestionState, call_llm

logger = logging.getLogger("ingestion_graph")


def critic_node(state: IngestionState) -> dict:
    """Check some chunks to see if their generated context is good."""
    if len(state["chunks"]) == 0:
        retry_count = state.get("retry_count", 0)
        return {"chunks": [], "retry_count": retry_count + 1}

    number_to_check = max(1, len(state["chunks"]) // 5)
    sample = random.sample(state["chunks"], number_to_check)

    logger.info(
        "[INGESTION AGENT] Worker 4 (Critic): Spot-checking %d chunk(s) for quality...",
        len(sample)
    )

    passed_count = 0
    for chunk in sample:
        prompt = (
            f"Chunk: {chunk['text']}\n"
            f"Generated note: {chunk['context']}\n\n"
            "Is this note accurate and is the chunk understandable "
            "on its own? Reply 'yes' or 'no'."
        )

        reply = call_llm([{"role": "user", "content": prompt}]).lower()
        passed = "yes" in reply
        chunk["critic_passed"] = passed

        if passed:
            passed_count += 1
        else:
            chunk["context"] = ""
            logger.warning(
                "[INGESTION AGENT] Worker 4 (Critic): Chunk %d failed review. Flagged for re-enrichment.",
                chunk["chunk_index"]
            )

    logger.info(
        "[INGESTION AGENT] Worker 4 (Critic): %d/%d spot-checked chunk(s) passed",
        passed_count,
        len(sample)
    )

    retry_count = state.get("retry_count", 0)
    return {"chunks": state["chunks"], "retry_count": retry_count + 1}


def needs_redo(state: IngestionState) -> str:
    """Decide whether failed chunks should be processed again."""
    failed = any(chunk["critic_passed"] is False for chunk in state["chunks"])
    retries = state.get("retry_count", 0)
    decision = "redo" if failed and retries < 2 else "done"

    logger.info(
        "[INGESTION AGENT] Conditional Edge: failed=%s, retry_count=%d -> %s",
        failed,
        retries,
        decision
    )
    return decision
