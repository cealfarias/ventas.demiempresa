from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Factura, ItemFactura, Cliente, Bodega, Producto, CuentaPorCobrar, SesionCaja, MovimientoCaja, Caja
from routers.kardex import registrar_movimiento
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/facturas", tags=["Facturas y DTEs"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ItemFacturaCreate(BaseModel):
    producto_id: int
    cantidad: float
    precio_unitario: float  # exact value
    subtotal: int

class FacturaCreate(BaseModel):
    cliente_id: int
    bodega_salida_id: Optional[int] = None
    
    tipo_doc: str = "FACTURA" # FACTURA | CCF | EXPORTACION
    condicion_operacion: str = "CONTADO" # CONTADO | CREDITO
    metodo_pago: Optional[str] = "efectivo" # efectivo | transferencia | tarjeta
    dias_credito: int = 30 # Usado si es CREDITO
    
    fecha_emision: Optional[str] = None # YYYY-MM-DD
    entrega_domicilio: bool = False
    
    subtotal: int
    iva: int
    total: int
    
    items: List[ItemFacturaCreate]

class ItemFacturaResponse(ItemFacturaCreate):
    id: int
    producto_nombre: str
    class Config:
        from_attributes = True

class FacturaResponse(BaseModel):
    id: int
    empresa_id: str
    numero: str
    cliente_id: int
    cliente_nombre: str
    bodega_salida_id: Optional[int] = None
    tipo_doc: str
    condicion_operacion: str
    subtotal: int
    iva: int
    total: int
    estado: str
    estado_dte: str
    codigo_generacion: Optional[str] = None
    sello_recepcion: Optional[str] = None
    fecha_emision: datetime
    items: List[ItemFacturaResponse] = []

    class Config:
        from_attributes = True


# ── Helper ───────────────────────────────────────────────────────────────────

def _generar_numero_factura(db: Session, empresa_id: str, tipo_doc: str) -> str:
    anio = datetime.now().year
    count = db.query(Factura).filter(Factura.empresa_id == empresa_id, Factura.tipo_doc == tipo_doc).count()
    prefijo = "FAC" if tipo_doc == "FACTURA" else tipo_doc
    return f"{prefijo}-{anio}-{str(count + 1).zfill(5)}"


# ── Endpoints ─────────────────────────────────────────────────────────────────

from datetime import datetime, timedelta, timezone

@router.get("/", response_model=List[FacturaResponse])
def listar_facturas(
    empresa_id: str, 
    busqueda: Optional[str] = None, 
    fecha: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(Factura).filter(Factura.empresa_id == empresa_id)

    if fecha:
        try:
            dt = datetime.strptime(fecha, "%Y-%m-%d")
            inicio = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            fin = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)
        except Exception:
            pass

    if busqueda:
        term = f"%{busqueda.strip()}%"
        query = query.join(Cliente, Factura.cliente_id == Cliente.id_cliente, isouter=True).filter(
            (Factura.numero.ilike(term)) |
            (Cliente.nombre.ilike(term)) |
            (Factura.tipo_doc.ilike(term))
        )

    # Si NO hay filtro de fecha ni búsqueda, cargar únicamente las facturas de HOY por rendimiento
    if not fecha and not busqueda:
        tz_sv = timezone(timedelta(hours=-6))
        hoy_sv = datetime.now(tz_sv).replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Factura.fecha_emision >= hoy_sv)

    facturas = query.order_by(Factura.fecha_emision.desc()).limit(300).all()
    
    resultado = []
    for f in facturas:
        items = []
        for d in db.query(ItemFactura).filter(ItemFactura.factura_id == f.id).all():
            items.append(ItemFacturaResponse(
                id=d.id, producto_id=d.producto_id,
                producto_nombre=d.producto.nombre if d.producto else "",
                cantidad=d.cantidad, precio_unitario=d.precio_unitario,
                subtotal=d.subtotal
            ))
        resultado.append(FacturaResponse(
            id=f.id, empresa_id=f.empresa_id, numero=f.numero,
            cliente_id=f.cliente_id, cliente_nombre=f.cliente.nombre if f.cliente else "",
            bodega_salida_id=f.bodega_salida_id,
            tipo_doc=f.tipo_doc, condicion_operacion=f.condicion_operacion,
            subtotal=f.subtotal, iva=f.iva, total=f.total,
            estado=f.estado, estado_dte=f.estado_dte,
            codigo_generacion=f.codigo_generacion, sello_recepcion=f.sello_recepcion,
            fecha_emision=f.fecha_emision, items=items
        ))
    return resultado


