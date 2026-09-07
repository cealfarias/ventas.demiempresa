from database import SessionLocal
from models import Usuario
db = SessionLocal()
users = db.query(Usuario).filter(Usuario.empresa_id == "CANTARES").limit(1).all()
for u in users:
    print(u.id, u.nombre)
db.close()

