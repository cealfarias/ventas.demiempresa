from database import SessionLocal
from models import Cliente
db = SessionLocal()
try:
    c = db.query(Cliente).first()
    print("Primer cliente:", c.nombre, c.es_predeterminado)
except Exception as e:
    print("Error DB:", e)

