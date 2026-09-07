
with open("main.py", "r", encoding="utf-8") as f:
    code = f.read()

# Add imports
if "from routers import cajas" not in code:
    code = code.replace("import uvicorn", "from routers import cajas, gastos\nimport uvicorn")

# Add include_routers
if "app.include_router(cajas.router" not in code:
    old = "app.include_router(dashboard.router, prefix=\"/api/v1\")"
    new = "app.include_router(dashboard.router, prefix=\"/api/v1\")\napp.include_router(cajas.router, prefix=\"/api/v1\")\napp.include_router(gastos.router, prefix=\"/api/v1\")"
    code = code.replace(old, new)

with open("main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Fixed main.py")

