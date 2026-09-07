from database import SessionLocal
from models import Producto
db = SessionLocal()
prods = db.query(Producto).filter(Producto.empresa_id == "CANTARES").limit(5).all()
for p in prods:
    print(p.codigo, p.nombre)
db.close()

