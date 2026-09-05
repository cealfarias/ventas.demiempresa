import re

with open('facturacion_api/routers/facturas.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = '''    if data.fecha_emision:
        from datetime import datetime
        import pytz
        tz = pytz.timezone("America/El_Salvador")
        fecha_req = datetime.strptime(data.fecha_emision, "%Y-%m-%d").date()
        ahora = datetime.now(tz)
        if fecha_req == ahora.date():
            f.fecha_emision = ahora
        else:
            f.fecha_emision = tz.localize(datetime.combine(fecha_req, datetime.min.time()))'''

new_logic = '''    if data.fecha_emision:
        from datetime import datetime
        import pytz
        tz = pytz.timezone("America/El_Salvador")
        if "T" in data.fecha_emision:
            # Viene fecha y hora: YYYY-MM-DDTHH:MM
            # Quitar segundos si los trae
            fecha_str = data.fecha_emision[:16]
            fecha_req = datetime.strptime(fecha_str, "%Y-%m-%dT%H:%M")
            f.fecha_emision = tz.localize(fecha_req)
        else:
            fecha_req = datetime.strptime(data.fecha_emision, "%Y-%m-%d").date()
            ahora = datetime.now(tz)
            if fecha_req == ahora.date():
                f.fecha_emision = ahora
            else:
                f.fecha_emision = tz.localize(datetime.combine(fecha_req, datetime.min.time()))'''

content = content.replace(old_logic, new_logic)

with open('facturacion_api/routers/facturas.py', 'w', encoding='utf-8') as f:
    f.write(content)
