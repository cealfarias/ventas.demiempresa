import re
with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_end = '''          </table>
        </div>
      )}
    </div>
  );
}'''
new_end = '''          </table>
        </div>
        {facturas.length > itemsPorPagina && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
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
      )}
    </div>
  );
}'''

content = content.replace(old_end, new_end)

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
