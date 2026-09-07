from database import SessionLocal
from models import Producto
db = SessionLocal()
p = db.query(Producto).filter(Producto.nombre.like("%PAPEL SCOTT%"), Producto.empresa_id == "CANTARES").first()
print(p.id_producto, p.nombre, p.precio_venta)
db.close()

