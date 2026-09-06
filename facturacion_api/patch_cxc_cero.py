import sys
with open("routers/facturas.py", "r", encoding="utf-8") as f:
    code = f.read()
code = code.replace(
    "if f.cliente:\n                f.cliente.saldo_pendiente = max(0, (f.cliente.saldo_pendiente or 0) - cxc.monto_pendiente)",
    "if f.cliente:\n                f.cliente.saldo_pendiente = max(0, (f.cliente.saldo_pendiente or 0) - cxc.monto_pendiente)\n            cxc.monto_pendiente = 0"
)
with open("routers/facturas.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched facturas.py")

