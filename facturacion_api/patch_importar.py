import sys

with open("importar_historico.py", "r", encoding="utf-8") as f:
    code = f.read()

# Optimize existing check
old_check = """    for f in facturas_local:
        # Check si ya existe
        existe = db_prod.query(Factura).filter(Factura.numero == f["numero"], Factura.empresa_id == "CANTARES").first()
        if existe:
            continue"""

new_check = """    
    # Obtener todas las facturas existentes de una vez
    facturas_existentes = {f.numero for f in db_prod.query(Factura.numero).filter(Factura.empresa_id == "CANTARES").all()}
    print(f"Facturas existentes en PROD: {len(facturas_existentes)}")

    for f in facturas_local:
        if f["numero"] in facturas_existentes:
            continue"""

code = code.replace(old_check, new_check)

with open("importar_historico.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Optimizacion aplicada")

