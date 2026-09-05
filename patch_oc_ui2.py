lines = open('facturacion_web/src/pages/OrdenesCompra.jsx', 'r', encoding='utf-8').read().splitlines()
out = []
for line in lines:
    out.append(line)
    if line.strip() == '<td className="px-5 py-4 flex gap-2 justify-end">':
        out.append("                      {['borrador', 'enviada'].includes(oc.estado) && (")
        out.append('                        <button onClick={() => iniciarEdicion(oc)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center gap-1">')
        out.append("                          Editar")
        out.append("                        </button>")
        out.append("                      )}")

open('facturacion_web/src/pages/OrdenesCompra.jsx', 'w', encoding='utf-8').write('\n'.join(out))
