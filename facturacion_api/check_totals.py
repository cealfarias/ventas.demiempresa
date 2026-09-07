from database import SessionLocal
from models import ItemFactura, Factura, Producto
from sqlalchemy.orm import joinedload
db = SessionLocal()

facs = db.query(Factura).options(joinedload(Factura.items)).filter(Factura.empresa_id == "CANTARES").all()

updates = 0
for f in facs:
    calc_subtotal = 0
    for i in f.items:
        calc_subtotal += i.subtotal
    
    # If the items sum doesn't match the factura subtotal, fix the items!
    if calc_subtotal != f.subtotal:
        print(f"Fac {f.numero} mismatch! Header subt: {f.subtotal} | Items sum: {calc_subtotal}")
        
db.close()

