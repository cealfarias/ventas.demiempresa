import sys
import re

with open('routers/proveedores.py', 'r', encoding='utf-8') as f:
    code = f.read()

act_find = '''    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(p, campo, valor)
    
    db.commit()'''

act_repl = '''    saldo_inicial_antiguo = p.saldo_inicial or 0
    
    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(p, campo, valor)
        
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
print("Patched proveedores.py act")