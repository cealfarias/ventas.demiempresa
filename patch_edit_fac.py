import re

with open('facturacion_api/routers/facturas.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
@router.put("/{factura_id}", response_model=FacturaResponse)
def actualizar_factura(factura_id: int, empresa_id: str, usuario_id: int, data: FacturaCreate, db: Session = Depends(get_db)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if f.estado_dte == "procesado":
        raise HTTPException(status_code=400, detail="No se puede editar una factura ya transmitida a Hacienda")

    cliente = db.query(Cliente).filter(Cliente.id_cliente == data.cliente_id, Cliente.empresa_id == empresa_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Revertir inventario de la factura anterior
    if f.bodega_salida_id:
        from routers.kardex import registrar_movimiento
        for item in f.items:
            registrar_movimiento(
                db=db, empresa_id=empresa_id, bodega_id=f.bodega_salida_id,
                producto_id=item.producto_id, tipo_movimiento='ENTRADA_AJUSTE',
                cantidad=item.cantidad, costo_unitario=item.precio_unitario, # costo aproximado para reversion
                referencia=f"Reversion por edicion Fac. {f.id}", usuario_id=usuario_id
            )

    # Actualizar datos de factura
    f.cliente_id = data.cliente_id
    f.bodega_salida_id = data.bodega_salida_id
    f.tipo_doc = data.tipo_doc
    f.condicion_operacion = data.condicion_operacion
    f.dias_credito = data.dias_credito
    f.entrega_domicilio = data.entrega_domicilio
    f.subtotal = data.subtotal
    f.iva = data.iva
    f.total = data.total

    if data.fecha_emision:
        from datetime import datetime
        import pytz
        tz = pytz.timezone("America/El_Salvador")
        if "T" in data.fecha_emision:
            fecha_str = data.fecha_emision[:16]
            fecha_req = datetime.strptime(fecha_str, "%Y-%m-%dT%H:%M")
            f.fecha_emision = tz.localize(fecha_req)
        else:
            fecha_req = datetime.strptime(data.fecha_emision, "%Y-%m-%d").date()
            ahora = datetime.now(tz)
            if fecha_req == ahora.date():
                f.fecha_emision = ahora
            else:
                f.fecha_emision = tz.localize(datetime.combine(fecha_req, datetime.min.time()))

    # Borrar items anteriores
    db.query(DetalleFactura).filter(DetalleFactura.factura_id == f.id).delete()
    
    # Insertar items nuevos y descontar inventario
    for i_data in data.items:
        prod = db.query(Producto).filter(Producto.id_producto == i_data.producto_id, Producto.empresa_id == empresa_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Producto {i_data.producto_id} no encontrado")
            
        detalle = DetalleFactura(
            factura_id=f.id,
            producto_id=i_data.producto_id,
            cantidad=i_data.cantidad,
            precio_unitario=i_data.precio_unitario,
            subtotal=i_data.subtotal
        )
        db.add(detalle)
        
        if f.bodega_salida_id:
            from routers.kardex import registrar_movimiento
            try:
                registrar_movimiento(
                    db=db, empresa_id=empresa_id, bodega_id=f.bodega_salida_id,
                    producto_id=i_data.producto_id, tipo_movimiento='SALIDA_VENTA',
                    cantidad=i_data.cantidad, costo_unitario=prod.costo_promedio or 0,
                    referencia=f"Venta editada Fac. {f.id}", usuario_id=usuario_id
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
                
    db.commit()
    
    # Return same format as listar_facturas
    items_resp = []
    for d in f.items:
        items_resp.append({
            "producto_id": d.producto_id,
            "producto_nombre": d.producto.nombre,
            "cantidad": d.cantidad,
            "precio_unitario": d.precio_unitario,
            "subtotal": d.subtotal
        })
    return {
        "id": f.id,
        "empresa_id": f.empresa_id,
        "numero": f.numero,
        "cliente_id": f.cliente_id,
        "cliente_nombre": cliente.nombre_comercial or cliente.nombre,
        "tipo_doc": f.tipo_doc,
        "condicion_operacion": f.condicion_operacion,
        "subtotal": f.subtotal,
        "iva": f.iva,
        "total": f.total,
        "estado": f.estado,
        "estado_dte": f.estado_dte,
        "codigo_generacion": f.codigo_generacion,
        "sello_recepcion": f.sello_recepcion,
        "fecha_emision": f.fecha_emision,
        "items": items_resp
    }

'''

content = content.replace('@router.get("/{factura_id}/imprimir", response_class=HTMLResponse)', new_endpoint + '@router.get("/{factura_id}/imprimir", response_class=HTMLResponse)')

with open('facturacion_api/routers/facturas.py', 'w', encoding='utf-8') as f:
    f.write(content)

