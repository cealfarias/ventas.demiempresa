from database import SessionLocal
from models import Cliente, Producto, Bodega
from routers.facturas import crear_factura, FacturaCreate, ItemFacturaCreate
db = SessionLocal()
try:
    c = db.query(Cliente).first()
    p = db.query(Producto).first()
    b = db.query(Bodega).first()
    data = FacturaCreate(
        cliente_id=c.id_cliente,
        bodega_salida_id=b.id,
        tipo_doc="FACTURA",
        condicion_operacion="CONTADO",
        metodo_pago="efectivo",
        dias_credito=30,
        subtotal=100,
        iva=0,
        total=100,
        items=[ItemFacturaCreate(producto_id=p.id_producto, cantidad=1, precio_unitario=1.0000, subtotal=100)]
    )
    print("Testing crear_factura...")
    res = crear_factura("CANTARES", 1, data, db)
    print("Success:", res.id)
    db.rollback()
except Exception as e:
    import traceback
    traceback.print_exc()

