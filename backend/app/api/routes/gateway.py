from fastapi import APIRouter
from app.core.gateway import get_gateway_metrics

router = APIRouter(prefix="/gateway", tags=["gateway"])


@router.get("/metrics")
def get_metrics():
    """Returns real-time usage metrics and token analytics from the LLM Gateway."""
    return get_gateway_metrics()
