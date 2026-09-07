import sys

with open("routers/clientes.py", "r", encoding="utf-8") as f:
    code = f.read()

old_crear = """def crear_cliente(empresa_id: str, cliente: ClienteCreate, db: Session = Depends(get_db)):
    db_cliente = Cliente(**cliente.dict(), empresa_id=empresa_id)
    db.add(db_cliente)
    db.commit()"""
new_crear = """def crear_cliente(empresa_id: str, cliente: ClienteCreate, db: Session = Depends(get_db)):
    if cliente.es_predeterminado:
        db.query(Cliente).filter(Cliente.empresa_id == empresa_id).update({"es_predeterminado": False})
    
    db_cliente = Cliente(**cliente.dict(), empresa_id=empresa_id)
    db.add(db_cliente)
    db.commit()"""

code = code.replace(old_crear, new_crear)

old_act = """    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(c, campo, valor)
        
    db.commit()"""
new_act = """    if datos.es_predeterminado:
        db.query(Cliente).filter(Cliente.empresa_id == empresa_id, Cliente.id_cliente != cliente_id).update({"es_predeterminado": False})
        
    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(c, campo, valor)
        
    db.commit()"""
code = code.replace(old_act, new_act)

with open("routers/clientes.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched clientes.py")

