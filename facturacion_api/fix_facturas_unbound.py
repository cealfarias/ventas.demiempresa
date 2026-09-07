import sys
with open('routers/facturas.py', 'r', encoding='utf-8') as f:
    code = f.read()

bad_block = '''    if data.condicion_operacion == "CONTADO":
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="ingreso", metodo_pago=data.metodo_pago or "efectivo", monto=data.total, concepto=f"Venta Contado: {f.tipo_doc} {f.numero}", fecha=datetime.now(TIMEZONE), referencia_tipo="factura", referencia_id=f.id))
        db.add(det_desp)
        db.flush()'''

good_block = '''        db.add(det_desp)
        db.flush()
        
    if data.condicion_operacion == "CONTADO":
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="ingreso", metodo_pago=data.metodo_pago or "efectivo", monto=data.total, concepto=f"Venta Contado: {f.tipo_doc} {f.numero}", fecha=datetime.now(TIMEZONE), referencia_tipo="factura", referencia_id=f.id))'''

code = code.replace(bad_block, good_block)

with open('routers/facturas.py', 'w', encoding='utf-8') as f:
    f.write(code)
print("Fixed UnboundLocalError in facturas.py")