from api.db.session import engine
from sqlalchemy import text
import os

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check"))
    conn.execute(text("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('AGENT', 'SUPERVISOR', 'COMPLIANCE'))"))
    conn.commit()
print("Constraint updated successfully")