import logging

from agents.utils import groq_chat_completion
from api.models.complaint import Complaint
from services.translation_service import SarvamTranslationService, TranslationStage

logger = logging.getLogger(__name__)


def _fallback_draft(complaint: Complaint) -> str:
    return (
        "Dear Customer, we apologize for the inconvenience. We have received your "
        f"complaint regarding {complaint.complaint_type or 'banking services'} "
        "and are investigating it. We will resolve it shortly."
    )


async def generate_draft(complaint: Complaint, tone: str = "apologetic") -> str:
    prompt = f"""You are a bank customer relations officer at Union Bank of India.
Generate a professional, personalized response to this complaint:
"{complaint.raw_text}"

Tone constraints:
- Use a "{tone}" tone.
- Keep the response professional, clear, and reassuring.
- Address the core customer intent: "{complaint.intent or 'resolving their query'}".
- State that we are addressing the issue and provide a timeline or action steps.
- The language of the response should match the language of the complaint if possible (e.g. English, Hindi, etc.).
- Do not include any markdown styling, placeholder texts like '[Your Name]', or greeting system text. Just return the raw response message.
"""
    try:
        completion = groq_chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            max_tokens=250,
        )
        draft_text = completion.choices[0].message.content.strip()
    except Exception as e:
        logger.warning("Groq draft generation failed for complaint %s: %s", complaint.id, e)
        draft_text = _fallback_draft(complaint)

    target_lang = complaint.detected_language or complaint.language_code
    if not target_lang:
        return draft_text

    try:
        translated = await SarvamTranslationService().translate(
            text=draft_text,
            stage=TranslationStage.DRAFT,
            target_lang=target_lang,
        )
    except Exception as e:
        logger.warning("Sarvam draft translation failed for complaint %s: %s", complaint.id, e)
        return draft_text

    if translated.get("translation_status") == "success":
        return translated.get("translated_text", draft_text)
    return draft_text
