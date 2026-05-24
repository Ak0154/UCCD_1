from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from api.db.session import get_db
from api.models.complaint import Complaint
from services.translation_service import SarvamTranslationService, TranslationStage
from api.routes.complaints import generate_response_draft
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

@router.get("/translate-preview")
async def translate_preview(
    text: str = Query(..., description="The response text to translate"),
    target_lang: str = Query(..., description="The target language code (e.g. hi-IN, ur)")
):
    """
    Translates response drafts to the customer's preferred target language.
    Skip if target_lang matches English (e.g., 'en-IN', 'en').
    """
    cleaned_lang = target_lang.split("-")[0].lower()
    if cleaned_lang == "en":
        return {
            "original_text": text,
            "source_lang": "en",
            "target_lang": target_lang,
            "translated_text": text,
        }

    svc = SarvamTranslationService()
    try:
        result = await svc.translate(
            text=text,
            stage=TranslationStage.PREVIEW,
            target_lang=target_lang
        )
    except Exception:
        return {
            "original_text": text,
            "source_lang": "unknown",
            "target_lang": target_lang,
            "translated_text": text,
            "translation_status": "failed",
        }
    return {
        "original_text": text,
        "source_lang": result.get("detected_language", "unknown"),
        "target_lang": target_lang,
        "translated_text": result.get("translated_text", text),
        "translation_status": result.get("translation_status"),
    }

@router.get("/draft/{complaint_id}")
async def get_ai_draft_preview(
    complaint_id: str,
    tone: str = Query("apologetic", description="Tone of the response"),
    db: Session = Depends(get_db)
):
    """
    Provides a quick draft preview of the complaint response.
    Delegates to the complaints endpoint draft generator.
    """
    return await generate_response_draft(complaint_id=complaint_id, tone=tone, db=db)
