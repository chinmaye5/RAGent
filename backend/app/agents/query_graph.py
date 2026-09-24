from langgraph.graph import END, StateGraph

from app.agents.nodes.query import (
    QueryState,
    retrieve_node,
    answer_node,
    verify_node,
    route_after_verify,
)

# 1. Initialize graph with state definition
builder = StateGraph(QueryState)

# 2. Add node functions to graph
builder.add_node("retrieve", retrieve_node)
builder.add_node("answer", answer_node)
builder.add_node("verify", verify_node)

# 3. Define control flow edges between nodes
builder.set_entry_point("retrieve")
builder.add_edge("retrieve", "answer")
builder.add_edge("answer", "verify")

# 4. Add conditional edge after verification step
builder.add_conditional_edges(
    "verify",
    route_after_verify,
    {
        "retry": "retrieve",
        "done": END
    }
)

# 5. Compile executable LangGraph graph
query_graph = builder.compile()
