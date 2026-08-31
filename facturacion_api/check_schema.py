import os, sys
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import inspect
sys.path.append(r'C:\factura\facturacion_api')
from database import engine

inspector = inspect(engine)
tables = ['clientes', 'productos', 'facturas', 'inventarios']
for t in tables:
    if t in inspector.get_table_names():
        print(f'--- {t} ---')
        for col in inspector.get_columns(t): print(f"{col['name']}: {col['type']}")
