from database import SessionLocal
from models import Cliente
db = SessionLocal()
try:
    c = Cliente(empresa_id="CANTARES", nombre="Test POST", es_predeterminado=False)
    db.add(c)
    db.commit()
    print("Created successfully")
except Exception as e:
    print("Error:", e)

