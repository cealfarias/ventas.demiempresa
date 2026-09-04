from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Factura, ItemFactura, Cliente, Bodega, Producto, CuentaPorCobrar
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
    precio_unitario: int  # centavos
    subtotal: int

class FacturaCreate(BaseModel):
    cliente_id: int
    bodega_salida_id: Optional[int] = None
    
    tipo_doc: str = "FACTURA" # FACTURA | CCF | EXPORTACION
    condicion_operacion: str = "CONTADO" # CONTADO | CREDITO
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
    bodega_salida_id: Optional[int]
    tipo_doc: str
    condicion_operacion: str
    subtotal: int
    iva: int
    total: int
    estado: str
    estado_dte: str
    codigo_generacion: Optional[str]
    sello_recepcion: Optional[str]
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

@router.get("/", response_model=List[FacturaResponse])
def listar_facturas(empresa_id: str, db: Session = Depends(get_db)):
    facturas = db.query(Factura).filter(Factura.empresa_id == empresa_id).order_by(Factura.fecha_emision.desc()).all()
    
    resultado = []
    for f in facturas:
        items = []
        for d in f.items:
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
        f.fecha_emision = datetime.strptime(data.fecha_emision, "%Y-%m-%d")
    
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
        cxc = CuentaPorCobrar(
            empresa_id=empresa_id,
            cliente_id=data.cliente_id,
            factura_id=f.id,
            fecha_vencimiento=datetime.now(TIMEZONE) + timedelta(days=data.dias_credito),
            monto_original=data.total,
            saldo_pendiente=data.total,
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

    db.commit()
    db.refresh(f)
    return listar_facturas(empresa_id, db)[0]

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
                    <td class="text-right">${item.precio_unitario / 100:.2f}</td>
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
