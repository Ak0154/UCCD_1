import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
import httpx

key = os.getenv("SARVAM_ACCESS_TOKEN")
text = """Namaste,
Aaj subah se mera ATM card kaam nahi kar raha hai. Maine do baar transaction try kiya lekin paise account se kat gaye aur ATM se nahi nikle. Rs 5000 debit hua hai par cash nahi mila. Kripya jald se jald iska solution karein.

Rajesh Sharma"""

r = httpx.post(
    "https://api.sarvam.ai/translate",
    headers={"api-subscription-key": key},
    json={"input": text, "model": "sarvam-translate:v1", "mode": "formal", "source_language_code": "hi-IN", "target_language_code": "en-IN"},
    timeout=15,
)
d = r.json()
trans = d.get('translated_text', '')
with open("C:/Users/abhin/AppData/Local/Temp/kilo/trans.txt", "w", encoding="utf-8") as f:
    f.write(f"Translated ({len(trans)} chars):\n{trans}")
print(f"Wrote {len(trans)} chars to temp file")