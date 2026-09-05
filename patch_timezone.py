import re

with open('facturacion_api/routers/dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_loop_dia = '''
        for f_fecha, f_total in facturas:
            h = f_fecha.hour
'''
new_loop_dia = '''
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            h = f_fecha.hour
'''
content = content.replace(old_loop_dia.strip(), new_loop_dia.strip())

old_loop_semana = '''
        for f_fecha, f_total in facturas:
            ventas_por_dia[f_fecha.weekday()] += f_total
'''
new_loop_semana = '''
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            ventas_por_dia[f_fecha.weekday()] += f_total
'''
content = content.replace(old_loop_semana.strip(), new_loop_semana.strip())

old_loop_mes = '''
        for f_fecha, f_total in facturas:
            ventas_por_dia[f_fecha.day] += f_total
'''
new_loop_mes = '''
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            ventas_por_dia[f_fecha.day] += f_total
'''
content = content.replace(old_loop_mes.strip(), new_loop_mes.strip())

old_loop_anio = '''
        for f_fecha, f_total in facturas:
            mes = f_fecha.month
'''
new_loop_anio = '''
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            mes = f_fecha.month
'''
content = content.replace(old_loop_anio.strip(), new_loop_anio.strip())

with open('facturacion_api/routers/dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)

