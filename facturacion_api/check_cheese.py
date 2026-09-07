from database import SessionLocal
from models import ItemFactura, Factura, Producto
db = SessionLocal()

items = db.query(ItemFactura, Factura).join(Factura).join(Producto).filter(Producto.nombre == "Queso Duro Blando Libra", ItemFactura.cantidad == 0.5, Factura.empresa_id == "CANTARES").all()
for i, f in items[:5]:
    print(f"Fac {f.numero} | Qty {i.cantidad} | P.Unit {i.precio_unitario} | ItemSubt {i.subtotal} | FacSubt {f.subtotal}")

db.close()

