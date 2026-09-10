import sys
import os
from datetime import timedelta
from database import SessionLocal
from models import Factura, CuentaPorCobrar

def fix_fac_1609():
    db = SessionLocal()
    try:
        fac = db.query(Factura).filter(Factura.numero == "FAC-2026-01609").first()
        if not fac:
            print("Factura FAC-2026-01609 no encontrada")
            return

        fac.dias_credito = 1
        print(f"Factura {fac.numero}: dias_credito fijado en 1 dia.")

        cxc = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.factura_id == fac.id).first()
        if cxc:
            nueva_venc = fac.fecha_emision + timedelta(days=1)
            print(f"CxC ID {cxc.id} (Factura {fac.numero}): fecha_emision={fac.fecha_emision} -> fecha_vencimiento={nueva_venc}")
            cxc.fecha_vencimiento = nueva_venc
        
        db.commit()
        print("¡Factura FAC-2026-01609 actualizada a 1 día de plazo con éxito!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_fac_1609()
