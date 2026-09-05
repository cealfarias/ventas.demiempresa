from database import engine
from sqlalchemy import text
from datetime import datetime, timedelta
import random

with engine.begin() as conn:
    res = conn.execute(text("SELECT id, fecha_emision FROM facturas WHERE empresa_id='CANTARES'"))
    for row in res.fetchall():
        fid, dt = row
        # set all today's facturas to 16 UTC (10 AM El Salvador)
        new_dt = dt.replace(hour=16, minute=random.randint(0, 59))
        conn.execute(text("UPDATE facturas SET fecha_emision = :dt WHERE id = :id"), {"dt": new_dt, "id": fid})
        print(f"Updated factura {fid} to {new_dt}")
