import sqlite3
from database import SessionLocal
from models import ItemFactura, Factura, Producto

sqlite_path = r"C:\Users\cealf\OneDrive\delcaraciones de IVA\000 CONTROL DE INVENTARIO\inventario.db"

def main():
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    db = SessionLocal()
    
    # Get all items in PROD that are historical
    items_prod = db.query(ItemFactura, Factura, Producto).join(Factura).join(Producto).filter(Factura.empresa_id == "CANTARES", Factura.numero.like("FAC-2026-%")).all()
    
    # Get all items in SQLite
    items_sqlite = cursor.execute("""
        SELECT i.factura_id, i.producto_id, i.cantidad, i.precio_unitario, f.numero, p.codigo 
        FROM items_factura i 
        JOIN facturas f ON f.id = i.factura_id
        JOIN productos p ON p.id_producto = i.producto_id
    """).fetchall()
    
    from collections import defaultdict
    sqlite_map = defaultdict(list)
    for row in items_sqlite:
        sqlite_map[(row["numero"], row["codigo"])].append({
            "qty": float(row["cantidad"]) / 100.0,
            "price": float(row["precio_unitario"]) / 10000.0
        })
        
    updates = 0
    for i, f, p in items_prod:
        key = (f.numero, p.codigo)
        if key in sqlite_map and len(sqlite_map[key]) > 0:
            old_data = sqlite_map[key].pop(0)
            qty = old_data["qty"]
            price = old_data["price"]
            
            if p.precio_venta > 0:
                if price == 0 or price < (p.precio_venta * 0.1) or price > (p.precio_venta * 10):
                    price = p.precio_venta
                    
            if qty <= 0:
                qty = 1.0
                
            new_subtotal = int(qty * price * 100)
            
            if i.cantidad != qty or i.precio_unitario != price or i.subtotal != new_subtotal:
                i.cantidad = qty
                i.precio_unitario = price
                i.subtotal = new_subtotal
                updates += 1
                
                if updates % 100 == 0:
                    db.commit()
                
    db.commit()
    print(f"Fixed {updates} items by restoring exact quantities from SQLite and fixing prices.")
    
    # Fix Factura headers
    facs = db.query(Factura).filter(Factura.empresa_id == "CANTARES", Factura.numero.like("FAC-2026-%")).all()
    header_updates = 0
    for idx, fac in enumerate(facs):
        items = db.query(ItemFactura).filter(ItemFactura.factura_id == fac.id).all()
        real_subtotal = sum(item.subtotal for item in items)
        if fac.subtotal != real_subtotal or fac.total != real_subtotal:
            fac.subtotal = real_subtotal
            fac.total = real_subtotal
            header_updates += 1
            if header_updates % 50 == 0:
                db.commit()
            
    db.commit()
    print(f"Fixed {header_updates} Factura headers to perfectly match item subtotals.")
    
    db.close()
    conn.close()

if __name__ == "__main__":
    main()

