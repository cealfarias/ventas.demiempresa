from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime
from database import get_db
from models import CategoriaGasto, Gasto, SesionCaja, Caja, MovimientoCaja
import pytz

router = APIRouter(prefix="/gastos", tags=["Gastos"])

TIMEZONE = pytz.timezone("America/El_Salvador")

@router.get("/categorias")
def listar_categorias(empresa_id: str, db: Session = Depends(get_db)):
    cats = db.query(CategoriaGasto).filter(CategoriaGasto.empresa_id == empresa_id).all()
    return [{"id": c.id, "nombre": c.nombre, "descripcion": c.descripcion} for c in cats]

@router.post("/categorias")
def crear_categoria(empresa_id: str, nombre: str, descripcion: Optional[str] = "", db: Session = Depends(get_db)):
    cat = CategoriaGasto(empresa_id=empresa_id, nombre=nombre, descripcion=descripcion)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "nombre": cat.nombre}

@router.get("/")
def listar_gastos(empresa_id: str, db: Session = Depends(get_db)):
    gastos = db.query(Gasto).filter(Gasto.empresa_id == empresa_id).order_by(Gasto.id.desc()).limit(100).all()
    res = []
    for g in gastos:
        res.append({
            "id": g.id,
            "categoria": g.categoria.nombre if g.categoria else "Sin Categoria",
            "monto": g.monto,
            "fecha": g.fecha,
            "descripcion": g.descripcion,
            "metodo_pago": g.metodo_pago,
            "sesion_caja_id": g.sesion_caja_id
        })
    return res

@router.post("/")
def registrar_gasto(empresa_id: str, usuario_id: int, categoria_id: int, monto: float, descripcion: str, metodo_pago: str = "efectivo", de_caja: bool = True, db: Session = Depends(get_db)):
    monto_centavos = int(monto * 100)
    sesion = None
    
    if de_caja:
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        if not sesion:
            raise HTTPException(status_code=400, detail="No tiene un turno de caja abierto para registrar gastos operativos de caja.")
            
    gasto = Gasto(
        empresa_id=empresa_id,
        categoria_id=categoria_id,
        monto=monto_centavos,
        descripcion=descripcion,
        metodo_pago=metodo_pago,
        sesion_caja_id=sesion.id if sesion else None
    )
    db.add(gasto)
    db.flush()
    
    if sesion:
        mov = MovimientoCaja(
            sesion_caja_id=sesion.id,
            tipo="egreso",
            metodo_pago=metodo_pago,
            monto=monto_centavos,
            concepto=f"Gasto: {descripcion[:100]}",
            referencia_tipo="gasto",
            referencia_id=gasto.id,
            usuario_id=usuario_id
        )
        db.add(mov)
        
    db.commit()
    return {"mensaje": "Gasto registrado correctamente", "id": gasto.id}

