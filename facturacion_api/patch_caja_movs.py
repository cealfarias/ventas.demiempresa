import sys
import re

# 1. facturas.py
with open("routers/facturas.py", "r", encoding="utf-8") as f:
    code_f = f.read()

import_str_f = "from models import Factura, ItemFactura, Cliente, Bodega, Producto, CuentaPorCobrar"
new_import_str_f = import_str_f + ", SesionCaja, MovimientoCaja, Caja"
code_f = code_f.replace(import_str_f, new_import_str_f)

crear_fact_find = """        db.add(cxc)
        
    db.commit()
    db.refresh(f)"""
crear_fact_repl = """        db.add(cxc)

    if data.condicion_operacion == "CONTADO":
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        if sesion:
            mov = MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="ingreso",
                metodo_pago=data.metodo_pago or "efectivo",
                monto=data.total,
                concepto=f"Venta Contado: {f.tipo_doc} {f.numero}",
                fecha=datetime.now(TIMEZONE),
                referencia_tipo="factura",
                referencia_id=f.id
            )
            db.add(mov)

    db.commit()
    db.refresh(f)"""
code_f = code_f.replace(crear_fact_find, crear_fact_repl)
with open("routers/facturas.py", "w", encoding="utf-8") as f:
    f.write(code_f)


# 2. cuentas_cobrar.py
with open("routers/cuentas_cobrar.py", "r", encoding="utf-8") as f:
    code_c = f.read()
import_str_c = "from models import CuentaPorCobrar, PagoCuentaCobrar"
new_import_str_c = import_str_c + ", SesionCaja, MovimientoCaja, Caja"
code_c = code_c.replace(import_str_c, new_import_str_c)
import_tz_c = "from database import get_db"
new_import_tz_c = import_tz_c + "\nfrom datetime import datetime\nimport pytz\nTIMEZONE = pytz.timezone('America/El_Salvador')"
if "pytz" not in code_c:
    code_c = code_c.replace(import_tz_c, new_import_tz_c)

cxc_find = """    db.add(nuevo_pago)
    db.commit()"""
cxc_repl = """    db.add(nuevo_pago)
    
    if pago.usuario_id:
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == pago.usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        if sesion:
            mov = MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="ingreso",
                metodo_pago=pago.metodo_pago,
                monto=pago.monto,
                concepto=f"Abono a Factura {cuenta.factura.numero}" if cuenta.factura else f"Abono a CxC #{cuenta.id}",
                fecha=datetime.now(TIMEZONE),
                referencia_tipo="cobro",
                referencia_id=nuevo_pago.id
            )
            db.add(mov)
            
    db.commit()"""
code_c = code_c.replace(cxc_find, cxc_repl)
with open("routers/cuentas_cobrar.py", "w", encoding="utf-8") as f:
    f.write(code_c)


# 3. cuentas_pagar.py
with open("routers/cuentas_pagar.py", "r", encoding="utf-8") as f:
    code_p = f.read()
import_str_p = "from models import CuentaPorPagar, PagoCuentaPagar"
new_import_str_p = import_str_p + ", SesionCaja, MovimientoCaja, Caja"
code_p = code_p.replace(import_str_p, new_import_str_p)
import_tz_p = "from database import get_db"
new_import_tz_p = import_tz_p + "\nfrom datetime import datetime\nimport pytz\nTIMEZONE = pytz.timezone('America/El_Salvador')"
if "pytz" not in code_p:
    code_p = code_p.replace(import_tz_p, new_import_tz_p)

cxp_find = """    db.add(nuevo_pago)
    db.commit()"""
cxp_repl = """    db.add(nuevo_pago)
    
    if pago.usuario_id:
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == pago.usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        if sesion:
            mov = MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="egreso",
                metodo_pago=pago.metodo_pago,
                monto=pago.monto,
                concepto=f"Pago a Proveedor - CxP #{cuenta.id}",
                fecha=datetime.now(TIMEZONE),
                referencia_tipo="pago_compra",
                referencia_id=nuevo_pago.id
            )
            db.add(mov)
            
    db.commit()"""
code_p = code_p.replace(cxp_find, cxp_repl)
with open("routers/cuentas_pagar.py", "w", encoding="utf-8") as f:
    f.write(code_p)

# 4. ordenes_compra.py
with open("routers/ordenes_compra.py", "r", encoding="utf-8") as f:
    code_o = f.read()
import_str_o = "from models import OrdenCompra, DetalleOrdenCompra, Proveedor, CuentaPorPagar, Producto"
new_import_str_o = import_str_o + ", SesionCaja, MovimientoCaja, Caja"
code_o = code_o.replace(import_str_o, new_import_str_o)

oc_find = """        db.add(cxp)
        
    db.commit()
    db.refresh(orden)"""
oc_repl = """        db.add(cxp)
        
    if data.condicion_operacion == "CONTADO":
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        if sesion:
            mov = MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="egreso",
                metodo_pago="efectivo",
                monto=data.total,
                concepto=f"Compra Contado: OC {orden.numero}",
                fecha=datetime.now(TIMEZONE),
                referencia_tipo="compra",
                referencia_id=orden.id
            )
            db.add(mov)
            
    db.commit()
    db.refresh(orden)"""
code_o = code_o.replace(oc_find, oc_repl)
with open("routers/ordenes_compra.py", "w", encoding="utf-8") as f:
    f.write(code_o)

print("Patch applied to all 4 files!")