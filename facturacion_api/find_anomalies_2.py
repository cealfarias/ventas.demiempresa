from database import SessionLocal
from models import ItemFactura, Factura, Producto
db = SessionLocal()

items = db.query(ItemFactura, Factura, Producto).join(Factura, Factura.id == ItemFactura.factura_id).join(Producto, Producto.id_producto == ItemFactura.producto_id).filter(Factura.empresa_id == "CANTARES").all()

qty_anomalies = []
price_anomalies = []

for i, f, p in items:
    if i.cantidad < 1.0:
        qty_anomalies.append((i, f, p))
    if i.precio_unitario < 0.1:
        price_anomalies.append((i, f, p))

print(f"Items with Qty < 1: {len(qty_anomalies)}")
for i, f, p in qty_anomalies[:5]:
    print(f"Fac {f.numero} | Prod: {p.nombre} | Qty: {i.cantidad} | P.Unit: {i.precio_unitario} | Subt: {i.subtotal} | P.Cat: {p.precio_venta}")

print(f"\nItems with Price < 0.1: {len(price_anomalies)}")
for i, f, p in price_anomalies[:5]:
    print(f"Fac {f.numero} | Prod: {p.nombre} | Qty: {i.cantidad} | P.Unit: {i.precio_unitario} | Subt: {i.subtotal} | P.Cat: {p.precio_venta}")

db.close()

