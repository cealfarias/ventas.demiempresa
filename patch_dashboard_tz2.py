import re

with open('facturacion_api/routers/dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\n    local_tz = pytz.timezone(tz)', '\\n    local_tz = pytz.timezone(tz)')
# Actually I need to replace the literal string '\\n' with a real newline.
content = content.replace(r'\n    local_tz = pytz.timezone(tz)', '\n    local_tz = pytz.timezone(tz)')

with open('facturacion_api/routers/dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)
