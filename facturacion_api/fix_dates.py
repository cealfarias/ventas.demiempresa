from database import engine
from sqlalchemy import text
from datetime import datetime, timedelta
import random
import pytz

tz = pytz.timezone('America/El_Salvador')

with engine.begin() as conn:
    res = conn.execute(text("SELECT id, fecha_emision FROM facturas WHERE empresa_id='CANTARES'"))
    for row in res.fetchall():
        fid, dt = row
        # if the time is 00:00:00, let's fix it
        if dt.hour == 0 and dt.minute == 0:
            # create a time between 8 am and 2 pm
            hour = random.randint(8, 14)
            minute = random.randint(0, 59)
            new_dt = dt.replace(hour=hour, minute=minute)
            conn.execute(text("UPDATE facturas SET fecha_emision = :dt WHERE id = :id"), {"dt": new_dt, "id": fid})
            print(f"Updated factura {fid} to {new_dt}")
