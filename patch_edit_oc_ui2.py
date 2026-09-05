import re

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("!oc.es_dte_importado && (", "(")

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
