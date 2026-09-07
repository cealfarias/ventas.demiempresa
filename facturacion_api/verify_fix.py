from database import SessionLocal
from models import ItemFactura, Factura, Producto
db = SessionLocal()
i = db.query(ItemFactura).join(Factura).join(Producto).filter(Producto.nombre == "PAPEL SCOTT AMARILLO 2 EN 1", Factura.numero == "FAC-2026-000002").first()
if i:
    print(f"Qty: {i.cantidad} | P.Unit: {i.precio_unitario} | Subt: {i.subtotal}")
db.close()

