from database import SessionLocal
from models import Factura
db = SessionLocal()
facs = db.query(Factura.numero, Factura.fecha_emision).filter(Factura.empresa_id == "CANTARES").limit(10).all()
for f in facs:
    print(f.numero, f.fecha_emision)
db.close()

