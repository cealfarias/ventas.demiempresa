import sys
import re

with open('routers/proveedores.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure imports are present
if 'CuentaPorPagar' not in code:
    code = code.replace('from models import Proveedor', 'from models import Proveedor, CuentaPorPagar\nfrom datetime import datetime\nimport pytz')

# Patch crear_proveedor
crear_find = '''    nuevo = Proveedor(**proveedor.dict(), empresa_id=empresa_id)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo'''

crear_repl = '''    nuevo = Proveedor(**proveedor.dict(), empresa_id=empresa_id)
    if nuevo.saldo_inicial and nuevo.saldo_inicial > 0:
        nuevo.saldo_pendiente = (nuevo.saldo_pendiente or 0) + nuevo.saldo_inicial
    db.add(nuevo)
    db.flush() # Para obtener id
    
    if nuevo.saldo_inicial and nuevo.saldo_inicial > 0:
        tz = pytz.timezone("America/El_Salvador")
        cxp = CuentaPorPagar(
            empresa_id=empresa_id,
            proveedor_id=nuevo.id,
            orden_compra_id=None,
            fecha_vencimiento=datetime.now(tz),
            monto_original=nuevo.saldo_inicial,
            monto_pendiente=nuevo.saldo_inicial,
            estado="pendiente"
        )
        db.add(cxp)

    db.commit()
    db.refresh(nuevo)
    return nuevo'''

code = code.replace(crear_find, crear_repl)

# Patch actualizar_proveedor
act_find = '''    for k, v in datos.dict(exclude_unset=True).items():
        setattr(p, k, v)
        
    db.commit()'''

act_repl = '''    saldo_inicial_antiguo = p.saldo_inicial or 0
    
    for k, v in datos.dict(exclude_unset=True).items():
        setattr(p, k, v)
        
    saldo_inicial_nuevo = p.saldo_inicial or 0
    
    if saldo_inicial_nuevo != saldo_inicial_antiguo:
        # Ajustar saldo_pendiente
        diferencia = saldo_inicial_nuevo - saldo_inicial_antiguo
        p.saldo_pendiente = (p.saldo_pendiente or 0) + diferencia
        if p.saldo_pendiente < 0: p.saldo_pendiente = 0
        
        # Buscar cxp de saldo inicial (sin orden)
        cxp = db.query(CuentaPorPagar).filter(CuentaPorPagar.proveedor_id == p.id, CuentaPorPagar.orden_compra_id == None).first()
        if cxp:
            cxp.monto_original += diferencia
            cxp.monto_pendiente += diferencia
            if cxp.monto_pendiente <= 0:
                cxp.monto_pendiente = 0
                cxp.estado = "pagada"
            else:
                cxp.estado = "pendiente" if cxp.monto_pendiente == cxp.monto_original else "parcial"
        elif saldo_inicial_nuevo > 0:
            tz = pytz.timezone("America/El_Salvador")
            nueva_cxp = CuentaPorPagar(
                empresa_id=empresa_id,
                proveedor_id=p.id,
                orden_compra_id=None,
                fecha_vencimiento=datetime.now(tz),
                monto_original=saldo_inicial_nuevo,
                monto_pendiente=saldo_inicial_nuevo,
                estado="pendiente"
            )
            db.add(nueva_cxp)

    db.commit()'''

code = code.replace(act_find, act_repl)

with open('routers/proveedores.py', 'w', encoding='utf-8') as f:
    f.write(code)
print("Patched proveedores.py")