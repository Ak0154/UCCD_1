import os
import asyncio
import logging
from enum import Enum
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_global_client: Optional[httpx.AsyncClient] = None


def _get_global_client() -> httpx.AsyncClient:
    global _global_client
    if _global_client is None:
        api_key = os.getenv("SARVAM_ACCESS_TOKEN")
        _global_client = httpx.AsyncClient(
            base_url="https://api.sarvam.ai",
            headers={
                "api-subscription-key": api_key,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
    return _global_client


class TranslationStage(Enum):
    INBOUND = "inbound"
    PREVIEW = "preview"
    DRAFT = "draft"
    REPORT = "report"


class SarvamTranslationService:

    def __init__(self):
        self.api_key = os.getenv("SARVAM_ACCESS_TOKEN")
        if not self.api_key:
            logger.warning("[WARN] SARVAM_ACCESS_TOKEN not set. Translation will be skipped.")
        elif len(self.api_key.strip()) < 10:
            logger.warning("[WARN] SARVAM_ACCESS_TOKEN appears too short")

    def _get_client(self) -> httpx.AsyncClient:
        return _get_global_client()

    @staticmethod
    def _route(stage: TranslationStage, target_lang: Optional[str] = None) -> dict:
        if stage in (TranslationStage.INBOUND, TranslationStage.PREVIEW):
            return {
                "model": "mayura:v1",
                "mode": "modern-colloquial",
                "source_lang": "auto",
                "target_lang": target_lang or "en-IN",
            }
        return {
            "model": "sarvam-translate:v1",
            "mode": "formal",
            "source_lang": "en-IN",
            "target_lang": target_lang or "en-IN",
        }

    async def _call_sarvam(self, payload: dict) -> dict:
        client = self._get_client()
        response = await client.post("/translate", json=payload)
        if response.status_code >= 500:
            response.raise_for_status()
        if response.status_code >= 400:
            response.raise_for_status()
        return response.json()

    async def _call_with_fallback(
        self, primary_payload: dict, fallback_payload: dict, original_text: str
    ) -> dict:
        try:
            return await self._call_sarvam(primary_payload)
        except Exception as e:
            logger.error(f"[Sarvam] Primary translation failed: {e}")
            try:
                return await self._call_sarvam(fallback_payload)
            except Exception as e2:
                logger.error(f"[Sarvam] Fallback translation failed: {e2}")
                return {
                    "translated_text": original_text,
                    "detected_language": None,
                    "model_used": None,
                    "mode_used": None,
                    "translation_status": "failed",
                }

    async def translate(
        self,
        text: str,
        stage: TranslationStage,
        target_lang: Optional[str] = None,
        source_lang: Optional[str] = None,
    ) -> dict:
        if not text or not text.strip():
            return {
                "translated_text": text,
                "detected_language": None,
                "model_used": None,
                "mode_used": None,
                "translation_status": "skipped",
            }

        if not self.api_key:
            return {
                "translated_text": text,
                "detected_language": None,
                "model_used": None,
                "mode_used": None,
                "translation_status": "skipped",
            }

        route = self._route(stage, target_lang)
        if source_lang:
            route["source_lang"] = source_lang
        if target_lang:
            route["target_lang"] = target_lang

        payload = {
            "input": text,
            **route,
        }

        try:
            result = await self._call_sarvam(payload)
            return {
                "translated_text": result.get("translated_text", text),
                "detected_language": result.get("detected_language"),
                "model_used": route["model"],
                "mode_used": route["mode"],
                "translation_status": "success",
            }
        except Exception as e:
            status_code = getattr(e, "response", None)
            if status_code is not None and hasattr(status_code, "status_code"):
                code = status_code.status_code
            else:
                code = None

            if code and 500 <= code < 600:
                logger.warning(f"[Sarvam] 5xx error, retrying after 1s: {e}")
                await asyncio.sleep(1)
                try:
                    result = await self._call_sarvam(payload)
                    return {
                        "translated_text": result.get("translated_text", text),
                        "detected_language": result.get("detected_language"),
                        "model_used": route["model"],
                        "mode_used": route["mode"],
                        "translation_status": "success",
                    }
                except Exception as retry_err:
                    logger.error(f"[Sarvam] Retry failed: {retry_err}")

            if stage in (TranslationStage.DRAFT, TranslationStage.REPORT):
                fallback_route = {
                    "model": "mayura:v1",
                    "mode": "formal",
                    "source_lang": "en-IN",
                    "target_lang": target_lang or "en-IN",
                }
                fallback_payload = {"input": text, **fallback_route}
                return await self._call_with_fallback(payload, fallback_payload, text)

            logger.error(f"[Sarvam] Translation failed: {e}")
            return {
                "translated_text": text,
                "detected_language": None,
                "model_used": None,
                "mode_used": None,
                "translation_status": "failed",
            }
