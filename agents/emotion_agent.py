from dotenv import load_dotenv
import os
import json
from agents.state import ComplaintState
from agents.utils import safe_parse_json, groq_chat_completion

load_dotenv()

def run_emotion(state: ComplaintState) -> dict:
    text = state["raw_text"]
    
    chat_completion = groq_chat_completion(
        messages=[
            {
                "role": "system",
                "content": """You are a customer sentiment and emotion analyzer for a bank's complaint dashboard.
Analyze the customer's complaint text to determine their emotional progression and intensity.

Return ONLY a valid JSON object with the following keys and values, with NO other text, markdown formatting, or explanations:
{
  "initial": "The sentiment expressed at the start of the text (e.g., Neutral, Frustrated, Angry, Anxious)",
  "current": "The sentiment expressed at the end of the text (e.g., Neutral, Frustrated, Angry, Anxious, Hopeful)",
  "trajectory": "The direction of the emotional arc (Positive, Negative, or Neutral)",
  "intensity": An integer score from 1 to 10 reflecting the peak emotional intensity (10 being extremely irate/hostile)
}"""
            },
            {
                "role": "user",
                "content": text
            }
        ],
        model="llama-3.1-8b-instant",
        max_tokens=250,
    )
    
    response_text = chat_completion.choices[0].message.content
    fallback = {
        "initial": "Neutral",
        "current": "Neutral",
        "trajectory": "Neutral",
        "intensity": 5
    }
    
    if response_text is None:
        return {"emotion_arc": fallback}
        
    data = safe_parse_json(response_text)
    if not data:
        return {"emotion_arc": fallback}
        
    try:
        result = {
            "initial": data.get("initial", "Neutral"),
            "current": data.get("current", "Neutral"),
            "trajectory": data.get("trajectory", "Neutral"),
            "intensity": int(data.get("intensity", 5))
        }
        return {"emotion_arc": result}
    except Exception:
        return {"emotion_arc": fallback}

if __name__ == "__main__":
    test_state = {
        "raw_text": "I opened my account yesterday and it is already blocked! This is unacceptable, I need to pay my bills today. Please unblock it immediately or I will close all my bank relationships with you."
    }
    print(run_emotion(test_state))
