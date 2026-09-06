import sys
with open("routers/dashboard.py", "r", encoding="utf-8") as f:
    code = f.read()

old_cxc = """    cxc = db.query(func.sum(CuentaPorCobrar.monto_pendiente)).filter(
        CuentaPorCobrar.empresa_id == empresa_id,
        CuentaPorCobrar.estado != "pagada"
    ).scalar() or 0"""

new_cxc = """    cxc = db.query(func.sum(CuentaPorCobrar.monto_pendiente)).filter(
        CuentaPorCobrar.empresa_id == empresa_id,
        CuentaPorCobrar.estado != "pagada",
        CuentaPorCobrar.estado != "anulada"
    ).scalar() or 0"""

code = code.replace(old_cxc, new_cxc)

old_cxp = """    cxp = db.query(func.sum(CuentaPorPagar.monto_pendiente)).filter(
        CuentaPorPagar.empresa_id == empresa_id,
        CuentaPorPagar.estado != "pagada"
    ).scalar() or 0"""

new_cxp = """    cxp = db.query(func.sum(CuentaPorPagar.monto_pendiente)).filter(
        CuentaPorPagar.empresa_id == empresa_id,
        CuentaPorPagar.estado != "pagada",
        CuentaPorPagar.estado != "anulada"
    ).scalar() or 0"""

code = code.replace(old_cxp, new_cxp)

with open("routers/dashboard.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched dashboard")

