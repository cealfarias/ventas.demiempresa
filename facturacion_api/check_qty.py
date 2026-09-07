from database import SessionLocal
from models import ItemFactura, Producto, Factura
db = SessionLocal()

items = db.query(ItemFactura, Producto, Factura).join(Producto).join(Factura).filter(ItemFactura.cantidad < 0.1, ItemFactura.cantidad > 0).all()
for i, p, f in items:
    print(f"Fac {f.numero} | Prod {p.nombre} | Qty {i.cantidad} | P.Unit {i.precio_unitario} | Subt {i.subtotal}")

db.close()

