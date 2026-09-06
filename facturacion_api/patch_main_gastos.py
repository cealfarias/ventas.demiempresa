import sys
with open("main.py", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("from routers import dashboard, facturas, productos, cajas", "from routers import dashboard, facturas, productos, cajas, gastos")
code = code.replace("app.include_router(cajas.router)", "app.include_router(cajas.router)\napp.include_router(gastos.router)")

with open("main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Gastos router agregado a main")

