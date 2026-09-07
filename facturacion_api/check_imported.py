from database import SessionLocal
from models import ItemFactura, Factura, Producto
db = SessionLocal()

items = db.query(ItemFactura, Factura, Producto).join(Factura).join(Producto).filter(Producto.nombre == "PAPEL SCOTT AMARILLO 2 EN 1").limit(10).all()

for i, f, p in items:
    print(f"Fac {f.numero} | Qty: {i.cantidad} | P.Unit: {i.precio_unitario} | Subt: {i.subtotal}")

db.close()

