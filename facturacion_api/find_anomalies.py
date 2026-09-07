from database import SessionLocal
from models import ItemFactura, Factura, Producto
db = SessionLocal()

items = db.query(ItemFactura, Factura, Producto).join(Factura, Factura.id == ItemFactura.factura_id).join(Producto, Producto.id_producto == ItemFactura.producto_id).filter(Factura.empresa_id == "CANTARES").all()

anomalies_qty = []
anomalies_price = []

for i, f, p in items:
    # 1. Check quantity anomaly
    if i.cantidad < 0.1 and i.cantidad > 0:
        # Check if subtotal makes sense
        if p.precio_venta > 0:
            expected_subtotal = int(i.cantidad * p.precio_venta * 100)
            actual_subtotal = i.subtotal
            if expected_subtotal != actual_subtotal and int((i.cantidad * 100) * p.precio_venta * 100) == actual_subtotal:
                anomalies_qty.append((i, f, p))
            elif i.cantidad == 0.01 and p.precio_venta == i.precio_unitario:
                anomalies_qty.append((i, f, p))

    # 2. Check price anomaly (precio_unitario divided by 100)
    if i.precio_unitario > 0 and p.precio_venta > 0:
        ratio = p.precio_venta / i.precio_unitario
        if 95 <= ratio <= 105: # Price is ~100x smaller than it should be
            anomalies_price.append((i, f, p))

print(f"Anomalies QTY (< 0.1): {len(anomalies_qty)}")
if anomalies_qty:
    i, f, p = anomalies_qty[0]
    print(f"Example QTY Anomaly: Fac {f.numero} | Prod: {p.nombre} | Qty: {i.cantidad} | P.Unit: {i.precio_unitario} | Subt: {i.subtotal} | P.Cat: {p.precio_venta}")

print(f"Anomalies PRICE (~ /100): {len(anomalies_price)}")
if anomalies_price:
    i, f, p = anomalies_price[0]
    print(f"Example PRICE Anomaly: Fac {f.numero} | Prod: {p.nombre} | Qty: {i.cantidad} | P.Unit: {i.precio_unitario} | Subt: {i.subtotal} | P.Cat: {p.precio_venta}")

db.close()

