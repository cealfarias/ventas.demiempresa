from database import SessionLocal
from models import Cliente
db = SessionLocal()
try:
    c = db.query(Cliente).first()
    print("Predeterminado:", getattr(c, "es_predeterminado", "NOT_FOUND"))
except Exception as e:
    print("Error:", e)

