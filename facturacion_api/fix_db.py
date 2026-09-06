from database import SessionLocal
from models import CuentaPorCobrar
db = SessionLocal()
anuladas = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.estado == "anulada").all()
for c in anuladas:
    c.monto_pendiente = 0
db.commit()
db.close()

