import re

with open('facturacion_web/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_api_calls = '''          const [resKpis, resChart] = await Promise.all([
            api.get(/api/v1/dashboard/kpis?empresa_id=&periodo=),
            api.get(/api/v1/dashboard/grafico-ventas?empresa_id=&periodo=&anio=)
          ]);'''
new_api_calls = '''          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const [resKpis, resChart] = await Promise.all([
            api.get(/api/v1/dashboard/kpis?empresa_id=&periodo=&tz=),
            api.get(/api/v1/dashboard/grafico-ventas?empresa_id=&periodo=&anio=&tz=)
          ]);'''

content = content.replace(old_api_calls, new_api_calls)

with open('facturacion_web/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
