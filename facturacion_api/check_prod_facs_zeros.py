from database import SessionLocal
from models import Factura
db = SessionLocal()
f1 = db.query(Factura.numero).filter(Factura.numero.like("%000001%")).all()
print("With 5 zeros:", f1)
f2 = db.query(Factura.numero).filter(Factura.numero.like("%00001%")).limit(5).all()
print("With 4 zeros:", f2)
db.close()

