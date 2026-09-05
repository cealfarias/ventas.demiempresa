import re

with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add pagination state
content = content.replace("const [facturas, setFacturas] = useState([]);", "const [facturas, setFacturas] = useState([]);\n  const [paginaActual, setPaginaActual] = useState(1);\n  const [itemsPorPagina] = useState(15);")

# Update pagination logic
map_logic = '''              <tbody className="divide-y divide-slate-100">
                {[...facturas]
                  .sort((a, b) => b.id - a.id)
                  .slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina)
                  .map(f => (
                  <tr key={f.id} className="hover:bg-slate-50">'''

content = content.replace('''              <tbody className="divide-y divide-slate-100">\n                {facturas.map(f => (\n                  <tr key={f.id} className="hover:bg-slate-50">''', map_logic)

# Add pagination UI
pagination_ui = '''          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
'''
# We need to append the pagination controls after the table.
old_table_end = '''              </tbody>
            </table>
          </div>
        </div>
      );
    }'''

new_table_end = '''              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {facturas.length > itemsPorPagina && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
              <span className="text-sm text-slate-500">
                Mostrando {Math.min((paginaActual - 1) * itemsPorPagina + 1, facturas.length)} a {Math.min(paginaActual * itemsPorPagina, facturas.length)} de {facturas.length}
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setPaginaActual(Math.min(Math.ceil(facturas.length / itemsPorPagina), paginaActual + 1))}
                  disabled={paginaActual >= Math.ceil(facturas.length / itemsPorPagina)}
                  className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }'''

content = content.replace(old_table_end, new_table_end)

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
