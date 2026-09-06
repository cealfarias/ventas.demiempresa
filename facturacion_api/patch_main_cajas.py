import sys
with open("main.py", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("from routers import dashboard, facturas, productos", "from routers import dashboard, facturas, productos, cajas")
code = code.replace("app.include_router(clientes.router)", "app.include_router(clientes.router)\napp.include_router(cajas.router)")

with open("main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Cajas router agregado a main")

