import re

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add editandoId
content = content.replace("const [guardando, setGuardando] = useState(false);", "const [guardando, setGuardando] = useState(false);\n  const [editandoId, setEditandoId] = useState(null);")

# Update Nueva Orden button to reset editandoId
content = content.replace("setVista('nueva'); }}", "setEditandoId(null); setVista('nueva'); }}")

# Add iniciarEdicion
iniciar_edicion_code = '''
  const iniciarEdicion = (oc) => {
    setEditandoId(oc.id);
    setFormOC({
        proveedor_id: oc.proveedor_id || '',
        tipo_doc: oc.tipo_doc || 'CCF',
        bodega_destino_id: oc.bodega_destino_id || '',
        fecha_esperada_entrega: oc.fecha_esperada_entrega ? oc.fecha_esperada_entrega.split('T')[0] : '',
        notas: oc.notas || '',
        calcular_iva: oc.iva > 0,
        detalles: oc.detalles.map(d => ({
            producto_id: d.producto_id || '',
            cantidad_pedida: d.cantidad_pedida,
            precio_unitario: (d.precio_unitario / 100).toFixed(2)
        }))
    });
    setVista('nueva');
  };

  const guardarOC = async () => {
'''
content = content.replace("const guardarOC = async () => {", iniciar_edicion_code)

# Update guardarOC to use PUT
old_guardar = '''        const res = await api.post(/api/v1/compras/ordenes-compra/?empresa_id=&usuario_id=1, payload);
        
        if (mostrarDte && dteJson) {
          await api.post(/api/v1/compras/ordenes-compra//importar-dte?empresa_id=, { json_dte: dteJson });
        }'''
new_guardar = '''        if (editandoId) {
          await api.put(/api/v1/compras/ordenes-compra/?empresa_id=&usuario_id=1, payload);
        } else {
          const res = await api.post(/api/v1/compras/ordenes-compra/?empresa_id=&usuario_id=1, payload);
          if (mostrarDte && dteJson) {
            await api.post(/api/v1/compras/ordenes-compra//importar-dte?empresa_id=, { json_dte: dteJson });
          }
        }'''
content = content.replace(old_guardar, new_guardar)

# Add Edit button in the UI next to View and Receive
content = content.replace("Eye, Trash2", "Eye, Trash2, Edit")

edit_btn = '''{oc.estado === 'BORRADOR' && (
                          <button onClick={() => iniciarEdicion(oc)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </button>
                        )}'''
content = content.replace("{oc.estado === 'BORRADOR' && (", edit_btn + "\n                        {oc.estado === 'BORRADOR' && (")

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
