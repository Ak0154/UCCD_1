import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Instantiate Groq client
client = None
api_key = os.getenv("GROQ_API_KEY")
if api_key:
    client = Groq(api_key=api_key)

def translate(text: str, source_lang: str, target_lang: str) -> str:
    """
    Translates text from source_lang to target_lang using Groq Llama-3.1 model.
    Skips if source and target are the same language or if text is empty.
    """
    if not text or not text.strip():
        return ""
        
    # Standardize language codes
    src = source_lang.split("-")[0].lower()
    tgt = target_lang.split("-")[0].lower()
    
    if src == tgt:
        return text

    if not client:
        return f"[Translation: {source_lang} -> {target_lang}] {text}"

    lang_map = {
        "en": "English",
        "hi": "Hindi",
        "ur": "Urdu",
        "mr": "Marathi",
        "ta": "Tamil",
        "te": "Telugu",
        "gu": "Gujarati",
        "kn": "Kannada",
        "ml": "Malayalam",
        "bn": "Bengali",
        "pa": "Punjabi"
    }

    src_name = lang_map.get(src, source_lang)
    tgt_name = lang_map.get(tgt, target_lang)

    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert translator at a bank. Translate the user's message from {src_name} to {tgt_name}. Output ONLY the direct translated text. Do not add explanations, comments, quotes, or formatting."
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            model="llama-3.1-8b-instant",
            max_tokens=400,
            temperature=0.3
        )
        translated_text = completion.choices[0].message.content.strip()
        return translated_text
    except Exception as e:
        print(f"Groq translation error: {e}")
        return f"[Translation Failed: {e}] {text}"
