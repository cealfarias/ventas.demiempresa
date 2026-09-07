from database import SessionLocal
from models import Cliente
db = SessionLocal()
try:
    cliente_id = 48
    empresa_id = "CANTARES"
    
    c = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.empresa_id == empresa_id).first()
    print("Found client:", c)
    
    # Simulate update
    db.query(Cliente).filter(Cliente.empresa_id == empresa_id, Cliente.id_cliente != cliente_id).update({"es_predeterminado": False})
    
    setattr(c, "es_predeterminado", True)
    
    db.commit()
    print("Success")
except Exception as e:
    print("Error:", e)

