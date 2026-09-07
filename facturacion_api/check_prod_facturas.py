from database import SessionLocal
from models import Factura
db = SessionLocal()
count = db.query(Factura).filter(Factura.empresa_id == "CANTARES").count()
print("Total facturas en PROD:", count)

facs = db.query(Factura).filter(Factura.empresa_id == "CANTARES").order_by(Factura.id.asc()).limit(5).all()
for f in facs:
    print(f.id, f.numero, f.fecha_emision)

facs_desc = db.query(Factura).filter(Factura.empresa_id == "CANTARES").order_by(Factura.id.desc()).limit(5).all()
print("Ultimas 5:")
for f in facs_desc:
    print(f.id, f.numero, f.fecha_emision)
db.close()

