import re

with open('facturacion_api/routers/ordenes_compra.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('if orden.calcular_iva else 0', 'if data.calcular_iva else 0')

with open('facturacion_api/routers/ordenes_compra.py', 'w', encoding='utf-8') as f:
    f.write(content)
