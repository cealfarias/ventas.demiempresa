from database import SessionLocal
from models import ItemFactura, Factura, Producto
db = SessionLocal()

items = db.query(ItemFactura, Factura, Producto).join(Factura, Factura.id == ItemFactura.factura_id).join(Producto, Producto.id_producto == ItemFactura.producto_id).filter(Factura.empresa_id == "CANTARES").all()

updates = 0
for i, f, p in items:
    changed = False
    
    # Base real truth is `subtotal` and `Producto.precio_venta` (assuming it is the same as when it was sold)
    if p.precio_venta > 0 and i.subtotal > 0:
        expected_qty = (i.subtotal / 100.0) / p.precio_venta
        
        # We allow small float differences
        if abs(i.cantidad - expected_qty) > 0.01:
            # Re-adjust qty based on subtotal and catalog price
            i.cantidad = round(expected_qty, 2)
            i.precio_unitario = p.precio_venta
            changed = True
    
    # If subtotal is 0 but quantity > 0, maybe subtotal was incorrectly recorded
    elif i.subtotal == 0 and i.cantidad > 0 and p.precio_venta > 0:
        i.subtotal = int(i.cantidad * p.precio_venta * 100)
        i.precio_unitario = p.precio_venta
        changed = True
        
    # Check if precio unitario is strangely low or high
    if p.precio_venta > 0:
        if i.precio_unitario == 0 or i.precio_unitario < (p.precio_venta * 0.1) or i.precio_unitario > (p.precio_venta * 10):
            i.precio_unitario = p.precio_venta
            changed = True
            
    if changed:
        updates += 1

db.commit()
print(f"Fixed {updates} items based on catalog prices and subtotals.")
db.close()

