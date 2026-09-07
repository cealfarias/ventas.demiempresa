import sys
with open('src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

func_new = '''
  const iniciarNuevaFactura = () => {
    const clienteDefault = clientes.find(c => c.es_predeterminado);
    setForm({
      cliente_id: clienteDefault ? clienteDefault.id_cliente : "",
      bodega_salida_id: "",
      tipo_doc: "FACTURA",
      condicion_operacion: "CONTADO",
      metodo_pago: "efectivo",
      dias_credito: 30,
      items: [{ producto_id: "", cantidad: 1, precio_unitario: 0 }],
      fecha_emision: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
      entrega_domicilio: false,
      incluye_iva: false
    });
    setVista("nueva");
  };
'''

code = code.replace('const anularFactura = async (id) => {', func_new + '\n  const anularFactura = async (id) => {')

btn_old = '''onClick={() => { setForm({ cliente_id: '', bodega_salida_id: '', tipo_doc: 'FACTURA', condicion_operacion: 'CONTADO', metodo_pago: 'efectivo', dias_credito: 30, items: [], fecha_emision: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, 16), entrega_domicilio: false, incluye_iva: false }); setVista('nueva'); }}'''
btn_new = 'onClick={iniciarNuevaFactura}'
code = code.replace(btn_old, btn_new)

select_old = '<Select'
select_new = '<Select autoFocus={i === form.items.length - 1}'
code = code.replace(select_old, select_new)

with open('src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched Facturas.jsx successfully')