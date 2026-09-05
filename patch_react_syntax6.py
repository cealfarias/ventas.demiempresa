import re

with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_start = '''      ) : facturas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay facturas emitidas</p>
        </div>
      ) : (
        <div id="table-facturas" className="bg-white border rounded-2xl overflow-hidden shadow-sm relative z-0">'''

new_start = '''      ) : facturas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay facturas emitidas</p>
        </div>
      ) : (
        <>
        <div id="table-facturas" className="bg-white border rounded-2xl overflow-hidden shadow-sm relative z-0">'''

content = content.replace(old_start, new_start)

old_end = '''            </div>
          </div>
        )}
      )}
    </div>
  );
}'''

new_end = '''            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}'''

content = content.replace(old_end, new_end)

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
