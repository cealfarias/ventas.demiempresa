import sys

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''                    <td className="px-5 py-4 flex gap-2 justify-end">
                      <button onClick={() => abrirDetalle(oc)}'''

new_str = '''                    <td className="px-5 py-4 flex gap-2 justify-end">
                      {['borrador', 'enviada'].includes(oc.estado) && (
                        <button onClick={() => iniciarEdicion(oc)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center gap-1">
                          Editar
                        </button>
                      )}
                      <button onClick={() => abrirDetalle(oc)}'''

content = content.replace(old_str, new_str)

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
