from database import SessionLocal
from routers.dashboard import obtener_top_productos
try:
    db = SessionLocal()
    res = obtener_top_productos(empresa_id="CANTARES", periodo="dia", anio=2026, db=db)
    print("DIA:", res)
    res = obtener_top_productos(empresa_id="CANTARES", periodo="anio", anio=2026, db=db)
    print("AÑO:", res)
finally:
    db.close()

