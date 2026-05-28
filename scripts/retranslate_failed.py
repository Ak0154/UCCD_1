"""Re-translate all complaints that have translation_status = 'failed'."""
import os, sys, asyncio, logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
import psycopg2
from psycopg2.extras import RealDictCursor

from services.translation_service import SarvamTranslationService, TranslationStage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger("retranslate")

async def fix_failed_translations():
    url = os.getenv("POSTGRES_URL")
    conn = psycopg2.connect(url)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT id, customer_id, raw_text, language_code FROM complaints WHERE translation_status = 'failed'")
    rows = cur.fetchall()
    logger.info(f"Found {len(rows)} complaints with failed translation")

    svc = SarvamTranslationService()

    for row in rows:
        cid = row["id"]
        logger.info(f"Retranslating {cid} (customer: {row['customer_id']})")

        try:
            result = await svc.translate(
                text=row["raw_text"],
                stage=TranslationStage.INBOUND,
            )
            status = result["translation_status"]
            translated = result["translated_text"]
            detected = result["detected_language"]

            cur.execute(
                "UPDATE complaints SET translation_status = %s, translated_text = %s, detected_language = %s WHERE id = %s",
                (status, translated, detected, str(cid)),
            )
            conn.commit()
            logger.info(f"  → {status}, lang={detected}")
        except Exception as e:
            logger.error(f"  → ERROR: {e}")

    cur.close()
    conn.close()
    logger.info("Done")

if __name__ == "__main__":
    asyncio.run(fix_failed_translations())