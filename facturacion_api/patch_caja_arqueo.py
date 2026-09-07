import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def upgrade():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE sesiones_caja ADD COLUMN detalle_arqueo JSON;"))
            print("Agregada columna detalle_arqueo")
        except Exception as e:
            print("Nota: columna detalle_arqueo ya existía o error:", str(e).split('\n')[0])
            
        try:
            conn.execute(text("ALTER TABLE sesiones_caja ADD COLUMN diferencia INTEGER;"))
            print("Agregada columna diferencia")
        except Exception as e:
            print("Nota: columna diferencia ya existía o error:", str(e).split('\n')[0])
            
if __name__ == "__main__":
    upgrade()
