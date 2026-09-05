import re

with open('facturacion_api/routers/ordenes_compra.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
@router.put("/{oc_id}", response_model=OrdenCompraResponse)
def actualizar_orden(oc_id: int, empresa_id: str, data: OrdenCompraCreate, db: Session = Depends(get_db)):
    oc = db.query(OrdenCompra).filter(OrdenCompra.id == oc_id, OrdenCompra.empresa_id == empresa_id).first()
    if not oc:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    if oc.estado != "BORRADOR" and oc.estado != "EMITIDA":
        raise HTTPException(status_code=400, detail="Solo se pueden editar ordenes en estado BORRADOR o EMITIDA")

    oc.proveedor_id = data.proveedor_id
    oc.tipo_doc = data.tipo_doc
    oc.bodega_destino_id = data.bodega_destino_id
    oc.fecha_esperada_entrega = data.fecha_esperada_entrega
    oc.notas = data.notas

    # Borrar detalles viejos
    db.query(DetalleOrdenCompra).filter(DetalleOrdenCompra.orden_compra_id == oc.id).delete()
    
    subtotal = 0
    for item in data.detalles:
        if item.producto_id:
            prod = db.query(Producto).filter(Producto.id_producto == item.producto_id, Producto.empresa_id == empresa_id).first()
            if not prod:
                raise HTTPException(status_code=400, detail=f"Producto {item.producto_id} no encontrado")
        
        item_subtotal = int(item.cantidad_pedida * item.precio_unitario)
        detalle = DetalleOrdenCompra(
            orden_compra_id=oc.id,
            producto_id=item.producto_id,
            cantidad_pedida=item.cantidad_pedida,
            precio_unitario=item.precio_unitario,
            subtotal=item_subtotal
        )
        db.add(detalle)
        subtotal += item_subtotal

    iva = int(subtotal * 0.13) if data.calcular_iva else 0
    oc.subtotal = subtotal
    oc.iva = iva
    oc.total = subtotal + iva

    db.commit()
    db.refresh(oc)
    return _build_response(oc)

'''

content = content.replace('@router.post("/{oc_id}/recibir"', new_endpoint + '@router.post("/{oc_id}/recibir"')

with open('facturacion_api/routers/ordenes_compra.py', 'w', encoding='utf-8') as f:
    f.write(content)

