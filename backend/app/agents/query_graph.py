from langgraph.graph import END, StateGraph

from app.agents.nodes.query import (
    QueryState,
    router_node,
    route_after_router,
    retrieve_node,
    answer_node,
    verify_node,
    route_after_verify,
)

# 1. Initialize graph with state definition
builder = StateGraph(QueryState)

# 2. Add node functions to graph
builder.add_node("router", router_node)
builder.add_node("retrieve", retrieve_node)
builder.add_node("answer", answer_node)
builder.add_node("verify", verify_node)

# 3. Define entry point and control flow
builder.set_entry_point("router")

# 4. Add conditional routing from Router Agent (fast chitchat vs document RAG)
builder.add_conditional_edges(
    "router",
    route_after_router,
    {
        "done": END,
        "rag": "retrieve",
    }
)

builder.add_edge("retrieve", "answer")
builder.add_edge("answer", "verify")

# 5. Add conditional edge after verification step
builder.add_conditional_edges(
    "verify",
    route_after_verify,
    {
        "retry": "retrieve",
        "done": END
    }
)

# 6. Compile executable LangGraph graph
query_graph = builder.compile()

