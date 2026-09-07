import re

with open('c:/factura/facturacion_api/routers/ordenes_compra.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """if recepcion.crear_cuenta_pagar and total_recibido_valor > 0:
        vencimiento = datetime.now(TIMEZONE) + timedelta(days=recepcion.dias_credito)
        cxp = CuentaPorPagar(
            empresa_id=recepcion.empresa_id,
            proveedor_id=oc.proveedor_id,
            orden_compra_id=oc_id,
            monto_original=total_recibido_valor,
            monto_pendiente=total_recibido_valor,
            fecha_vencimiento=vencimiento,
            estado="pendiente"
        )
        db.add(cxp)
        oc.proveedor.saldo_pendiente = (oc.proveedor.saldo_pendiente or 0) + total_recibido_valor"""

new_logic = """if recepcion.crear_cuenta_pagar and total_recibido_valor > 0:
        vencimiento = datetime.now(TIMEZONE) + timedelta(days=recepcion.dias_credito)
        cxp = CuentaPorPagar(
            empresa_id=recepcion.empresa_id,
            proveedor_id=oc.proveedor_id,
            orden_compra_id=oc_id,
            monto_original=total_recibido_valor,
            monto_pendiente=total_recibido_valor,
            fecha_vencimiento=vencimiento,
            estado="pendiente"
        )
        db.add(cxp)
        oc.proveedor.saldo_pendiente = (oc.proveedor.saldo_pendiente or 0) + total_recibido_valor
    elif not recepcion.crear_cuenta_pagar and total_recibido_valor > 0:
        # ES COMPRA DE CONTADO -> Descontar de la caja inmediatamente
        if recepcion.usuario_id:
            from models import SesionCaja, Caja, MovimientoCaja
            sesion = db.query(SesionCaja).join(Caja).filter(
                SesionCaja.usuario_id == recepcion.usuario_id,
                SesionCaja.estado == "abierta",
                Caja.empresa_id == recepcion.empresa_id
            ).first()
            if sesion:
                egreso = MovimientoCaja(
                    sesion_caja_id=sesion.id,
                    tipo="egreso",
                    metodo_pago="efectivo",
                    monto=total_recibido_valor,
                    concepto=f"Compra Contado OC {oc.numero}",
                    fecha=datetime.now(TIMEZONE),
                    referencia_tipo="compra_contado",
                    referencia_id=oc_id,
                    usuario_id=recepcion.usuario_id
                )
                db.add(egreso)"""

content = content.replace(old_logic, new_logic)

with open('c:/factura/facturacion_api/routers/ordenes_compra.py', 'w', encoding='utf-8') as f:
    f.write(content)
