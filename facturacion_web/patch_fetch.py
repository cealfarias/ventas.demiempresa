
with open("src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    code = f.read()

old_fetch = """        const [resKpis, resChart] = await Promise.all([
          api.get(`/api/v1/dashboard/kpis?empresa_id=${empresaId()}&periodo=${periodo}&tz=${tz}`),
          api.get(`/api/v1/dashboard/grafico-ventas?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}&tz=${tz}`)
        ]);
        setKpis(resKpis.data);
        setChartData(resChart.data.map(d => ({ ...d, ventas: d.ventas / 100, compras: d.compras / 100 })));"""

new_fetch = """        const [resKpis, resChart, resTop] = await Promise.all([
          api.get(`/api/v1/dashboard/kpis?empresa_id=${empresaId()}&periodo=${periodo}&tz=${tz}`),
          api.get(`/api/v1/dashboard/grafico-ventas?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}&tz=${tz}`),
          api.get(`/api/v1/dashboard/top-productos?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}&tz=${tz}`)
        ]);
        setKpis(resKpis.data);
        setChartData(resChart.data.map(d => ({ ...d, ventas: d.ventas / 100, compras: d.compras / 100 })));
        setTopProductos(resTop.data);
        setCurrentPage(1);"""

code = code.replace(old_fetch, new_fetch)

with open("src/pages/Dashboard.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched fetch")

