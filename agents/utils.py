import json
import os
import time
import re
import logging
from groq import Groq

logger = logging.getLogger(__name__)

# Cache the Groq client instance
_groq_client = None

def get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        _groq_client = Groq(api_key=api_key)
    return _groq_client

def groq_chat_completion(messages, model="llama-3.1-8b-instant", max_tokens=300, temperature=0.0, **kwargs):
    """
    Calls the Groq API with retries and exponential backoff to handle rate limits (HTTP 429).
    """
    client = get_groq_client()
    max_retries = 10
    base_delay = 2.0
    
    for attempt in range(max_retries):
        try:
            completion = client.chat.completions.create(
                messages=messages,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )
            return completion
        except Exception as e:
            status_code = getattr(e, "status_code", None)
            err_msg = str(e)
            
            # If 429 rate limit error is encountered
            if status_code == 429 or "rate_limit" in err_msg.lower() or "429" in err_msg:
                # Try to extract retry time (e.g., "Please try again in 1.91s")
                match = re.search(r"try again in (\d+\.?\d*)s", err_msg, re.IGNORECASE)
                if match:
                    wait_time = float(match.group(1)) + 0.5
                else:
                    wait_time = base_delay * (2 ** attempt)
                
                print(f"Groq API rate limit hit. Waiting for {wait_time:.2f} seconds before retry (attempt {attempt + 1}/{max_retries})...")
                time.sleep(wait_time)
            else:
                # Re-raise other exceptions immediately
                raise e
                
    raise Exception("Groq API rate limit retries exhausted.")

def safe_parse_json(text: str) -> dict:
    """
    Safely extracts and parses JSON from a string that might be wrapped in
    markdown code blocks (e.g. ```json ... ```) or contain leading/trailing text.
    """
    if not text:
        return {}
    
    cleaned = text.strip()
    
    # Check if the text is wrapped in markdown code blocks
    if "```" in cleaned:
        # Find the first JSON brace and extract everything between the outer braces
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            cleaned = cleaned[start:end+1]
    else:
        # Even if not wrapped in code blocks, search for braces to isolate JSON if the model appended chat text
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            cleaned = cleaned[start:end+1]
            
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("safe_parse_json: json.loads failed, attempting ast.literal_eval fallback")
        try:
            import ast
            return ast.literal_eval(cleaned)
        except Exception:
            logger.warning("safe_parse_json: all parse attempts failed, returning {}")
            return {}
