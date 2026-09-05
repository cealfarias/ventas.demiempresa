import re

with open('facturacion_api/routers/ordenes_compra.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('if oc.estado != "BORRADOR" and oc.estado != "EMITIDA":\\n        raise HTTPException(status_code=400, detail="Solo se pueden editar ordenes en estado BORRADOR o EMITIDA")', 'if oc.estado not in ["borrador", "enviada"]:\\n        raise HTTPException(status_code=400, detail="Solo se pueden editar ordenes en estado BORRADOR o ENVIADA")')

with open('facturacion_api/routers/ordenes_compra.py', 'w', encoding='utf-8') as f:
    f.write(content)
