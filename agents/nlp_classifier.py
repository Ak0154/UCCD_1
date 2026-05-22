from dotenv import load_dotenv
import os
import json
from agents.utils import safe_parse_json, groq_chat_completion

load_dotenv()

def classify_complaint(text:str):
    chat_completion = groq_chat_completion(
        messages=[
            {
                "role": "system",
                "content": """You are a PSB bank complaint classifier. Return ONLY valid JSON. No explanation, no markdown.

                    Return exactly this structure:
                    {
                    "complaint_type": "one of: fraud, billing, kyc, loans, cards, service, technical, other",
                    "product_code": "one of: savings, current, credit_card, home_loan, personal_loan, fd, insurance",
                    "intent": "one of: refund, explanation, escalation, closure, legal_threat",
                    "regulatory_obligation": "one of: banking_ombudsman, rbi_consumer, irdai, sebi, none",
                    "type_confidence": 0.0 to 1.0
                    }"""
            },
            {
                "role": "user",
                "content": text
            }
        ],
        model="llama-3.1-8b-instant",
        max_tokens=300,
    )
    response_text = chat_completion.choices[0].message.content
    
    fallback = {
        "complaint_type": "other",
        "product_code": None,
        "intent": None,
        "regulatory_obligation": "none",
        "type_confidence": 0.0
    }
    
    if response_text is None:
        return fallback
        
    parsed = safe_parse_json(response_text)
    if not parsed:
        return fallback
        
    return {
        "complaint_type": parsed.get("complaint_type", "other"),
        "product_code": parsed.get("product_code"),
        "intent": parsed.get("intent"),
        "regulatory_obligation": parsed.get("regulatory_obligation", "none"),
        "type_confidence": float(parsed.get("type_confidence", 0.0))
    }
    

if __name__ == "__main__":
    tests = [
        "My KYC documents were rejected without any reason and my account is frozen",
        "Someone made unauthorized transactions from my savings account, this is fraud"
    ]
    for t in tests:
        print(classify_complaint(t))