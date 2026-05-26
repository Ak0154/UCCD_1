import sys, os
sys.path.insert(0, '/app')
os.chdir('/app')
from api.db.session import engine
from sqlalchemy import text
conn = engine.connect()
conn.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check"))
conn.execute(text("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('AGENT', 'SUPERVISOR', 'COMPLIANCE'))"))
conn.commit()
conn.close()
print("Constraint updated")