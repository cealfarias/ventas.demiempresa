from database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
try:
    res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes';")).fetchall()
    print([r[0] for r in res])
except Exception as e:
    print("Error:", e)
db.close()

