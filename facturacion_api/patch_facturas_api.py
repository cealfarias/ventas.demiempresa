import sys

with open("routers/facturas.py", "r", encoding="utf-8") as f:
    code = f.read()

old_func = """@router.get("/", response_model=List[FacturaResponse])
def listar_facturas(empresa_id: str, db: Session = Depends(get_db)):
    facturas = db.query(Factura).filter(Factura.empresa_id == empresa_id).order_by(Factura.fecha_emision.desc()).all()"""

new_func = """from datetime import datetime, timedelta, timezone

@router.get("/", response_model=List[FacturaResponse])
def listar_facturas(empresa_id: str, db: Session = Depends(get_db)):
    # El Salvador is UTC-6
    tz_sv = timezone(timedelta(hours=-6))
    hoy_sv = datetime.now(tz_sv).replace(hour=0, minute=0, second=0, microsecond=0)
    
    facturas = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        Factura.fecha_emision >= hoy_sv
    ).order_by(Factura.fecha_emision.desc()).limit(150).all()"""

code = code.replace(old_func, new_func)

with open("routers/facturas.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Patched routers/facturas.py")

