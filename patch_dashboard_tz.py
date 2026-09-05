import re

with open('facturacion_api/routers/dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace TIMEZONE constant usage with tz parameter in kpis
content = content.replace('def obtener_kpis(empresa_id: str, periodo: str = "dia", db: Session = Depends(get_db)):', 'def obtener_kpis(empresa_id: str, periodo: str = "dia", tz: str = "America/El_Salvador", db: Session = Depends(get_db)):\\n    local_tz = pytz.timezone(tz)')
content = content.replace('hoy = datetime.now(TIMEZONE)', 'hoy = datetime.now(local_tz)')

# Replace TIMEZONE constant usage with tz parameter in grafico_ventas
content = content.replace('def obtener_grafico_ventas(empresa_id: str, periodo: str = "anio", anio: int = None, db: Session = Depends(get_db)):', 'def obtener_grafico_ventas(empresa_id: str, periodo: str = "anio", anio: int = None, tz: str = "America/El_Salvador", db: Session = Depends(get_db)):\\n    local_tz = pytz.timezone(tz)')
content = content.replace('TIMEZONE', 'local_tz')

with open('facturacion_api/routers/dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)
