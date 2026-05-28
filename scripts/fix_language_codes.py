"""Fix detected_language for complaints that were retranslated but have NULL language."""
import os, sys, asyncio, logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
import psycopg2
from psycopg2.extras import RealDictCursor
from services.translation_service import SarvamTranslationService, TranslationStage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger("fix_lang")

async def fix_language():
    url = os.getenv("POSTGRES_URL")
    conn = psycopg2.connect(url)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT id, customer_id, raw_text FROM complaints 
        WHERE translation_status = 'success' 
        AND detected_language IS NULL 
        AND translated_text IS NOT NULL
    """)
    rows = cur.fetchall()
    logger.info(f"Found {len(rows)} complaints with missing language code")

    svc = SarvamTranslationService()

    for row in rows:
        cid = row["id"]
        try:
            result = await svc.translate(text=row["raw_text"], stage=TranslationStage.INBOUND)
            detected = result["detected_language"]
            if detected:
                cur.execute("UPDATE complaints SET detected_language = %s WHERE id = %s", (detected, str(cid)))
                conn.commit()
                logger.info(f"  {cid} → {detected}")
            else:
                logger.warning(f"  {cid} → still no language detected")
        except Exception as e:
            logger.error(f"  {cid} → ERROR: {e}")

    cur.close()
    conn.close()
    logger.info("Done")

if __name__ == "__main__":
    asyncio.run(fix_language())