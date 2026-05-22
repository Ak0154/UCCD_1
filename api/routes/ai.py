from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from api.db.session import get_db
from api.models.complaint import Complaint
from services.translation_service import translate
from api.routes.complaints import generate_response_draft

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

@router.get("/translate-preview")
def translate_preview(
    text: str = Query(..., description="The response text to translate"),
    target_lang: str = Query(..., description="The target language code (e.g. hi-IN, ur)")
):
    """
    Translates response drafts to the customer's preferred target language.
    Skip if target_lang matches English (e.g., 'en-IN', 'en').
    """
    cleaned_lang = target_lang.split("-")[0].lower()
    if cleaned_lang == "en":
        return {"translated_text": text}
        
    translated = translate(text, "en-IN", target_lang)
    return {
        "original_text": text,
        "target_lang": target_lang,
        "translated_text": translated
    }

@router.get("/draft/{complaint_id}")
def get_ai_draft_preview(
    complaint_id: str,
    tone: str = Query("apologetic", description="Tone of the response"),
    db: Session = Depends(get_db)
):
    """
    Provides a quick draft preview of the complaint response.
    Delegates to the complaints endpoint draft generator.
    """
    return generate_response_draft(complaint_id=complaint_id, tone=tone, db=db)
