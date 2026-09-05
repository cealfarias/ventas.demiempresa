import re

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_buttons = '''                    <td className="px-5 py-4 flex gap-2 justify-end">
                      <button onClick={() => abrirDetalle(oc)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Detalle
                      </button>
                      <button onClick={() => eliminarOrden(oc)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>'''

new_buttons = '''                    <td className="px-5 py-4 flex gap-2 justify-end">
                      {['borrador', 'enviada'].includes(oc.estado) && !oc.es_dte_importado && (
                        <button onClick={() => iniciarEdicion(oc)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center gap-1">
                          Editar
                        </button>
                      )}
                      <button onClick={() => abrirDetalle(oc)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Detalle
                      </button>
                      <button onClick={() => eliminarOrden(oc)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>'''

content = content.replace(old_buttons, new_buttons)

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
