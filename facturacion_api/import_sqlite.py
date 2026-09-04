import sqlite3
import os
import pytz
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Cliente, Proveedor, Producto
import json

OLD_DB_PATH = r"C:\Users\cealf\OneDrive\delcaraciones de IVA\000 CONTROL DE INVENTARIO\inventario.db"
EMPRESA_ID = "CANTARES"
TIMEZONE = pytz.timezone("America/El_Salvador")

def run_import():
    if not os.path.exists(OLD_DB_PATH):
        print(f"Error: No se encontro la base de datos antigua en {OLD_DB_PATH}")
        return

    conn = sqlite3.connect(OLD_DB_PATH)
    cursor = conn.cursor()
    db: Session = SessionLocal()

    try:
        # Importar Clientes
        print("Importando clientes...")
        cursor.execute("SELECT nombre, nit, email, telefono, direccion FROM clientes")
        clientes_agregados = 0
        for row in cursor.fetchall():
            nombre, nit, email, tel, direc = row
            if not nombre: continue
            
            existe = db.query(Cliente).filter(Cliente.empresa_id == EMPRESA_ID, Cliente.nombre == nombre).first()
            if not existe:
                c = Cliente(
                    empresa_id=EMPRESA_ID,
                    nombre=nombre,
                    nit=nit or "",
                    email=email or "",
                    telefono=tel or "",
                    direccion=direc or ""
                )
                db.add(c)
                clientes_agregados += 1
        
        # Importar Proveedores
        print("Importando proveedores...")
        cursor.execute("SELECT nombre, nit, '', telefono, email FROM proveedores")
        proveedores_agregados = 0
        for row in cursor.fetchall():
            nombre, nit, nrc, tel, email = row
            if not nombre: continue
            
            existe = db.query(Proveedor).filter(Proveedor.empresa_id == EMPRESA_ID, Proveedor.nombre == nombre).first()
            if not existe:
                p = Proveedor(
                    empresa_id=EMPRESA_ID,
                    nombre=nombre,
                    nit=nit or "",
                    nrc=nrc or "",
                    telefono=tel or "",
                    email=email or ""
                )
                db.add(p)
                proveedores_agregados += 1

        # Importar Productos de la nueva ruta (Upsert)
        print("Importando/Actualizando productos desde la base correcta...")
        cursor.execute("SELECT codigo, nombre, descripcion, precio_venta, costo_promedio, imagen_url FROM productos")
        productos_agregados = 0
        productos_actualizados = 0
        for row in cursor.fetchall():
            codigo, nombre, descripcion, precio, costo, img_url = row
            if not codigo or not nombre: continue
            
            precio_centavos = int(float(precio or 0) * 100)
            costo_centavos = int(float(costo or 0) * 100)
            
            prod = db.query(Producto).filter(Producto.empresa_id == EMPRESA_ID, Producto.codigo == codigo).first()
            if prod:
                prod.nombre = nombre
                prod.descripcion = descripcion or ""
                prod.precio_venta = precio_centavos
                prod.costo_promedio = costo_centavos
                prod.imagen_url = img_url or ""
                productos_actualizados += 1
            else:
                prod = Producto(
                    empresa_id=EMPRESA_ID,
                    codigo=codigo,
                    nombre=nombre,
                    descripcion=descripcion or "",
                    precio_venta=precio_centavos,
                    costo_promedio=costo_centavos,
                    imagen_url=img_url or ""
                )
                db.add(prod)
                productos_agregados += 1

        db.commit()
        print(f"Importacion finalizada: {productos_agregados} creados, {productos_actualizados} actualizados.")
        
    except Exception as e:
        print(f"Error durante la importacion: {e}")
        db.rollback()
    finally:
        db.close()
        conn.close()

if __name__ == "__main__":
    run_import()
