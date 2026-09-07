import sys
import re

with open('routers/clientes.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure imports are present
if 'CuentaPorCobrar' not in code:
    code = code.replace('from models import Cliente', 'from models import Cliente, CuentaPorCobrar\nfrom datetime import datetime\nimport pytz')
elif 'pytz' not in code:
    code = code.replace('from models import ', 'from datetime import datetime\nimport pytz\nfrom models import ')

# Patch crear_cliente
crear_find = '''    db_cliente = Cliente(**cliente.dict(), empresa_id=empresa_id)
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente'''

crear_repl = '''    db_cliente = Cliente(**cliente.dict(), empresa_id=empresa_id)
    if db_cliente.saldo_inicial and db_cliente.saldo_inicial > 0:
        db_cliente.saldo_pendiente = (db_cliente.saldo_pendiente or 0) + db_cliente.saldo_inicial
    db.add(db_cliente)
    db.flush() # Para obtener id
    
    if db_cliente.saldo_inicial and db_cliente.saldo_inicial > 0:
        tz = pytz.timezone("America/El_Salvador")
        cxc = CuentaPorCobrar(
            empresa_id=empresa_id,
            cliente_id=db_cliente.id_cliente,
            factura_id=None,
            fecha_vencimiento=datetime.now(tz),
            monto_original=db_cliente.saldo_inicial,
            monto_pendiente=db_cliente.saldo_inicial,
            estado="pendiente"
        )
        db.add(cxc)

    db.commit()
    db.refresh(db_cliente)
    return db_cliente'''

code = code.replace(crear_find, crear_repl)

# Patch actualizar_cliente
act_find = '''    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(c, campo, valor)
        
    db.commit()'''

act_repl = '''    saldo_inicial_antiguo = c.saldo_inicial or 0
    
    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(c, campo, valor)
        
    saldo_inicial_nuevo = c.saldo_inicial or 0
    
    if saldo_inicial_nuevo != saldo_inicial_antiguo:
        # Ajustar saldo_pendiente
        diferencia = saldo_inicial_nuevo - saldo_inicial_antiguo
        c.saldo_pendiente = (c.saldo_pendiente or 0) + diferencia
        if c.saldo_pendiente < 0: c.saldo_pendiente = 0
        
        # Buscar cxc de saldo inicial (sin factura)
        cxc = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.cliente_id == c.id_cliente, CuentaPorCobrar.factura_id == None).first()
        if cxc:
            cxc.monto_original += diferencia
            cxc.monto_pendiente += diferencia
            if cxc.monto_pendiente <= 0:
                cxc.monto_pendiente = 0
                cxc.estado = "pagada"
            else:
                cxc.estado = "pendiente" if cxc.monto_pendiente == cxc.monto_original else "parcial"
        elif saldo_inicial_nuevo > 0:
            tz = pytz.timezone("America/El_Salvador")
            nueva_cxc = CuentaPorCobrar(
                empresa_id=empresa_id,
                cliente_id=c.id_cliente,
                factura_id=None,
                fecha_vencimiento=datetime.now(tz),
                monto_original=saldo_inicial_nuevo,
                monto_pendiente=saldo_inicial_nuevo,
                estado="pendiente"
            )
            db.add(nueva_cxc)

    db.commit()'''

code = code.replace(act_find, act_repl)

with open('routers/clientes.py', 'w', encoding='utf-8') as f:
    f.write(code)
print("Patched clientes.py")