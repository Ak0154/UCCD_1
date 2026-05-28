import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
import psycopg2

conn = psycopg2.connect(os.getenv("POSTGRES_URL"))
cur = conn.cursor()
cur.execute("SELECT translated_text, detected_language, translation_status FROM complaints WHERE id = 'f0f3299c-f264-4722-9320-aefbe338a36f'")
r = cur.fetchone()
with open("C:/Users/abhin/AppData/Local/Temp/kilo/trans2.txt", "w", encoding="utf-8") as f:
    f.write(f"detected={r[1]}\nstatus={r[2]}\n\ntext:\n{r[0][:500] if r[0] else 'None'}")
print(f"Wrote check to temp file")