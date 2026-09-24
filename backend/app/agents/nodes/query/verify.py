import logging
from app.agents.nodes.query.state import QueryState, call_llm, format_context

logger = logging.getLogger("query_graph")


def verify_node(state: QueryState) -> dict:
    """
    Worker 3: Check if every claim in the generated answer is actually supported
    by the retrieved document context.
    """
    logger.info("[QUERY AGENT] Worker 3 (Verify): Verifying if answer is fully supported by context...")

    context_str = format_context(state["chunks"])
    prompt = (
        f"Context:\n{context_str}\n\nAnswer given: {state['answer']}\n\n"
        "Is every claim in this answer actually supported by the context above? Reply 'yes' or 'no'."
    )

    # Ask the LLM to verify factual accuracy based only on context
    reply_text = call_llm([{"role": "user", "content": prompt}]).lower()
    grounded = "yes" in reply_text
    retries = state.get("retry_count", 0) + 1

    updates = {"grounded": grounded, "retry_count": retries}

    # If not grounded, increase retrieval limit so next try gets more context
    if not grounded:
        new_limit = state.get("limit", 5) + 5
        updates["limit"] = new_limit
        logger.warning(
            "[QUERY AGENT] Worker 3 (Verify): Answer not grounded. Widening retrieval limit to %d",
            new_limit
        )
    else:
        logger.info("[QUERY AGENT] Worker 3 (Verify): Answer verified as grounded!")

    return updates


def route_after_verify(state: QueryState) -> str:
    """
    Conditional Edge: Decide whether to retry retrieval with more chunks or finish.
    """
    grounded = state.get("grounded", True)
    retries = state.get("retry_count", 0)

    # Retry if answer was not grounded and we haven't reached retry limit (2)
    if not grounded and retries < 2:
        decision = "retry"
    else:
        decision = "done"

    logger.info(
        "[QUERY AGENT] Conditional Edge (route_after_verify): grounded=%s, retries=%d -> Routing to '%s'",
        grounded,
        retries,
        decision
    )
    return decision