@router.post("/", response_model=FacturaResponse, status_code=status.HTTP_201_CREATED)
def crear_factura(empresa_id: str, usuario_id: int, data: FacturaCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == data.cliente_id, Cliente.empresa_id == empresa_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if data.bodega_salida_id:
        bodega = db.query(Bodega).filter(Bodega.id == data.bodega_salida_id, Bodega.empresa_id == empresa_id).first()
        if not bodega:
            raise HTTPException(status_code=404, detail="Bodega no encontrada")

    numero = _generar_numero_factura(db, empresa_id, data.tipo_doc)

    # 1. Crear documento de Factura
    f = Factura(
        empresa_id=empresa_id,
        usuario_id=usuario_id,
        numero=numero,
        cliente_id=data.cliente_id,
        bodega_salida_id=data.bodega_salida_id,
        tipo_doc=data.tipo_doc,
        condicion_operacion=data.condicion_operacion,
        subtotal=data.subtotal,
        iva=data.iva,
        total=data.total
    )
    if data.fecha_emision:
        from datetime import datetime
        import pytz
        tz = pytz.timezone("America/El_Salvador")
        if "T" in data.fecha_emision:
            # Viene fecha y hora: YYYY-MM-DDTHH:MM
            # Quitar segundos si los trae
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
    
    db.add(f)
    db.flush()

    # 2. Agregar ítems y descontar de inventario si hay bodega especificada
    for item in data.items:
        db.add(ItemFactura(
            factura_id=f.id,
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario,
            subtotal=item.subtotal
        ))
        
        if data.bodega_salida_id:
            try:
                registrar_movimiento(
                    db=db,
                    empresa_id=empresa_id,
                    bodega_id=data.bodega_salida_id,
                    producto_id=item.producto_id,
                    tipo_movimiento="SALIDA_VENTA",
                    cantidad=item.cantidad,
                    costo_unitario=0, # Podríamos leer el costo promedio actual y asignarlo
                    referencia_tipo="factura",
                    referencia_id=f.id,
                    usuario_id=usuario_id,
                    notas=f"Venta con {f.tipo_doc} {f.numero}"
                )
            except Exception as e:
                # Si hay falta de stock saltará un HTTP 400 desde registrar_movimiento
                raise HTTPException(status_code=400, detail=str(e))

    # 3. Generar Cuenta por Cobrar si es al crédito
    if data.condicion_operacion == "CREDITO":
        limite = cliente.limite_credito or 0
        if limite <= 0:
            raise HTTPException(
                status_code=400, 
                detail=f"El cliente '{cliente.nombre}' no tiene línea de crédito autorizada (Límite: $0.00). Por favor seleccione venta al Contado o asigne un límite de crédito al cliente."
            )
        nuevo_saldo = (cliente.saldo_pendiente or 0) + data.total
        if nuevo_saldo > limite:
            raise HTTPException(
                status_code=400, 
                detail=f"Límite de crédito excedido para el cliente '{cliente.nombre}'. Límite autorizado: ${limite/100:.2f}, Saldo resultante con esta venta: ${nuevo_saldo/100:.2f}"
            )
        cxc = CuentaPorCobrar(
            empresa_id=empresa_id,
            cliente_id=data.cliente_id,
            factura_id=f.id,
            fecha_vencimiento=datetime.now(TIMEZONE) + timedelta(days=data.dias_credito),
            monto_original=data.total,
            monto_pendiente=data.total,
            estado="pendiente"
        )
        db.add(cxc)
        db.flush()
        cliente.saldo_pendiente = (cliente.saldo_pendiente or 0) + data.total

    if data.entrega_domicilio:
        from models import Despacho, DetalleDespacho
        # Buscar o generar numero de despacho
        ultimo_despacho = db.query(Despacho).filter(Despacho.empresa_id == empresa_id).order_by(Despacho.id.desc()).first()
        if ultimo_despacho and ultimo_despacho.numero.startswith("DESP-2026-"):
            num = int(ultimo_despacho.numero.split("-")[-1]) + 1
            num_despacho = f"DESP-2026-{num:04d}"
        else:
            num_despacho = "DESP-2026-0001"
            
        desp = Despacho(
            empresa_id=empresa_id,
            numero=num_despacho,
            usuario_id=usuario_id,
            estado="programado"
        )
        db.add(desp)
        db.flush()
        
        det_desp = DetalleDespacho(
            despacho_id=desp.id,
            factura_id=f.id,
            direccion_entrega=cliente.direccion or "",
            estado="pendiente"
        )
        db.add(det_desp)
        db.flush()
        
    if data.condicion_operacion == "CONTADO":
        sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
        if sesion:
            db.add(MovimientoCaja(sesion_caja_id=sesion.id, tipo="ingreso", metodo_pago=data.metodo_pago or "efectivo", monto=data.total, concepto=f"Venta Contado: {f.tipo_doc} {f.numero}", fecha=datetime.now(TIMEZONE), referencia_tipo="factura", referencia_id=f.id, usuario_id=usuario_id))

    db.commit()
    db.refresh(f)
    return listar_facturas(empresa_id, db)[0]


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
                producto_id=item.producto_id, tipo_movimiento='AJUSTE_POSITIVO',
                cantidad=item.cantidad, costo_unitario=item.precio_unitario, # costo aproximado para reversion
                notas=f"Reversion por edicion Fac. {f.id}", usuario_id=usuario_id
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
    db.query(ItemFactura).filter(ItemFactura.factura_id == f.id).delete()
    
    # Insertar items nuevos y descontar inventario
    for i_data in data.items:
        prod = db.query(Producto).filter(Producto.id_producto == i_data.producto_id, Producto.empresa_id == empresa_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Producto {i_data.producto_id} no encontrado")
            
        detalle = ItemFactura(
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
                    notas=f"Venta editada Fac. {f.id}", usuario_id=usuario_id
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
                
    db.commit()
    db.refresh(f)
    
    # Return same format as listar_facturas
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
        id=f.id,
        empresa_id=f.empresa_id,
        numero=f.numero,
        cliente_id=f.cliente_id,
        cliente_nombre=cliente.nombre_comercial or cliente.nombre,
        bodega_salida_id=f.bodega_salida_id,
        tipo_doc=f.tipo_doc,
        condicion_operacion=f.condicion_operacion,
        subtotal=f.subtotal,
        iva=f.iva,
        total=f.total,
        estado=f.estado,
        estado_dte=f.estado_dte,
        codigo_generacion=f.codigo_generacion,
        sello_recepcion=f.sello_recepcion,
        fecha_emision=f.fecha_emision,
        items=items_resp
    )



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
            cxc.monto_pendiente = 0
    
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

@router.get("/{factura_id}/imprimir")
def imprimir_factura(factura_id: int, empresa_id: str, db: Session = Depends(get_db)):
    factura = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    from fastapi.responses import HTMLResponse
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Factura {factura.numero}</title>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; }}
            .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }}
            .title {{ font-size: 24px; font-weight: bold; margin-bottom: 5px; }}
            .info-grid {{ display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }}
            .table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
            .table th, .table td {{ border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }}
            .table th {{ background-color: #f9f9f9; }}
            .text-right {{ text-align: right !important; }}
            .totals {{ width: 300px; float: right; }}
            .footer {{ clear: both; margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }}
            .dte-box {{ border: 1px solid #333; padding: 10px; margin-top: 20px; text-align: center; font-size: 12px; background: #fafafa; }}
            @media print {{
                body {{ padding: 0; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">COMPROBANTE DE VENTA</div>
            <div>Documento Tributario Electrónico (DTE)</div>
        </div>
        
        <div class="info-grid">
            <div>
                <strong>Cliente:</strong> {factura.cliente.nombre if factura.cliente else "Consumidor Final"}<br>
                <strong>NIT/DUI:</strong> {factura.cliente.nit or factura.cliente.dui if factura.cliente else "N/A"}<br>
                <strong>Dirección:</strong> {factura.cliente.direccion if factura.cliente else "N/A"}
            </div>
            <div class="text-right">
                <strong>Número:</strong> {factura.numero}<br>
                <strong>Fecha:</strong> {factura.fecha_emision.strftime('%d/%m/%Y %H:%M')}<br>
                <strong>Tipo Doc:</strong> {factura.tipo_doc}<br>
                <strong>Condición:</strong> {factura.condicion_operacion}
            </div>
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Cant</th>
                    <th>Descripción</th>
                    <th class="text-right">Precio Unit.</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
    """
    
    for item in factura.items:
        html_content += f"""
                <tr>
                    <td>{item.cantidad}</td>
                    <td>{item.producto.nombre if item.producto else 'N/A'}</td>
                    <td class="text-right">${item.precio_unitario:.4f}</td>
                    <td class="text-right">${item.subtotal / 100:.2f}</td>
                </tr>
        """
        
    html_content += f"""
            </tbody>
        </table>
        
        <table class="table totals">
            <tr><td><strong>Subtotal:</strong></td><td class="text-right">${factura.subtotal / 100:.2f}</td></tr>
            <tr><td><strong>IVA (13%):</strong></td><td class="text-right">${factura.iva / 100:.2f}</td></tr>
            <tr><td><strong>TOTAL:</strong></td><td class="text-right"><strong>${factura.total / 100:.2f}</strong></td></tr>
        </table>
    """
    
    if factura.estado_dte == 'procesado':
        html_content += f"""
        <div class="footer">
            <div class="dte-box">
                <strong>Sello de Recepción MH:</strong> {factura.sello_recepcion}<br>
                <strong>Código de Generación UUID:</strong> {factura.codigo_generacion}<br>
                <em>Este documento es una representación impresa de un DTE.</em>
            </div>
        </div>
        """
    else:
        html_content += """
        <div class="footer">
            <p><em>Documento interno. No válido como factura fiscal (DTE Pendiente).</em></p>
        </div>
        """
        
    html_content += """
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)
