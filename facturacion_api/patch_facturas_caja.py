import sys

with open("routers/facturas.py", "r", encoding="utf-8") as f:
    code = f.read()

old_str = "condicion_operacion: str = \"CONTADO\" # CONTADO | CREDITO"
new_str = "condicion_operacion: str = \"CONTADO\" # CONTADO | CREDITO\n    metodo_pago: Optional[str] = \"efectivo\" # efectivo | transferencia | tarjeta"
code = code.replace(old_str, new_str)

old_crear = """def crear_factura(data: FacturaCreate, empresa_id: str, usuario_id: int, db: Session = Depends(get_db)):
    # 1. Validar cliente"""

new_crear = """def crear_factura(data: FacturaCreate, empresa_id: str, usuario_id: int, db: Session = Depends(get_db)):
    # 0. Validar Caja Abierta si es de CONTADO
    sesion = None
    if data.condicion_operacion == "CONTADO":
        from models import SesionCaja, Caja
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        if not sesion:
            raise HTTPException(status_code=400, detail="Debe abrir su turno de caja antes de realizar ventas al contado.")

    # 1. Validar cliente"""

code = code.replace(old_crear, new_crear)

old_commit = """    db.add(f)
    db.commit()
    db.refresh(f)
    
    # 8. Retornar"""

new_commit = """    db.add(f)
    db.flush() # Para obtener f.id
    
    if data.condicion_operacion == "CONTADO" and sesion:
        from models import MovimientoCaja
        mov = MovimientoCaja(
            sesion_caja_id=sesion.id,
            tipo="ingreso",
            metodo_pago=data.metodo_pago or "efectivo",
            monto=f.total,
            concepto=f"Venta Contado {f.tipo_doc}",
            referencia_tipo="factura",
            referencia_id=f.id,
            usuario_id=usuario_id
        )
        db.add(mov)

    db.commit()
    db.refresh(f)
    
    # 8. Retornar"""

code = code.replace(old_commit, new_commit)

with open("routers/facturas.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched facturas")

