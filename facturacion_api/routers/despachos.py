from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Despacho, DetalleDespacho, Factura
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/despachos", tags=["Despachos"])

# ── Schemas ──

class DetalleDespachoCreate(BaseModel):
    factura_id: int
    direccion_entrega: Optional[str] = None

class DespachoCreate(BaseModel):
    motorista: Optional[str] = None
    vehiculo_placa: Optional[str] = None
    fecha_programada: Optional[datetime] = None
    notas: Optional[str] = None
    detalles: List[DetalleDespachoCreate]

class DetalleDespachoResponse(BaseModel):
    id: int
    factura_id: int
    factura_numero: str
    cliente_nombre: str
    direccion_entrega: Optional[str]
    estado: str
    notas_entrega: Optional[str]

    class Config:
        from_attributes = True

class DespachoResponse(BaseModel):
    id: int
    empresa_id: str
    numero: str
    motorista: Optional[str]
    vehiculo_placa: Optional[str]
    fecha_programada: Optional[datetime]
    fecha_salida: Optional[datetime]
    fecha_entrega: Optional[datetime]
    estado: str
    notas: Optional[str]
    fecha_creacion: datetime
    detalles: List[DetalleDespachoResponse] = []

    class Config:
        from_attributes = True

class MarcarEntregaRequest(BaseModel):
    estado: str # entregado | fallido
    notas_entrega: Optional[str] = None

def _generar_numero(db: Session, empresa_id: str) -> str:
    anio = datetime.now().year
    count = db.query(Despacho).filter(Despacho.empresa_id == empresa_id).count()
    return f"DESP-{anio}-{str(count + 1).zfill(5)}"

# ── Endpoints ──

@router.get("/", response_model=List[DespachoResponse])
def listar_despachos(empresa_id: str, estado: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Despacho).filter(Despacho.empresa_id == empresa_id)
    if estado:
        query = query.filter(Despacho.estado == estado)
    
    despachos = query.order_by(Despacho.fecha_creacion.desc()).all()
    
    resultado = []
    for d in despachos:
        detalles = []
        for det in d.detalles:
            detalles.append(DetalleDespachoResponse(
                id=det.id,
                factura_id=det.factura_id,
                factura_numero=det.factura.numero if det.factura else "",
                cliente_nombre=det.factura.cliente.nombre if (det.factura and det.factura.cliente) else "",
                direccion_entrega=det.direccion_entrega,
                estado=det.estado,
                notas_entrega=det.notas_entrega
            ))
        resultado.append(DespachoResponse(
            id=d.id, empresa_id=d.empresa_id, numero=d.numero, motorista=d.motorista,
            vehiculo_placa=d.vehiculo_placa, fecha_programada=d.fecha_programada,
            fecha_salida=d.fecha_salida, fecha_entrega=d.fecha_entrega,
            estado=d.estado, notas=d.notas, fecha_creacion=d.fecha_creacion,
            detalles=detalles
        ))
    return resultado

@router.post("/", response_model=DespachoResponse)
def crear_despacho(empresa_id: str, usuario_id: int, data: DespachoCreate, db: Session = Depends(get_db)):
    numero = _generar_numero(db, empresa_id)
    
    despacho = Despacho(
        empresa_id=empresa_id,
        numero=numero,
        motorista=data.motorista,
        vehiculo_placa=data.vehiculo_placa,
        fecha_programada=data.fecha_programada,
        notas=data.notas,
        usuario_id=usuario_id
    )
    db.add(despacho)
    db.flush()
    
    for item in data.detalles:
        # Verificar que la factura exista y pertenezca a la empresa
        factura = db.query(Factura).filter(Factura.id == item.factura_id, Factura.empresa_id == empresa_id).first()
        if not factura:
            raise HTTPException(status_code=404, detail=f"Factura {item.factura_id} no encontrada")
            
        detalle = DetalleDespacho(
            despacho_id=despacho.id,
            factura_id=item.factura_id,
            direccion_entrega=item.direccion_entrega or (factura.cliente.direccion if factura.cliente else "")
        )
        db.add(detalle)
        
    db.commit()
    db.refresh(despacho)
    
    # Recargar a través de listar_despachos para simplificar el parseo a response (con join)
    return listar_despachos(empresa_id, estado="programado", db=db)[0]

@router.put("/{despacho_id}/estado")
def cambiar_estado_despacho(despacho_id: int, empresa_id: str, estado: str, db: Session = Depends(get_db)):
    despacho = db.query(Despacho).filter(Despacho.id == despacho_id, Despacho.empresa_id == empresa_id).first()
    if not despacho:
        raise HTTPException(status_code=404, detail="Despacho no encontrado")
        
    despacho.estado = estado
    if estado == "en_transito" and not despacho.fecha_salida:
        despacho.fecha_salida = datetime.now(TIMEZONE)
    elif estado == "entregado" and not despacho.fecha_entrega:
        despacho.fecha_entrega = datetime.now(TIMEZONE)
        
    db.commit()
    return {"status": "ok"}

@router.put("/detalle/{detalle_id}/entrega")
def registrar_resultado_entrega(detalle_id: int, empresa_id: str, req: MarcarEntregaRequest, db: Session = Depends(get_db)):
    detalle = db.query(DetalleDespacho).join(Despacho).filter(
        DetalleDespacho.id == detalle_id,
        Despacho.empresa_id == empresa_id
    ).first()
    
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle de despacho no encontrado")
        
    detalle.estado = req.estado
    detalle.notas_entrega = req.notas_entrega
    
    db.commit()
    return {"status": "ok"}
