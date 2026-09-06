import sys
with open("routers/cuentas_cobrar.py", "r", encoding="utf-8") as f:
    code = f.read()

old_query = """    if estado:
        query = query.filter(CuentaPorCobrar.estado == estado)
    if cliente_id:"""

new_query = """    if estado:
        query = query.filter(CuentaPorCobrar.estado == estado)
    else:
        query = query.filter(CuentaPorCobrar.estado != "anulada")
    if cliente_id:"""

code = code.replace(old_query, new_query)

with open("routers/cuentas_cobrar.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched cuentas_cobrar.py")

