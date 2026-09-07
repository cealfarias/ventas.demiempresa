import sys
with open("routers/clientes.py", "r", encoding="utf-8") as f:
    code = f.read()
code = code.replace("es_gran_contribuyente: bool = False`n    es_predeterminado: bool = False", "es_gran_contribuyente: bool = False\n    es_predeterminado: bool = False")
with open("routers/clientes.py", "w", encoding="utf-8") as f:
    f.write(code)

