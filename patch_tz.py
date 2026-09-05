import re

with open('facturacion_api/routers/dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the timezone issue
old_tz_logic = '''            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)'''
new_tz_logic = '''            if not f_fecha.tzinfo:
                f_fecha = f_fecha.replace(tzinfo=pytz.UTC)
            f_fecha = f_fecha.astimezone(TIMEZONE)'''

content = content.replace(old_tz_logic, new_tz_logic)

with open('facturacion_api/routers/dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)
