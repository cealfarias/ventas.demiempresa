from database import SessionLocal
from models import Cliente
db = SessionLocal()
try:
    clientes = db.query(Cliente).all()
    print("Clientes:", len(clientes))
except Exception as e:
    print("Error:", e)

