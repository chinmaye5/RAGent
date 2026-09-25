import logging
import os
import time
from typing import Any, Dict, List, Optional

import litellm
from litellm import completion

from app.core.config import settings

logger = logging.getLogger("gateway")

# Silence noisy litellm verbose logs
litellm.suppress_debug_info = True

# Global metrics tracker for LLM requests
metrics_store: Dict[str, Any] = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "total_prompt_tokens": 0,
    "total_completion_tokens": 0,
    "total_tokens": 0,
    "recent_calls": [],
}


def call_llm_gateway(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    fallbacks: Optional[List[str]] = None,
) -> str:
    """
    LLM Gateway Call:
    - Sets API keys dynamically.
    - Routes request to primary model with automatic fallback routing if primary fails.
    - Tracks token usage, latency, and request metrics.
    """
    api_key = os.environ.get("GROQ_API_KEY") or settings.groq_api_key
    if api_key:
        os.environ["GROQ_API_KEY"] = api_key

    # Target model format for LiteLLM (e.g., 'groq/llama-3.3-70b-versatile')
    primary_model = model or os.environ.get("GROQ_MODEL") or settings.groq_model
    if not primary_model.startswith("groq/"):
        primary_model = f"groq/{primary_model}"

    fallback_models = fallbacks or ["groq/openai/gpt-oss-120b", "groq/openai/gpt-oss-20b", "groq/qwen/qwen3.8-27b"]



    metrics_store["total_requests"] += 1
    start_time = time.time()

    try:
        logger.info("[LLM GATEWAY] Routing request to primary model: %s", primary_model)
        
        response = completion(
            model=primary_model,
            messages=messages,
            fallbacks=fallback_models,
        )

        latency_ms = round((time.time() - start_time) * 1000, 2)
        reply_content = response.choices[0].message.content.strip()

        # Extract token usage metadata from Gateway response
        usage = getattr(response, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
        completion_tokens = getattr(usage, "completion_tokens", 0) if usage else 0
        total_tokens = getattr(usage, "total_tokens", 0) if usage else 0

        # Update metrics store
        metrics_store["successful_requests"] += 1
        metrics_store["total_prompt_tokens"] += prompt_tokens
        metrics_store["total_completion_tokens"] += completion_tokens
        metrics_store["total_tokens"] += total_tokens

        call_record = {
            "model_used": getattr(response, "model", primary_model),
            "latency_ms": latency_ms,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        metrics_store["recent_calls"].append(call_record)
        # Keep max 50 recent calls in memory
        if len(metrics_store["recent_calls"]) > 50:
            metrics_store["recent_calls"].pop(0)

        logger.info(
            "[LLM GATEWAY] Success (%s ms) | Tokens: %d (prompt: %d, completion: %d)",
            latency_ms,
            total_tokens,
            prompt_tokens,
            completion_tokens,
        )

        return reply_content

    except Exception as e:
        metrics_store["failed_requests"] += 1
        logger.error("[LLM GATEWAY] Request failed: %s", e)
        raise e


def get_gateway_metrics() -> Dict[str, Any]:
    """Returns current accumulated usage metrics from the Gateway."""
    return metrics_store
