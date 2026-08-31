from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Bodega, Usuario
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/bodegas", tags=["Bodegas"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class BodegaBase(BaseModel):
    codigo: str
    nombre: str
    ubicacion: Optional[str] = None
    responsable_id: Optional[int] = None
    es_principal: bool = False

class BodegaCreate(BodegaBase):
    pass

class BodegaUpdate(BaseModel):
    nombre: Optional[str] = None
    ubicacion: Optional[str] = None
    responsable_id: Optional[int] = None
    es_principal: Optional[bool] = None
    activa: Optional[bool] = None

class BodegaResponse(BodegaBase):
    id: int
    empresa_id: str
    activa: bool
    responsable_nombre: Optional[str] = None

    class Config:
        from_attributes = True

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[BodegaResponse])
def listar_bodegas(empresa_id: str, solo_activas: bool = True, db: Session = Depends(get_db)):
    query = db.query(Bodega).filter(Bodega.empresa_id == empresa_id)
    if solo_activas:
        query = query.filter(Bodega.activa == True)
    bodegas = query.order_by(Bodega.es_principal.desc(), Bodega.nombre).all()

    resultado = []
    for b in bodegas:
        resp = BodegaResponse(
            id=b.id,
            empresa_id=b.empresa_id,
            codigo=b.codigo,
            nombre=b.nombre,
            ubicacion=b.ubicacion,
            responsable_id=b.responsable_id,
            es_principal=b.es_principal,
            activa=b.activa,
            responsable_nombre=b.responsable.username if b.responsable else None
        )
        resultado.append(resp)
    return resultado


@router.post("/", response_model=BodegaResponse, status_code=status.HTTP_201_CREATED)
def crear_bodega(empresa_id: str, bodega: BodegaCreate, db: Session = Depends(get_db)):
    # Si es_principal, quitar esa bandera a las demás
    if bodega.es_principal:
        db.query(Bodega).filter(
            Bodega.empresa_id == empresa_id,
            Bodega.es_principal == True
        ).update({"es_principal": False})

    # Verificar código único en la empresa
    existente = db.query(Bodega).filter(
        Bodega.empresa_id == empresa_id,
        Bodega.codigo == bodega.codigo
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe una bodega con el código '{bodega.codigo}'")

    nueva = Bodega(**bodega.dict(), empresa_id=empresa_id)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return BodegaResponse(
        id=nueva.id,
        empresa_id=nueva.empresa_id,
        codigo=nueva.codigo,
        nombre=nueva.nombre,
        ubicacion=nueva.ubicacion,
        responsable_id=nueva.responsable_id,
        es_principal=nueva.es_principal,
        activa=nueva.activa,
        responsable_nombre=nueva.responsable.username if nueva.responsable else None
    )


@router.put("/{bodega_id}", response_model=BodegaResponse)
def actualizar_bodega(bodega_id: int, empresa_id: str, datos: BodegaUpdate, db: Session = Depends(get_db)):
    bodega = db.query(Bodega).filter(Bodega.id == bodega_id, Bodega.empresa_id == empresa_id).first()
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")

    # Si se está marcando como principal, quitar la bandera a las demás
    if datos.es_principal:
        db.query(Bodega).filter(
            Bodega.empresa_id == empresa_id,
            Bodega.es_principal == True,
            Bodega.id != bodega_id
        ).update({"es_principal": False})

    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(bodega, campo, valor)

    db.commit()
    db.refresh(bodega)

    return BodegaResponse(
        id=bodega.id,
        empresa_id=bodega.empresa_id,
        codigo=bodega.codigo,
        nombre=bodega.nombre,
        ubicacion=bodega.ubicacion,
        responsable_id=bodega.responsable_id,
        es_principal=bodega.es_principal,
        activa=bodega.activa,
        responsable_nombre=bodega.responsable.username if bodega.responsable else None
    )


@router.delete("/{bodega_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_bodega(bodega_id: int, empresa_id: str, db: Session = Depends(get_db)):
    """Desactiva la bodega (soft delete) para no perder el historial de Kardex."""
    bodega = db.query(Bodega).filter(Bodega.id == bodega_id, Bodega.empresa_id == empresa_id).first()
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    if bodega.es_principal:
        raise HTTPException(status_code=400, detail="No se puede desactivar la bodega principal")
    bodega.activa = False
    db.commit()
