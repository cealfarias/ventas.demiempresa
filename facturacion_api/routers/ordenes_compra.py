from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import OrdenCompra, DetalleOrdenCompra, Proveedor, Producto, CuentaPorPagar, Bodega
from routers.kardex import registrar_movimiento
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/ordenes-compra", tags=["Órdenes de Compra"])


class DetalleOCBase(BaseModel):
    producto_id: int
    cantidad_pedida: float
    precio_unitario: int   # centavos

class OrdenCompraCreate(BaseModel):
    proveedor_id: int
    tipo_doc: str = "CCF"
    bodega_destino_id: Optional[int] = None
    fecha_esperada_entrega: Optional[datetime] = None
    notas: Optional[str] = None
    calcular_iva: bool = True
    detalles: List[DetalleOCBase]

class RecepcionDetalleRequest(BaseModel):
    detalle_id: int
    cantidad_recibida: float

class RecepcionRequest(BaseModel):
    empresa_id: str
    bodega_destino_id: int
    usuario_id: Optional[int] = None
    detalles: List[RecepcionDetalleRequest]
    crear_cuenta_pagar: bool = False
    dias_credito: int = 30

class ImportarDTERequest(BaseModel):
    json_dte: str

class DetalleOCResponse(BaseModel):
    id: int
    producto_id: int
    producto_codigo: str
    producto_nombre: str
    cantidad_pedida: float
    cantidad_recibida: float
    precio_unitario: int
    subtotal: int
    pendiente: float

    class Config:
        from_attributes = True

class OrdenCompraResponse(BaseModel):
    id: int
    empresa_id: str
    numero: str
    proveedor_id: int
    proveedor_nombre: str
    tipo_doc: str
    subtotal: int
    iva: int
    total: int
    estado: str
    fecha_emision: datetime
    fecha_esperada_entrega: Optional[datetime]
    notas: Optional[str]
    detalles: List[DetalleOCResponse] = []

    class Config:
        from_attributes = True


def _generar_numero_oc(db: Session, empresa_id: str) -> str:
    anio = datetime.now().year
    count = db.query(OrdenCompra).filter(OrdenCompra.empresa_id == empresa_id).count()
    return f"OC-{anio}-{str(count + 1).zfill(5)}"

def _build_response(oc: OrdenCompra) -> OrdenCompraResponse:
    detalles = []
    for d in oc.detalles:
        detalles.append(DetalleOCResponse(
            id=d.id,
            producto_id=d.producto_id,
            producto_codigo=d.producto.codigo if d.producto else "",
            producto_nombre=d.producto.nombre if d.producto else "",
            cantidad_pedida=d.cantidad_pedida,
            cantidad_recibida=d.cantidad_recibida,
            precio_unitario=d.precio_unitario,
            subtotal=d.subtotal,
            pendiente=max(0, d.cantidad_pedida - d.cantidad_recibida)
        ))
    return OrdenCompraResponse(
        id=oc.id,
        empresa_id=oc.empresa_id,
        numero=oc.numero,
        proveedor_id=oc.proveedor_id,
        proveedor_nombre=oc.proveedor.nombre if oc.proveedor else "",
        tipo_doc=oc.tipo_doc,
        subtotal=oc.subtotal,
        iva=oc.iva,
        total=oc.total,
        estado=oc.estado,
        fecha_emision=oc.fecha_emision,
        fecha_esperada_entrega=oc.fecha_esperada_entrega,
        notas=oc.notas,
        detalles=detalles
    )


