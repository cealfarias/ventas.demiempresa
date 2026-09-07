import sqlite3
import os
from database import SessionLocal
from models import Cliente, Producto, Factura, ItemFactura

sqlite_path = r"C:\Users\cealf\OneDrive\delcaraciones de IVA\000 CONTROL DE INVENTARIO\inventario.db"

def main():
    print("Iniciando importación...")
    db_prod = SessionLocal()
    
    # Mapeos
    clientes_prod = {c.nombre: c.id_cliente for c in db_prod.query(Cliente).filter(Cliente.empresa_id == "CANTARES").all()}
    productos_prod = {p.codigo: p.id_producto for p in db_prod.query(Producto).filter(Producto.empresa_id == "CANTARES").all()}
    
    cliente_generico_id = list(clientes_prod.values())[0] if clientes_prod else None
    
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    facturas_local = cursor.execute("""
        SELECT f.id as old_id, f.numero, c.nombre as cliente_nombre, f.fecha_emision, f.subtotal, f.iva, f.total, f.estado, f.forma_pago, f.dias_credito 
        FROM facturas f 
        LEFT JOIN clientes c ON c.id_cliente = f.cliente_id
    """).fetchall()
    
    print(f"Facturas a importar: {len(facturas_local)}")
    
    count = 0
    
    # Obtener todas las facturas existentes de una vez
    facturas_existentes = {f.numero for f in db_prod.query(Factura.numero).filter(Factura.empresa_id == "CANTARES").all()}
    print(f"Facturas existentes en PROD: {len(facturas_existentes)}")

    for f in facturas_local:
        if f["numero"] in facturas_existentes:
            continue
            
        cli_id = clientes_prod.get(f["cliente_nombre"], cliente_generico_id)
        if not cli_id:
            continue # No hay cliente al cual asignar
            
        condicion = "CONTADO" if f["dias_credito"] == 0 else "CREDITO"
        
        # Mapear estado
        estado_map = f["estado"]
        if estado_map not in ["emitida", "anulada"]:
            estado_map = "emitida"
            
        nueva_fac = Factura(
            empresa_id="CANTARES",
            numero=f["numero"],
            cliente_id=cli_id,
            tipo_doc="FACTURA", # Asumimos FACTURA para historico sqlite
            condicion_operacion=condicion,
            fecha_emision=f["fecha_emision"],
            subtotal=int(float(f["subtotal"]) * 100),
            iva=int(float(f["iva"]) * 100),
            total=int(float(f["total"]) * 100),
            estado=estado_map,
            estado_dte="procesado", usuario_id=1
        )
        
        db_prod.add(nueva_fac)
        db_prod.flush() # para obtener el ID de nueva_fac
        
        items_old = cursor.execute("SELECT i.cantidad, i.precio_unitario, i.subtotal, p.codigo FROM items_factura i JOIN productos p ON p.id_producto = i.producto_id WHERE i.factura_id = ?", (f["old_id"],)).fetchall()
        
        for item in items_old:
            prod_id = productos_prod.get(item["codigo"])
            if prod_id:
                nuevo_item = ItemFactura(
                    factura_id=nueva_fac.id,
                    producto_id=prod_id,
                    cantidad=float(item["cantidad"]) / 100.0,
                    precio_unitario=float(item["precio_unitario"]), # ya viene en centavos? El schema dice "precio_unitario INTEGER NOT NULL, -- escalado x10000"
                    # wait, lets look at schema: precio_unitario is * 10000 in local sqlite. But SaaS uses precision 4 decimals and float. Let's assume the old one was * 10000
                    # Wait, our SaaS ItemFactura: precio_unitario = Column(Float), subtotal = Column(Integer)
                    subtotal=int(item["subtotal"]) # ya escalado * 100
                )
                nuevo_item.precio_unitario = float(item["precio_unitario"]) / 10000.0
                db_prod.add(nuevo_item)
                
        count += 1
        if count % 100 == 0:
            db_prod.commit()
            print(f"{count} facturas importadas...")
            
    db_prod.commit()
    print(f"Importación completada. {count} nuevas facturas insertadas.")
    conn.close()
    db_prod.close()

if __name__ == "__main__":
    main()

