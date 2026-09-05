import re

with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add edit state variable
content = content.replace("const [vista, setVista] = useState('lista'); // lista | nueva", "const [vista, setVista] = useState('lista'); // lista | nueva\n  const [editandoId, setEditandoId] = useState(null);")

# Add iniciarEdicion function
iniciar_edicion_func = '''
  const iniciarEdicion = (fac) => {
    // Populate form with existing data
    setForm({
      cliente_id: fac.cliente_id || '',
      bodega_salida_id: '', // Not strictly tracked in list view, user must reselect if they want to deduct
      tipo_doc: fac.tipo_doc || 'FACTURA',
      condicion_operacion: fac.condicion_operacion || 'CONTADO',
      dias_credito: 30,
      entrega_domicilio: false,
      incluye_iva: false,
      fecha_emision: fac.fecha_emision ? fac.fecha_emision.slice(0, 16) : (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
      items: fac.items ? fac.items.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: (i.precio_unitario / 100).toFixed(2),
        subtotal: i.subtotal
      })) : []
    });
    setEditandoId(fac.id);
    setVista('nueva');
  };
'''

content = content.replace("const guardar = async () => {", iniciar_edicion_func + "\n  const guardar = async () => {")

# Update guardar function to handle PUT
old_guardar_req = "await api.post(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload);"
new_guardar_req = '''if (editandoId) {
        await api.put(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload);
      } else {
        await api.post(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload);
      }'''
content = content.replace(old_guardar_req, new_guardar_req)

# Reset editandoId when going back to list
content = content.replace("setVista('lista');", "setVista('lista'); setEditandoId(null);")

# Add UI Edit button
old_buttons = '''                  <td className="px-5 py-4 flex justify-end gap-2">
                    {f.estado_dte !== 'procesado' && (
                      <button onClick={() => transmitirMH(f.id)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium">Transmitir MH</button>
                    )}'''
new_buttons = '''                  <td className="px-5 py-4 flex justify-end gap-2">
                    {f.estado_dte !== 'procesado' && (
                      <>
                        <button onClick={() => iniciarEdicion(f)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-medium">Editar</button>
                        <button onClick={() => transmitirMH(f.id)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium">Transmitir MH</button>
                      </>
                    )}'''
content = content.replace(old_buttons, new_buttons)

# Update title
content = content.replace('Factura"}', 'Factura"}</button>\n          <h1 className="text-2xl font-bold text-slate-800">{editandoId ? "Editar Factura" : "Nueva Factura"}</h1>')
content = content.replace('<h1 className="text-2xl font-bold text-slate-800">Nueva Factura</h1>', '')

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
