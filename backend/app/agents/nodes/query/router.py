import logging
from app.agents.nodes.query.state import QueryState, call_llm

logger = logging.getLogger("query_graph")

FAST_ROUTER_PROMPT = (
    "Classify the following user message into exactly one category:\n"
    "- 'chitchat': simple greetings, polite remarks, or conversational queries (e.g., 'hi', 'hello', 'how are you', 'who are you', 'thanks')\n"
    "- 'rag': any question requesting information, facts, summary, analysis, or details about a document or specific topic.\n\n"
    "Respond with ONLY the word 'chitchat' or 'rag'."
)


def router_node(state: QueryState) -> dict:
    """
    Router Agent: Quickly determines if the user query is simple conversational chitchat
    or requires full vector search & RAG retrieval.
    """
    question = state["question"].strip()
    logger.info("[QUERY AGENT] Router: Classifying query intent for: '%s'", question)

    # Short circuit empty or ultra-short greetings instantly without LLM if obvious
    lower_q = question.lower().strip("!.,?")
    if lower_q in {"hi", "hello", "hey", "who are you", "what can you do", "thanks", "thank you"}:
        logger.info("[QUERY AGENT] Router: Fast-path greeting detected without LLM call.")
        greeting_responses = {
            "hi": "Hello! How can I help you analyze your document today?",
            "hello": "Hello! How can I help you analyze your document today?",
            "hey": "Hey there! Ask me any question about your document.",
            "who are you": "I am your RAG AI Assistant. Upload a PDF document and ask me questions about it!",
            "what can you do": "I can analyze uploaded PDF documents, extract relevant information, and answer your questions accurately.",
            "thanks": "You're very welcome! Let me know if you have any other questions.",
            "thank you": "You're very welcome! Let me know if you have any other questions.",
        }
        answer = greeting_responses.get(lower_q, "Hello! How can I help you today?")
        return {"query_type": "chitchat", "answer": answer, "chunks": []}

    messages = [
        {"role": "system", "content": FAST_ROUTER_PROMPT},
        {"role": "user", "content": f"User message: {question}"},
    ]

    try:
        category = call_llm(messages).lower().strip()
        if "chitchat" in category:
            query_type = "chitchat"
            # Fast conversational answer
            ans_messages = [
                {"role": "system", "content": "You are a helpful AI assistant. Answer the user conversationally and politely in 1-2 sentences."},
                {"role": "user", "content": question},
            ]
            answer = call_llm(ans_messages)
        else:
            query_type = "rag"
            answer = ""
    except Exception as e:
        logger.warning("[QUERY AGENT] Router classification failed (%s), defaulting to RAG path.", e)
        query_type = "rag"
        answer = ""

    logger.info("[QUERY AGENT] Router: Classified as '%s'", query_type)
    return {"query_type": query_type, "answer": answer}


def route_after_router(state: QueryState) -> str:
    """
    Conditional Edge: Routes to END for direct chitchat answers, or to 'retrieve' for RAG queries.
    """
    query_type = state.get("query_type", "rag")
    if query_type == "chitchat":
        return "done"
    return "rag"
