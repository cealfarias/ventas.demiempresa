import sys
import re

# 2. cuentas_cobrar.py
with open('routers/cuentas_cobrar.py', 'r', encoding='utf-8') as f: code = f.read()
code = re.sub(
    r'(    db\.commit\(\)\n\s*db\.refresh\(cuenta\))',
    r'''    if pago.usuario_id:
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == pago.usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="ingreso", metodo_pago=pago.metodo_pago, monto=pago.monto, concepto=f"Abono a Factura {cuenta.factura.numero}" if getattr(cuenta, 'factura', None) else f"Abono a CxC", fecha=datetime.now(TIMEZONE), referencia_tipo="cobro", referencia_id=nuevo_pago.id))
\1''', code)
with open('routers/cuentas_cobrar.py', 'w', encoding='utf-8') as f: f.write(code)

# 3. cuentas_pagar.py
with open('routers/cuentas_pagar.py', 'r', encoding='utf-8') as f: code = f.read()
code = re.sub(
    r'(    db\.commit\(\)\n\s*db\.refresh\(cuenta\))',
    r'''    if pago.usuario_id:
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == pago.usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="egreso", metodo_pago=pago.metodo_pago, monto=pago.monto, concepto=f"Pago a Proveedor", fecha=datetime.now(TIMEZONE), referencia_tipo="pago_compra", referencia_id=nuevo_pago.id))
\1''', code)
with open('routers/cuentas_pagar.py', 'w', encoding='utf-8') as f: f.write(code)

print("Applied 3rd regex patch")