from langgraph.graph import END, StateGraph

from app.agents.nodes.ingestion import (
    IngestionState,
    chunk_node,
    classify_node,
    critic_node,
    enrich_node,
    needs_redo,
    persist_node,
)

builder = StateGraph(IngestionState)
builder.add_node("classify", classify_node)
builder.add_node("chunk", chunk_node)
builder.add_node("enrich", enrich_node)
builder.add_node("critic", critic_node)
builder.add_node("persist", persist_node)

builder.set_entry_point("classify")
builder.add_edge("classify", "chunk")
builder.add_edge("chunk", "enrich")
builder.add_edge("enrich", "critic")
builder.add_conditional_edges("critic", needs_redo, {"redo": "enrich", "done": "persist"})
builder.add_edge("persist", END)

ingestion_graph = builder.compile()
