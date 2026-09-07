from database import SessionLocal
from models import ItemFactura, Factura, Producto
db = SessionLocal()

# Let's fetch some recently imported invoices
facs = db.query(Factura).filter(Factura.numero.like("FAC-2026-000%")).limit(50).all()
fac_ids = [f.id for f in facs]

items = db.query(ItemFactura).filter(ItemFactura.factura_id.in_(fac_ids)).all()

for i in items[:20]:
    p = db.query(Producto).get(i.producto_id)
    print(f"Fac {i.factura_id} | Prod: {p.nombre} | Qty: {i.cantidad} | P.Unit: {i.precio_unitario} | Subt: {i.subtotal} | P.Cat: {p.precio_venta}")

db.close()

