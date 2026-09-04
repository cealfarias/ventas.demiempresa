import re
with open('C:/factura/facturacion_api/routers/dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

grafico_code = '''def obtener_grafico_ventas(empresa_id: str, periodo: str = "anio", anio: int = None, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    import calendar
    hoy = datetime.now(TIMEZONE)
    if not anio:
        anio = hoy.year

    query = db.query(Factura.fecha_emision, Factura.total).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado != "anulada"
    )
    resultado = []

    if periodo == "dia":
        inicio = hoy.replace(hour=7, minute=0, second=0, microsecond=0)
        fin = hoy.replace(hour=22, minute=59, second=59, microsecond=0)
        facturas = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin).all()
        ventas_por_hora = {h: 0 for h in range(7, 23)}
        for f_fecha, f_total in facturas:
            h = f_fecha.hour
            if 7 <= h <= 22:
                ventas_por_hora[h] += f_total
        for h in range(7, 23):
            label = f"{h} AM" if h < 12 else ("12 PM" if h == 12 else f"{h-12} PM")
            resultado.append({"mes": label, "ventas": ventas_por_hora[h]})

    elif periodo == "semana":
        start_of_week = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
        facturas = query.filter(Factura.fecha_emision >= start_of_week, Factura.fecha_emision <= end_of_week).all()
        dias_nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        ventas_por_dia = {i: 0 for i in range(7)}
        for f_fecha, f_total in facturas:
            ventas_por_dia[f_fecha.weekday()] += f_total
        for i in range(7):
            resultado.append({"mes": dias_nombres[i], "ventas": ventas_por_dia[i]})

    elif periodo == "mes":
        _, last_day = calendar.monthrange(hoy.year, hoy.month)
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(day=last_day, hour=23, minute=59, second=59, microsecond=0)
        facturas = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin).all()
        ventas_por_dia = {d: 0 for d in range(1, last_day + 1)}
        for f_fecha, f_total in facturas:
            ventas_por_dia[f_fecha.day] += f_total
        for d in range(1, last_day + 1):
            resultado.append({"mes": str(d), "ventas": ventas_por_dia[d]})

    else:
        inicio_anio = datetime(anio, 1, 1, 0, 0, 0, tzinfo=TIMEZONE)
        fin_anio = datetime(anio, 12, 31, 23, 59, 59, tzinfo=TIMEZONE)
        facturas = query.filter(Factura.fecha_emision >= inicio_anio, Factura.fecha_emision <= fin_anio).all()
        meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        ventas_por_mes = {i: 0 for i in range(1, 13)}
        for f_fecha, f_total in facturas:
            mes = f_fecha.month
            ventas_por_mes[mes] += f_total
        for i in range(1, 13):
            resultado.append({"mes": meses_nombres[i-1], "ventas": ventas_por_mes[i]})
            
    return resultado'''

content = re.sub(r'def obtener_grafico_ventas.*?return resultado', grafico_code, content, flags=re.DOTALL)

with open('C:/factura/facturacion_api/routers/dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)
