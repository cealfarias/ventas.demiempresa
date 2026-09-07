from database import SessionLocal
from models import Cliente
from sqlalchemy import text
db = SessionLocal()
try:
    db.execute(text("ALTER TABLE clientes ADD COLUMN es_predeterminado BOOLEAN DEFAULT FALSE;"))
    db.commit()
    print("Columna aadida a la DB")
except Exception as e:
    print("Error:", e)
db.close()

