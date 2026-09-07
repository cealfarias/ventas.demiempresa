import sys
import re

# 1. facturas.py
with open('routers/facturas.py', 'r', encoding='utf-8') as f: code = f.read()
if 'MovimientoCaja' not in code:
    code = code.replace('CuentaPorCobrar', 'CuentaPorCobrar, SesionCaja, MovimientoCaja, Caja')
code = re.sub(
    r'(        db\.add\(det_desp\)\n        db\.flush\(\)\n\n\s*db\.commit\(\)\n\s*db\.refresh\(f\)\n\s*return listar_facturas)',
    r'''    if data.condicion_operacion == "CONTADO":
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="ingreso", metodo_pago=data.metodo_pago or "efectivo", monto=data.total, concepto=f"Venta Contado: {f.tipo_doc} {f.numero}", fecha=datetime.now(TIMEZONE), referencia_tipo="factura", referencia_id=f.id))
\1''', code)
with open('routers/facturas.py', 'w', encoding='utf-8') as f: f.write(code)


# 2. cuentas_cobrar.py
with open('routers/cuentas_cobrar.py', 'r', encoding='utf-8') as f: code = f.read()
if 'MovimientoCaja' not in code: code = code.replace('PagoCuentaCobrar', 'PagoCuentaCobrar, SesionCaja, MovimientoCaja, Caja')
if 'pytz' not in code: code = code.replace('from database import get_db', "from database import get_db\nfrom datetime import datetime\nimport pytz\nTIMEZONE = pytz.timezone('America/El_Salvador')")
code = re.sub(
    r'(    db\.add\(nuevo_pago\)\n\s*db\.commit\(\))',
    r'''    db.add(nuevo_pago)
    if pago.usuario_id:
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == pago.usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="ingreso", metodo_pago=pago.metodo_pago, monto=pago.monto, concepto=f"Abono a CxC", fecha=datetime.now(TIMEZONE), referencia_tipo="cobro", referencia_id=nuevo_pago.id))
    db.commit()''', code)
with open('routers/cuentas_cobrar.py', 'w', encoding='utf-8') as f: f.write(code)

# 3. cuentas_pagar.py
with open('routers/cuentas_pagar.py', 'r', encoding='utf-8') as f: code = f.read()
if 'MovimientoCaja' not in code: code = code.replace('PagoCuentaPagar', 'PagoCuentaPagar, SesionCaja, MovimientoCaja, Caja')
if 'pytz' not in code: code = code.replace('from database import get_db', "from database import get_db\nfrom datetime import datetime\nimport pytz\nTIMEZONE = pytz.timezone('America/El_Salvador')")
code = re.sub(
    r'(    db\.add\(nuevo_pago\)\n\s*db\.commit\(\))',
    r'''    db.add(nuevo_pago)
    if pago.usuario_id:
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == pago.usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="egreso", metodo_pago=pago.metodo_pago, monto=pago.monto, concepto=f"Pago a Proveedor CxP", fecha=datetime.now(TIMEZONE), referencia_tipo="pago_compra", referencia_id=nuevo_pago.id))
    db.commit()''', code)
with open('routers/cuentas_pagar.py', 'w', encoding='utf-8') as f: f.write(code)

# 4. ordenes_compra.py
with open('routers/ordenes_compra.py', 'r', encoding='utf-8') as f: code = f.read()
if 'MovimientoCaja' not in code: code = code.replace('CuentaPorPagar, Producto', 'CuentaPorPagar, Producto, SesionCaja, MovimientoCaja, Caja')
if 'pytz' not in code: code = code.replace('from database import get_db', "from database import get_db\nfrom datetime import datetime\nimport pytz\nTIMEZONE = pytz.timezone('America/El_Salvador')")
code = re.sub(
    r'(        db\.add\(cxp\)\n\s*db\.commit\(\)\n\s*db\.refresh\(orden\))',
    r'''        db.add(cxp)
    if data.condicion_operacion == "CONTADO":
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="egreso", metodo_pago="efectivo", monto=data.total, concepto=f"Compra Contado OC {orden.numero}", fecha=datetime.now(TIMEZONE), referencia_tipo="compra", referencia_id=orden.id))
    db.commit()
    db.refresh(orden)''', code)
with open('routers/ordenes_compra.py', 'w', encoding='utf-8') as f: f.write(code)

print("Applied new regex patch")