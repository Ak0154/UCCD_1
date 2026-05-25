import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.db.session import get_db
from sqlalchemy import text

def update_constraint():
    db = next(get_db())
    try:
        # Drop the old check constraint
        print("Dropping old constraint...")
        db.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;"))
        
        # Add the new check constraint
        print("Adding new constraint with COMPLIANCE...")
        db.execute(text("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('AGENT', 'SUPERVISOR', 'COMPLIANCE'));"))
        
        db.commit()
        print("Check constraint updated successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error updating constraint: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_constraint()
