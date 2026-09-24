import logging
from app.agents.nodes.query.state import QueryState, SYSTEM_PROMPT, call_llm, format_context

logger = logging.getLogger("query_graph")


def answer_node(state: QueryState) -> dict:
    """
    Worker 2: Generate an answer using ONLY the retrieved context chunks.
    """
    chunks = state.get("chunks", [])
    logger.info(
        "[QUERY AGENT] Worker 2 (Answer): Generating grounded answer from %d chunk(s)...",
        len(chunks)
    )

    # Format the retrieved text chunks into readable context
    context_str = format_context(chunks)

    # Prepare prompt messages for the LLM
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Context:\n{context_str}\n\nQuestion: {state['question']}"
        },
    ]

    # Generate answer using LLM
    answer_text = call_llm(messages)
    logger.info("[QUERY AGENT] Worker 2 (Answer): Generated answer (%d chars)", len(answer_text))

    return {"answer": answer_text}
