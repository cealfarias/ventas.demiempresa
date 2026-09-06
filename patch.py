
import sys

# 1. Patch facturas.py
with open("facturacion_api/routers/facturas.py", "r", encoding="utf-8") as f:
    code = f.read()
new_endpoint = """
@router.put("/{factura_id}/anular", response_model=FacturaResponse)
def anular_factura(factura_id: int, empresa_id: str, usuario_id: int, db: Session = Depends(get_db)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if f.estado == "anulada":
        raise HTTPException(status_code=400, detail="La factura ya se encuentra anulada")
    if f.estado_dte == "procesado":
        raise HTTPException(status_code=400, detail="No se puede anular una factura ya transmitida a Hacienda")

    if f.bodega_salida_id:
        from routers.kardex import registrar_movimiento
        for item in f.items:
            try:
                registrar_movimiento(
                    db=db, empresa_id=empresa_id, bodega_id=f.bodega_salida_id,
                    producto_id=item.producto_id, tipo_movimiento="AJUSTE_POSITIVO",
                    cantidad=item.cantidad, costo_unitario=item.precio_unitario,
                    notas=f"Reversion por anulacion Fac. {f.id}", usuario_id=usuario_id
                )
            except Exception as e:
                pass

    if f.condicion_operacion == "CREDITO":
        cxc = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.factura_id == f.id).first()
        if cxc and cxc.estado != "anulada":
            cxc.estado = "anulada"
            if f.cliente:
                f.cliente.saldo_pendiente = max(0, (f.cliente.saldo_pendiente or 0) - cxc.monto_pendiente)
    
    f.estado = "anulada"
    db.commit()
    db.refresh(f)
    
    items_resp = []
    for d in db.query(ItemFactura).filter(ItemFactura.factura_id == f.id).all():
        items_resp.append(ItemFacturaResponse(
            id=d.id, producto_id=d.producto_id,
            producto_nombre=d.producto.nombre,
            cantidad=d.cantidad,
            precio_unitario=d.precio_unitario,
            subtotal=d.subtotal
        ))
    return FacturaResponse(
        id=f.id, empresa_id=f.empresa_id, numero=f.numero,
        cliente_id=f.cliente_id, cliente_nombre=f.cliente.nombre_comercial or f.cliente.nombre,
        bodega_salida_id=f.bodega_salida_id, tipo_doc=f.tipo_doc,
        condicion_operacion=f.condicion_operacion, subtotal=f.subtotal,
        iva=f.iva, total=f.total, estado=f.estado, estado_dte=f.estado_dte,
        codigo_generacion=f.codigo_generacion, sello_recepcion=f.sello_recepcion,
        fecha_emision=f.fecha_emision, items=items_resp
    )
"""
if "def anular_factura" not in code:
    code = code.replace("@router.get(\"/{factura_id}/imprimir\")", new_endpoint + "\n@router.get(\"/{factura_id}/imprimir\")")
    with open("facturacion_api/routers/facturas.py", "w", encoding="utf-8") as f:
        f.write(code)

# 2. Patch Facturas.jsx
with open("facturacion_web/src/pages/Facturas.jsx", "r", encoding="utf-8") as f:
    jsx = f.read()

# Replace url
jsx = jsx.replace("http://localhost:8001", "${import.meta.env.VITE_API_URL || 'https://ventas-demiempresa.onrender.com'}")

# Add Anular logic
anular_code = """  const transmitirMH = async (id) => {"""
new_anular = """  const anularFactura = async (id) => {
    if (!window.confirm("¿Está seguro de anular esta factura? Esta acción revertirá los saldos y el inventario, y no se puede deshacer.")) return;
    try {
      await api.put(`/api/v1/facturacion/facturas/${id}/anular?empresa_id=${empresaId()}&usuario_id=1`);
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Factura anulada exitosamente.", options: [{label:"Aceptar", action:null}] }}));
      cargar();
    } catch (e) {
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: e.response?.data?.detail || "Error al anular la factura", options: [{label:"Aceptar", action:null}] }}));
    }
  };

  const transmitirMH = async (id) => {"""
if "const anularFactura" not in jsx:
    jsx = jsx.replace(anular_code, new_anular)

# Replace row TR
jsx = jsx.replace("<tr key={f.id} className=\"hover:bg-slate-50\">", "<tr key={f.id} className={`hover:bg-slate-50 ${f.estado === \"anulada\" ? \"bg-red-50/75\" : \"\"}`}>")

# Add Anular button
btn_old = "<a href={`${import.meta.env.VITE_API_URL"
btn_new = """
                    {f.estado !== "anulada" && (
                      <button onClick={() => anularFactura(f.id)} className="text-slate-400 hover:text-red-600 inline-flex items-center p-1 mr-1" title="Anular Factura">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <a href={`${import.meta.env.VITE_API_URL"""
if "anularFactura(f.id)" not in jsx:
    jsx = jsx.replace(btn_old, btn_new.strip())

# Replace Status
old_status = """                    <td className="px-5 py-4 text-center">
                    {f.estado_dte === 'procesado' ? ("""
new_status = """                    <td className="px-5 py-4 text-center">
                    {f.estado === "anulada" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Anulada</span>
                    ) : f.estado_dte === "procesado" ? ("""
if "f.estado === \"anulada\"" not in jsx:
    jsx = jsx.replace(old_status, new_status)

with open("facturacion_web/src/pages/Facturas.jsx", "w", encoding="utf-8") as f:
    f.write(jsx)
print("Done")

