import sys

with open("src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# Imports
code = code.replace(
    "import { LayoutDashboard, TrendingUp, CreditCard, ShoppingCart, Calendar, AlertTriangle, Truck } from 'lucide-react';",
    "import { LayoutDashboard, TrendingUp, CreditCard, ShoppingCart, Calendar, AlertTriangle, Truck, ChevronDown, ChevronUp, Package } from 'lucide-react';"
)

# State
code = code.replace(
    "const [cargando, setCargando] = useState(true);",
    "const [cargando, setCargando] = useState(true);\n  const [topProductos, setTopProductos] = useState([]);\n  const [sortField, setSortField] = useState('total');\n  const [sortOrder, setSortOrder] = useState('desc');\n  const [currentPage, setCurrentPage] = useState(1);"
)

# Fetch
old_fetch = """      try {
        const [kpiRes, chartRes] = await Promise.all([
          api.get(`/api/v1/dashboard?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}`),
          api.get(`/api/v1/dashboard/grafico-ventas?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}`)
        ]);
        setKpis(kpiRes.data);
        setChartData(chartRes.data);"""

new_fetch = """      try {
        const [kpiRes, chartRes, topRes] = await Promise.all([
          api.get(`/api/v1/dashboard?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}`),
          api.get(`/api/v1/dashboard/grafico-ventas?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}`),
          api.get(`/api/v1/dashboard/top-productos?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}`)
        ]);
        setKpis(kpiRes.data);
        setChartData(chartRes.data);
        setTopProductos(topRes.data);
        setCurrentPage(1);"""

code = code.replace(old_fetch, new_fetch)

# Sort & Render Logic
render_logic = """
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedProductos = [...topProductos].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const totalPages = Math.ceil(sortedProductos.length / 10);
  const currentProductos = sortedProductos.slice((currentPage - 1) * 10, currentPage * 10);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-20" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />;
  };
"""
code = code.replace("return (", render_logic + "\\n  return (", 1)

# Render Table
table_html = """      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" /> Estadísticas de Productos Vendidos
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Top de ventas {periodo === 'dia' ? 'de Hoy' : periodo === 'semana' ? 'de esta Semana' : periodo === 'mes' ? 'del Mes Actual' : 'de Este Año'}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50" onClick={() => handleSort('producto')}>
                  <div className="flex items-center gap-1">Producto <SortIcon field="producto" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 text-right" onClick={() => handleSort('cantidad')}>
                  <div className="flex items-center justify-end gap-1">Cantidad <SortIcon field="cantidad" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 text-right" onClick={() => handleSort('precio_promedio')}>
                  <div className="flex items-center justify-end gap-1">Valor Unitario <SortIcon field="precio_promedio" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 text-right" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end gap-1">Precio Total <SortIcon field="total" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentProductos.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No hay ventas en este período</td></tr>
              ) : (
                currentProductos.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-700">{p.producto}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{p.cantidad}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{fmt(p.precio_promedio)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{fmt(p.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, topProductos.length)} de {topProductos.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-white bg-slate-100 text-slate-600">Anterior</button>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-white bg-slate-100 text-slate-600">Siguiente</button>
            </div>
          </div>
        )}
      </div>
"""
code = code.replace("    </div>\n  );\n}", table_html + "\n    </div>\n  );\n}")

with open("src/pages/Dashboard.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched Dashboard.jsx")

