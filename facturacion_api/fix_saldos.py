from database import SessionLocal
from models import Cliente, Proveedor, CuentaPorCobrar, CuentaPorPagar
from datetime import datetime
import pytz

db = SessionLocal()
tz = pytz.timezone("America/El_Salvador")

# Fix Clientes
clientes = db.query(Cliente).filter(Cliente.saldo_inicial > 0).all()
cxc_added = 0
for c in clientes:
    # Check if a CxC exists without factura
    cxc = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.cliente_id == c.id_cliente, CuentaPorCobrar.factura_id == None).first()
    if not cxc:
        cxc = CuentaPorCobrar(
            empresa_id=c.empresa_id,
            cliente_id=c.id_cliente,
            factura_id=None,
            fecha_vencimiento=datetime.now(tz),
            monto_original=c.saldo_inicial,
            monto_pendiente=c.saldo_inicial,
            estado="pendiente"
        )
        db.add(cxc)
        cxc_added += 1

# Fix Proveedores
proveedores = db.query(Proveedor).filter(Proveedor.saldo_inicial > 0).all()
cxp_added = 0
for p in proveedores:
    cxp = db.query(CuentaPorPagar).filter(CuentaPorPagar.proveedor_id == p.id, CuentaPorPagar.orden_compra_id == None).first()
    if not cxp:
        cxp = CuentaPorPagar(
            empresa_id=p.empresa_id,
            proveedor_id=p.id,
            orden_compra_id=None,
            fecha_vencimiento=datetime.now(tz),
            monto_original=p.saldo_inicial,
            monto_pendiente=p.saldo_inicial,
            estado="pendiente"
        )
        db.add(cxp)
        cxp_added += 1

db.commit()
print(f"Added {cxc_added} CxC for Clientes")
print(f"Added {cxp_added} CxP for Proveedores")

