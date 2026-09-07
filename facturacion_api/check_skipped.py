import sqlite3
from database import SessionLocal
from models import Factura
sqlite_path = r"C:\Users\cealf\OneDrive\delcaraciones de IVA\000 CONTROL DE INVENTARIO\inventario.db"
conn = sqlite3.connect(sqlite_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
facturas_local = cursor.execute("SELECT numero FROM facturas").fetchall()
local_nums = {f["numero"] for f in facturas_local}

db = SessionLocal()
prod_nums = {f.numero for f in db.query(Factura.numero).filter(Factura.empresa_id == "CANTARES").all()}

coincidencias = local_nums.intersection(prod_nums)
print("Coincidencias (skipped):", len(coincidencias))
print("Ejemplos de omitidas:", list(coincidencias)[:10])

