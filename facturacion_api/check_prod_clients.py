from database import SessionLocal
from models import Cliente
db = SessionLocal()
clis = db.query(Cliente).filter(Cliente.empresa_id == "CANTARES").limit(5).all()
for c in clis:
    print(c.id_cliente, c.nombre)
db.close()

