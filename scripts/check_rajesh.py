import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
import psycopg2

conn = psycopg2.connect(os.getenv("POSTGRES_URL"))
cur = conn.cursor()
cur.execute("SELECT raw_text, translated_text, detected_language FROM complaints WHERE id = '2f0180a1-d733-4261-90b0-0d33fbd948a3'")
r = cur.fetchone()
print(f"RAW: {r[0][:150]}")
print(f"TRANS: {r[1][:150] if r[1] else 'None'}")
print(f"LANG: {r[2]}")
conn.close()