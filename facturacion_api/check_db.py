from database import SessionLocal
from models import Factura
db = SessionLocal()
f = db.query(Factura).order_by(Factura.id.desc()).first()
print(repr(f.fecha_emision))
db.close()

