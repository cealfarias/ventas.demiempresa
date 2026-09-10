import sys
import os
from datetime import timedelta

from database import SessionLocal
from models import CuentaPorCobrar, Factura

def fix_cxc_dates():
    db = SessionLocal()
    try:
        cuentas = db.query(CuentaPorCobrar).all()
        print(f"Total cuentas por cobrar encontradas: {len(cuentas)}")
        
        actualizadas = 0
        for c in cuentas:
            fecha_emision = None
            if c.factura and c.factura.fecha_emision:
                fecha_emision = c.factura.fecha_emision
            else:
                fecha_emision = c.fecha_creacion

            if not fecha_emision:
                continue

            # Si la fecha de vencimiento es nula o menor o igual a la fecha de emision/creacion (o diferencia < 1 dia)
            if not c.fecha_vencimiento or c.fecha_vencimiento <= fecha_emision or (c.fecha_vencimiento - fecha_emision).days < 1:
                nueva_venc = fecha_emision + timedelta(days=30)
                print(f"Fixing CxC ID {c.id} (Factura {c.factura.numero if c.factura else 'N/A'}): {c.fecha_vencimiento} -> {nueva_venc}")
                c.fecha_vencimiento = nueva_venc
                actualizadas += 1
        
        if actualizadas > 0:
            db.commit()
            print(f"¡Éxito! Se actualizaron {actualizadas} cuentas por cobrar en la base de datos.")
        else:
            print("No se encontraron cuentas por cobrar con fecha de vencimiento errónea.")
    except Exception as e:
        print(f"Error al actualizar base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_cxc_dates()