@router.get("/", response_model=List[OrdenCompraResponse])
def listar_ordenes(empresa_id: str, estado: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(OrdenCompra).filter(OrdenCompra.empresa_id == empresa_id)
    if estado:
        query = query.filter(OrdenCompra.estado == estado)
    ordenes = query.order_by(OrdenCompra.fecha_creacion.desc()).all()
    return [_build_response(o) for o in ordenes]


@router.get("/{oc_id}", response_model=OrdenCompraResponse)
def obtener_orden(oc_id: int, empresa_id: str, db: Session = Depends(get_db)):
    oc = db.query(OrdenCompra).filter(OrdenCompra.id == oc_id, OrdenCompra.empresa_id == empresa_id).first()
    if not oc:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    return _build_response(oc)


@router.post("/", response_model=OrdenCompraResponse, status_code=status.HTTP_201_CREATED)
def crear_orden(empresa_id: str, usuario_id: int, data: OrdenCompraCreate, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == data.proveedor_id,
        Proveedor.empresa_id == empresa_id
    ).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    numero = _generar_numero_oc(db, empresa_id)

    oc = OrdenCompra(
        empresa_id=empresa_id,
        numero=numero,
        proveedor_id=data.proveedor_id,
        tipo_doc=data.tipo_doc,
        bodega_destino_id=data.bodega_destino_id,
        fecha_esperada_entrega=data.fecha_esperada_entrega,
        notas=data.notas,
        estado="borrador",
        usuario_id=usuario_id
    )
    db.add(oc)
    db.flush()

    subtotal = 0
    for item in data.detalles:
        producto = db.query(Producto).filter(Producto.id_producto == item.producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")
        
        item_subtotal = int(item.cantidad_pedida * item.precio_unitario)
        detalle = DetalleOrdenCompra(
            orden_compra_id=oc.id,
            producto_id=item.producto_id,
            cantidad_pedida=item.cantidad_pedida,
            cantidad_recibida=0.0,
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

@router.post("/{oc_id}/recibir", response_model=OrdenCompraResponse)
def recibir_mercancia(oc_id: int, recepcion: RecepcionRequest, db: Session = Depends(get_db)):
    oc = db.query(OrdenCompra).filter(
        OrdenCompra.id == oc_id,
        OrdenCompra.empresa_id == recepcion.empresa_id
    ).first()
    
    if not oc:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    if oc.estado in ("recibida", "anulada"):
        raise HTTPException(status_code=400, detail=f"La OC está en estado '{oc.estado}' y no puede recibirse")

    bodega = db.query(Bodega).filter(
        Bodega.id == recepcion.bodega_destino_id,
        Bodega.empresa_id == recepcion.empresa_id,
        Bodega.activa == True
    ).first()
    
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega de destino no encontrada o inactiva")

    total_recibido_valor = 0

    for item_recepcion in recepcion.detalles:
        detalle = db.query(DetalleOrdenCompra).filter(
            DetalleOrdenCompra.id == item_recepcion.detalle_id,
            DetalleOrdenCompra.orden_compra_id == oc_id
        ).first()
        if not detalle:
            continue

        cantidad_a_recibir = item_recepcion.cantidad_recibida
        if cantidad_a_recibir <= 0:
            continue

        disponible = detalle.cantidad_pedida - detalle.cantidad_recibida
        if cantidad_a_recibir > disponible:
            raise HTTPException(
                status_code=400,
                detail=f"Producto {detalle.producto_id}: cantidad a recibir ({cantidad_a_recibir}) supera lo pendiente ({disponible})"
            )

        registrar_movimiento(
            db=db,
            empresa_id=recepcion.empresa_id,
            bodega_id=recepcion.bodega_destino_id,
            producto_id=detalle.producto_id,
            tipo_movimiento="ENTRADA_COMPRA",
            cantidad=cantidad_a_recibir,
            costo_unitario=detalle.precio_unitario,
            referencia_tipo="orden_compra",
            referencia_id=oc_id,
            usuario_id=recepcion.usuario_id,
            notas=f"Recepción OC {oc.numero}"
        )

        detalle.cantidad_recibida += cantidad_a_recibir
        total_recibido_valor += int(cantidad_a_recibir * detalle.precio_unitario)

    todos_los_detalles = db.query(DetalleOrdenCompra).filter(
        DetalleOrdenCompra.orden_compra_id == oc_id
    ).all()
    
    total_pedido = sum(d.cantidad_pedida for d in todos_los_detalles)
    total_recibido = sum(d.cantidad_recibida for d in todos_los_detalles)

    if total_recibido >= total_pedido:
        oc.estado = "recibida"
    elif total_recibido > 0:
        oc.estado = "recibida_parcial"

    oc.bodega_destino_id = recepcion.bodega_destino_id

    if recepcion.crear_cuenta_pagar and total_recibido_valor > 0:
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

    db.commit()
    db.refresh(oc)
    return _build_response(oc)


@router.post("/desde-dte", response_model=OrdenCompraResponse, status_code=status.HTTP_201_CREATED)
def crear_desde_dte(empresa_id: str, payload: ImportarDTERequest, usuario_id: int = 1, db: Session = Depends(get_db)):
    try:
        dte = json.loads(payload.json_dte)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="El JSON proporcionado no es válido")

    codigo_gen = dte.get("identificacion", {}).get("codigoGeneracion", "")
    if codigo_gen:
        existente = db.query(OrdenCompra).filter(
            OrdenCompra.empresa_id == empresa_id,
            OrdenCompra.codigo_generacion_proveedor == codigo_gen
        ).first()
        if existente:
            raise HTTPException(status_code=400, detail=f"Este DTE ({codigo_gen}) ya fue importado en la orden {existente.numero}.")

    emisor = dte.get("emisor", {})
    nit_emisor = emisor.get("nit", "")
    nombre_emisor = emisor.get("nombre", "")

    if not nit_emisor or not nombre_emisor:
        raise HTTPException(status_code=400, detail="El DTE no tiene información válida del emisor")

    # Buscar o crear proveedor
    proveedor = db.query(Proveedor).filter(
        Proveedor.empresa_id == empresa_id,
        Proveedor.nit == nit_emisor
    ).first()

    if not proveedor:
        proveedor = Proveedor(
            empresa_id=empresa_id,
            nombre=nombre_emisor,
            nombre_comercial=emisor.get("nombreComercial", ""),
            nit=nit_emisor,
            nrc=emisor.get("nrc", ""),
            telefono=emisor.get("telefono", ""),
            email=emisor.get("correo", "")
        )
        db.add(proveedor)
        db.flush()

    # Crear Orden
    fec_emi_str = dte.get("identificacion", {}).get("fecEmi", "")
    fecha_emision_doc = datetime.now(TIMEZONE)
    if fec_emi_str:
        try:
            fecha_emision_doc = datetime.strptime(fec_emi_str, "%Y-%m-%d").replace(tzinfo=TIMEZONE)
        except:
            pass

    oc = OrdenCompra(
        empresa_id=empresa_id,
        numero=_generar_numero_oc(db, empresa_id),
        proveedor_id=proveedor.id,
        tipo_doc="CCF",
        json_dte_proveedor=payload.json_dte,
        codigo_generacion_proveedor=dte.get("identificacion", {}).get("codigoGeneracion", ""),
        fecha_emision=fecha_emision_doc,
        sello_recepcion_proveedor=dte.get("selloRecibido", ""),
        estado="borrador",
        usuario_id=usuario_id,
        notas=f"Generado automáticamente desde DTE {dte.get('identificacion', {}).get('numeroControl', '')}"
    )
    db.add(oc)
    db.flush()

    cuerpo_documento = dte.get("cuerpoDocumento", [])
    subtotal = 0
    
    for item in cuerpo_documento:
        descripcion = item.get("descripcion", "")
        if not descripcion: continue
        
        # Buscar producto por nombre (o código) o crearlo si no existe
        producto = db.query(Producto).filter(
            Producto.empresa_id == empresa_id,
            Producto.nombre == descripcion
        ).first()
        
        precio_unitario = int(float(item.get("precioUni", 0)) * 100)
        cantidad = float(item.get("cantidad", 0))
        
        if not producto:
            producto = Producto(
                empresa_id=empresa_id,
                codigo=item.get("codigo", f"P-{str(len(descripcion))}-{int(precio_unitario)}"),
                nombre=descripcion,
                precio_venta=precio_unitario, # Por defecto al mismo precio, el usuario luego lo ajusta
                costo_promedio=precio_unitario,
                stock=0.0
            )
            db.add(producto)
            db.flush()
            
        item_subtotal = int(float(item.get("ventaGravada", 0)) * 100)
        detalle = DetalleOrdenCompra(
            orden_compra_id=oc.id,
            producto_id=producto.id_producto,
            cantidad_pedida=cantidad,
            cantidad_recibida=0.0,
            precio_unitario=precio_unitario,
            subtotal=item_subtotal
        )
        db.add(detalle)
        subtotal += item_subtotal

    resumen = dte.get("resumen", {})
    subtotal_dte = int(float(resumen.get("totalGravada", subtotal/100)) * 100)
    iva_dte = int(float(resumen.get("totalIva", (subtotal/100)*0.13)) * 100)
    total_dte = int(float(resumen.get("montoTotalOperacion", (subtotal_dte+iva_dte)/100)) * 100)

    oc.subtotal = subtotal_dte
    oc.iva = iva_dte
    oc.total = total_dte

    db.commit()
    db.refresh(oc)
    return _build_response(oc)

@router.post("/{oc_id}/importar-dte", response_model=OrdenCompraResponse)
def importar_dte_proveedor(oc_id: int, empresa_id: str, payload: ImportarDTERequest, db: Session = Depends(get_db)):
    oc = db.query(OrdenCompra).filter(OrdenCompra.id == oc_id, OrdenCompra.empresa_id == empresa_id).first()
    if not oc:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    if oc.estado not in ("borrador", "enviada"):
        raise HTTPException(status_code=400, detail="Solo se puede importar DTE en órdenes en borrador o enviadas")

    try:
        dte = json.loads(payload.json_dte)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="El JSON proporcionado no es válido")

    oc.json_dte_proveedor = payload.json_dte
    oc.codigo_generacion_proveedor = dte.get("identificacion", {}).get("codigoGeneracion", "")
    oc.sello_recepcion_proveedor = dte.get("selloRecibido", "")
    
    fec_emi_str = dte.get("identificacion", {}).get("fecEmi", "")
    if fec_emi_str:
        try:
            oc.fecha_emision = datetime.strptime(fec_emi_str, "%Y-%m-%d").replace(tzinfo=TIMEZONE)
        except:
            pass

    resumen = dte.get("resumen", {})
    subtotal_dte = int(float(resumen.get("totalGravada", 0)) * 100)
    iva_dte = int(float(resumen.get("totalIva", 0)) * 100)
    total_dte = int(float(resumen.get("montoTotalOperacion", 0)) * 100)

    if total_dte > 0:
        oc.subtotal = subtotal_dte
        oc.iva = iva_dte
        oc.total = total_dte

    db.commit()
    db.refresh(oc)
    return _build_response(oc)


@router.put("/{oc_id}/anular", response_model=OrdenCompraResponse)
def anular_orden(oc_id: int, empresa_id: str, db: Session = Depends(get_db)):
    oc = db.query(OrdenCompra).filter(OrdenCompra.id == oc_id, OrdenCompra.empresa_id == empresa_id).first()
    if not oc:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    if oc.estado == "recibida":
        raise HTTPException(status_code=400, detail="No se puede anular una OC ya recibida completamente")
    
    oc.estado = "anulada"
    db.commit()
    db.refresh(oc)
    return _build_response(oc)

@router.delete("/{orden_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_orden(orden_id: int, empresa_id: str, db: Session = Depends(get_db)):
    oc = db.query(OrdenCompra).filter(OrdenCompra.id == orden_id, OrdenCompra.empresa_id == empresa_id).first()
    if not oc:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
        
    # Revertir Stock y Eliminar Kardex si fue recibida (solo para fines de pruebas / limpieza)
    if oc.estado in ("recibida", "recibida_parcial"):
        from models import StockBodega, Kardex, CuentaPorPagar
        
        # Eliminar CxP asociada
        db.query(CuentaPorPagar).filter(CuentaPorPagar.orden_compra_id == orden_id).delete()
        
        # Eliminar Kardex y Revertir Stock
        for det in oc.detalles:
            if det.cantidad_recibida > 0:
                # Buscar y eliminar Kardex
                kardexs = db.query(Kardex).filter(
                    Kardex.empresa_id == empresa_id,
                    Kardex.producto_id == det.producto_id,
                    Kardex.referencia_tipo == "orden_compra",
                    Kardex.referencia_id == orden_id
                ).all()
                for k in kardexs:
                    db.delete(k)
                
                # Revertir Stock
                stock = db.query(StockBodega).filter(
                    StockBodega.empresa_id == empresa_id,
                    StockBodega.bodega_id == oc.bodega_destino_id,
                    StockBodega.producto_id == det.producto_id
                ).first()
                if stock:
                    stock.stock_actual -= det.cantidad_recibida
                    if stock.stock_actual <= 0:
                        db.delete(stock)
    
    db.query(DetalleOrdenCompra).filter(DetalleOrdenCompra.orden_compra_id == orden_id).delete()
    db.delete(oc)
    db.commit()
