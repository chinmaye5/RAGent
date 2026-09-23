import json
from app.agents.nodes.ingestion.classify import IngestionState, call_llm
from app.services.document_service import embedder


def enrich_node(state: IngestionState) -> dict:
    """Add context to each chunk."""
    pending = []
    for chunk in state["chunks"]:
        if chunk["context"] == "":
            pending.append(chunk)

    batch_size = 6
    for i in range(0, len(pending), batch_size):
        batch = pending[i:i + batch_size]
        chunk_list = ""
        for chunk in batch:
            chunk_list += f"[{chunk['chunk_index']}] {chunk['text']}\n\n"

        prompt = (
            f"Full document:\n{state['full_text'][:4000]}\n\n"
            f"Chunks:\n{chunk_list}\n\n"
            "For each chunk, write one short sentence saying what it's about. "
            'Reply with ONLY a JSON object like {"0": "...", "1": "..."} mapping '
            "each chunk's number to its sentence."
        )

        reply = call_llm([{"role": "user", "content": prompt}])
        notes = json.loads(reply)

        for chunk in batch:
            number = str(chunk["chunk_index"])
            note = notes.get(number, "")
            chunk["context"] = note
            chunk["embedding"] = embedder.encode(f"{note}\n\n{chunk['text']}").tolist()

    return {"chunks": state["chunks"]}
