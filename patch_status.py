
with open("facturacion_web/src/pages/Facturas.jsx", "r", encoding="utf-8") as f:
    code = f.read()
code = code.replace(
    "<td className=\"px-5 py-4 text-center\">\n                    {f.estado_dte === 'procesado' ? (",
    "<td className=\"px-5 py-4 text-center\">\n                    {f.estado === \"anulada\" ? (\n                      <span className=\"px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700\">Anulada</span>\n                    ) : f.estado_dte === 'procesado' ? ("
)
with open("facturacion_web/src/pages/Facturas.jsx", "w", encoding="utf-8") as f:
    f.write(code)

