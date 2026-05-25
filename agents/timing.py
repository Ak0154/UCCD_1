import time
import asyncio
import logging
import functools

logger = logging.getLogger(__name__)


def time_node(node_name: str):
    def decorator(func):
        @functools.wraps(func)
        def sync_wrapper(state, *args, **kwargs):
            complaint_id = state.get("complaint_id", "unknown")
            start = time.perf_counter()
            logger.info("[%s] START | complaint_id=%s", node_name, complaint_id)
            try:
                result = func(state, *args, **kwargs)
                elapsed = (time.perf_counter() - start) * 1000
                logger.info("[%s] DONE | complaint_id=%s | elapsed=%.1fms", node_name, complaint_id, elapsed)
                return result
            except Exception:
                elapsed = (time.perf_counter() - start) * 1000
                logger.error("[%s] FAILED | complaint_id=%s | elapsed=%.1fms", node_name, complaint_id, elapsed, exc_info=True)
                raise

        @functools.wraps(func)
        async def async_wrapper(state, *args, **kwargs):
            complaint_id = state.get("complaint_id", "unknown")
            start = time.perf_counter()
            logger.info("[%s] START | complaint_id=%s", node_name, complaint_id)
            try:
                result = await func(state, *args, **kwargs)
                elapsed = (time.perf_counter() - start) * 1000
                logger.info("[%s] DONE | complaint_id=%s | elapsed=%.1fms", node_name, complaint_id, elapsed)
                return result
            except Exception:
                elapsed = (time.perf_counter() - start) * 1000
                logger.error("[%s] FAILED | complaint_id=%s | elapsed=%.1fms", node_name, complaint_id, elapsed, exc_info=True)
                raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator