from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ContratoArrendamiento, PagoArrendamiento, SesionCaja, MovimientoCaja, Caja
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta
import pytz
import calendar

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/arrendamientos", tags=["Contratos de Arrendamiento"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class ContratoArrendamientoCreate(BaseModel):
    inmueble_nombre: str
    tipo: Optional[str] = "ARRENDATARIO" # ARRENDATARIO (Nosotros pagamos) | ARRENDADOR (Nosotros cobramos)
    contraparte_nombre: str # Propietario o Inquilino
    dui_nit: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    canon_mensual: int # centavos
    dia_pago_limite: Optional[int] = 5 # 1-31
    deposito_garantia: Optional[int] = 0 # centavos
    
    # Configuración de Recargo por Mora
    aplica_mora: Optional[bool] = False
    tipo_mora: Optional[str] = "porcentaje" # porcentaje | monto_fijo
    valor_mora: Optional[float] = 0.0 # Ej: 5.0 (%) o centavos si es monto fijo
    dias_gracia: Optional[int] = 0
    
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    estado: Optional[str] = "activo" # activo | finalizado | suspendido
    notas: Optional[str] = None

class PagoArrendamientoCreate(BaseModel):
    tipo: Optional[str] = "PAGO_ALQUILER" # PAGO_ALQUILER | COBRO_ALQUILER
    anio: Optional[int] = None
    mes: Optional[int] = None
    monto: int # centavos (total)
    monto_mora: Optional[int] = 0 # centavos
    fecha_pago: Optional[str] = None
    metodo_pago: Optional[str] = "efectivo"
    referencia: Optional[str] = None
    notas: Optional[str] = None

class PagoArrendamientoResponse(BaseModel):
    id: int
    contrato_id: int
    empresa_id: str
    anio: Optional[int] = None
    mes: Optional[int] = None
    tipo: str
    monto: int
    monto_mora: Optional[int] = 0
    fecha_pago: datetime
    metodo_pago: str
    referencia: Optional[str] = None
    notas: Optional[str] = None
    usuario_id: Optional[int] = None

    class Config:
        from_attributes = True

class ContratoArrendamientoResponse(BaseModel):
    id: int
    empresa_id: str
    inmueble_nombre: str
    tipo: str
    contraparte_nombre: str
    dui_nit: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    canon_mensual: int
    dia_pago_limite: int
    deposito_garantia: int
    aplica_mora: Optional[bool] = False
    tipo_mora: Optional[str] = "porcentaje"
    valor_mora: Optional[float] = 0.0
    dias_gracia: Optional[int] = 0
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: str
    notas: Optional[str] = None
    fecha_registro: datetime
    total_pagado_historico: Optional[int] = 0

    class Config:
        from_attributes = True


MESES_NOMBRES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ContratoArrendamientoResponse])
@router.get("/", response_model=List[ContratoArrendamientoResponse])
def listar_contratos(empresa_id: str, db: Session = Depends(get_db)):
    contratos = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.empresa_id == empresa_id
    ).order_by(ContratoArrendamiento.fecha_registro.desc()).all()
    
    res = []
    for c in contratos:
        total_p = sum(p.monto for p in c.pagos)
        c_dict = {
            "id": c.id,
            "empresa_id": c.empresa_id,
            "inmueble_nombre": c.inmueble_nombre,
            "tipo": c.tipo or "ARRENDATARIO",
            "contraparte_nombre": c.contraparte_nombre,
            "dui_nit": c.dui_nit,
            "telefono": c.telefono,
            "email": c.email,
            "canon_mensual": c.canon_mensual or 0,
            "dia_pago_limite": c.dia_pago_limite or 5,
            "deposito_garantia": c.deposito_garantia or 0,
            "aplica_mora": c.aplica_mora or False,
            "tipo_mora": c.tipo_mora or "porcentaje",
            "valor_mora": c.valor_mora or 0.0,
            "dias_gracia": c.dias_gracia or 0,
            "fecha_inicio": c.fecha_inicio,
            "fecha_fin": c.fecha_fin,
            "estado": c.estado or "activo",
            "notas": c.notas,
            "fecha_registro": c.fecha_registro,
            "total_pagado_historico": total_p
        }
        res.append(c_dict)
    return res


@router.post("", response_model=ContratoArrendamientoResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ContratoArrendamientoResponse, status_code=status.HTTP_201_CREATED)
def crear_contrato(empresa_id: str, data: ContratoArrendamientoCreate, db: Session = Depends(get_db)):
    f_inicio = None
    f_fin = None
    if data.fecha_inicio:
        try:
            f_inicio = datetime.fromisoformat(data.fecha_inicio)
        except Exception:
            pass
    if data.fecha_fin:
        try:
            f_fin = datetime.fromisoformat(data.fecha_fin)
        except Exception:
            pass

    contrato = ContratoArrendamiento(
        empresa_id=empresa_id,
        inmueble_nombre=data.inmueble_nombre,
        tipo=data.tipo or "ARRENDATARIO",
        contraparte_nombre=data.contraparte_nombre,
        dui_nit=data.dui_nit,
        telefono=data.telefono,
        email=data.email,
        canon_mensual=data.canon_mensual or 0,
        dia_pago_limite=data.dia_pago_limite or 5,
        deposito_garantia=data.deposito_garantia or 0,
        aplica_mora=data.aplica_mora or False,
        tipo_mora=data.tipo_mora or "porcentaje",
        valor_mora=data.valor_mora or 0.0,
        dias_gracia=data.dias_gracia or 0,
        fecha_inicio=f_inicio,
        fecha_fin=f_fin,
        estado=data.estado or "activo",
        notas=data.notas
    )
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    
    contrato.total_pagado_historico = 0
    return contrato


@router.put("/{contrato_id}", response_model=ContratoArrendamientoResponse)
def actualizar_contrato(contrato_id: int, empresa_id: str, data: ContratoArrendamientoCreate, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato de arrendamiento no encontrado")

    f_inicio = contrato.fecha_inicio
    f_fin = contrato.fecha_fin
    if data.fecha_inicio:
        try:
            f_inicio = datetime.fromisoformat(data.fecha_inicio)
        except Exception:
            pass
    if data.fecha_fin:
        try:
            f_fin = datetime.fromisoformat(data.fecha_fin)
        except Exception:
            pass

    contrato.inmueble_nombre = data.inmueble_nombre
    contrato.tipo = data.tipo or "ARRENDATARIO"
    contrato.contraparte_nombre = data.contraparte_nombre
    contrato.dui_nit = data.dui_nit
    contrato.telefono = data.telefono
    contrato.email = data.email
    contrato.canon_mensual = data.canon_mensual or 0
    contrato.dia_pago_limite = data.dia_pago_limite or 5
    contrato.deposito_garantia = data.deposito_garantia or 0
    contrato.aplica_mora = data.aplica_mora or False
    contrato.tipo_mora = data.tipo_mora or "porcentaje"
    contrato.valor_mora = data.valor_mora or 0.0
    contrato.dias_gracia = data.dias_gracia or 0
    contrato.fecha_inicio = f_inicio
    contrato.fecha_fin = f_fin
    contrato.estado = data.estado or "activo"
    contrato.notas = data.notas

    db.commit()
    db.refresh(contrato)
    contrato.total_pagado_historico = sum(p.monto for p in contrato.pagos)
    return contrato


@router.delete("/{contrato_id}")
def eliminar_contrato(contrato_id: int, empresa_id: str, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    db.delete(contrato)
    db.commit()
    return {"message": "Contrato eliminado con éxito"}


@router.get("/{contrato_id}/tabla-anual")
def obtener_tabla_anual_contrato(contrato_id: int, empresa_id: str, anio: Optional[int] = None, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    hoy = datetime.now(TIMEZONE).date()
    anio_evaluado = anio or hoy.year

    # Obtener pagos existentes para ese año
    pagos_anio = db.query(PagoArrendamiento).filter(
        PagoArrendamiento.contrato_id == contrato_id,
        PagoArrendamiento.anio == anio_evaluado
    ).all()
    pagos_map = {p.mes: p for p in pagos_anio if p.mes}

    tabla = []
    dia_limite_base = contrato.dia_pago_limite or 5
    canon_base = contrato.canon_mensual or 0

    for mes in range(1, 13):
        # Determinar el último día posible del mes para evitar ValueError (ej: Feb 28/29, Abr 30)
        max_dias = calendar.monthrange(anio_evaluado, mes)[1]
        dia_efectivo = min(dia_limite_base, max_dias)
        fecha_limite = date(anio_evaluado, mes, dia_efectivo)

        pago_existente = pagos_map.get(mes)

        if pago_existente:
            estado = "pagado"
            mora_calculada = pago_existente.monto_mora or 0
            monto_total = pago_existente.monto
            es_vencido = False
            dias_atraso = 0
            fecha_pago_real = pago_existente.fecha_pago.strftime("%Y-%m-%d %H:%M") if pago_existente.fecha_pago else None
        else:
            fecha_pago_real = None
            fecha_limite_con_gracia = fecha_limite + timedelta(days=contrato.dias_gracia or 0)
            if hoy > fecha_limite_con_gracia:
                es_vencido = True
                dias_atraso = (hoy - fecha_limite).days
                estado = "vencido"
                mora_calculada = 0
                if contrato.aplica_mora:
                    if contrato.tipo_mora == "monto_fijo":
                        val = contrato.valor_mora or 0.0
                        mora_calculada = int(round(val if val >= 100 else val * 100))
                    else: # porcentaje
                        mora_calculada = int(round(canon_base * ((contrato.valor_mora or 0.0) / 100.0)))
            else:
                es_vencido = False
                dias_atraso = 0
                estado = "pendiente"
                mora_calculada = 0

            monto_total = canon_base + mora_calculada

        tabla.append({
            "mes": mes,
            "nombre_mes": MESES_NOMBRES[mes - 1],
            "anio": anio_evaluado,
            "fecha_limite": fecha_limite.isoformat(),
            "canon_base": canon_base,
            "aplica_mora": contrato.aplica_mora or False,
            "mora_calculada": mora_calculada,
            "monto_total_estimado": monto_total,
            "es_vencido": es_vencido,
            "dias_atraso": dias_atraso,
            "estado": estado,
            "fecha_pago_real": fecha_pago_real,
            "pago_id": pago_existente.id if pago_existente else None,
            "metodo_pago": pago_existente.metodo_pago if pago_existente else None,
            "referencia": pago_existente.referencia if pago_existente else None
        })

    return {
        "contrato_id": contrato.id,
        "inmueble_nombre": contrato.inmueble_nombre,
        "tipo": contrato.tipo,
        "contraparte_nombre": contrato.contraparte_nombre,
        "canon_mensual": canon_base,
        "dia_pago_limite": dia_limite_base,
        "aplica_mora": contrato.aplica_mora or False,
        "tipo_mora": contrato.tipo_mora or "porcentaje",
        "valor_mora": contrato.valor_mora or 0.0,
        "dias_gracia": contrato.dias_gracia or 0,
        "anio": anio_evaluado,
        "tabla": tabla
    }


@router.get("/{contrato_id}/pagos", response_model=List[PagoArrendamientoResponse])
def listar_pagos_contrato(contrato_id: int, empresa_id: str, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    pagos = db.query(PagoArrendamiento).filter(
        PagoArrendamiento.contrato_id == contrato_id
    ).order_by(PagoArrendamiento.fecha_pago.desc()).all()
    return pagos


@router.post("/{contrato_id}/pagos", response_model=PagoArrendamientoResponse, status_code=status.HTTP_201_CREATED)
def registrar_pago_arrendamiento(contrato_id: int, empresa_id: str, usuario_id: int, data: PagoArrendamientoCreate, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")

    tipo_transaccion = data.tipo or ("COBRO_ALQUILER" if contrato.tipo == "ARRENDADOR" else "PAGO_ALQUILER")

    pago = PagoArrendamiento(
        contrato_id=contrato.id,
        empresa_id=empresa_id,
        anio=data.anio,
        mes=data.mes,
        tipo=tipo_transaccion,
        monto=data.monto,
        monto_mora=data.monto_mora or 0,
        metodo_pago=data.metodo_pago or "efectivo",
        referencia=data.referencia,
        notas=data.notas,
        usuario_id=usuario_id
    )

    if data.fecha_pago:
        try:
            pago.fecha_pago = datetime.fromisoformat(data.fecha_pago)
        except Exception:
            pass

    db.add(pago)
    db.flush()

    # Integración con Caja Activa si aplica
    if (data.metodo_pago or "efectivo").lower() == "efectivo":
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        
        if sesion:
            es_ingreso = tipo_transaccion == "COBRO_ALQUILER"
            concepto_periodo = f" (Mes {data.mes}/{data.anio})" if data.mes and data.anio else ""
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="ingreso" if es_ingreso else "egreso",
                metodo_pago="efectivo",
                monto=data.monto,
                concepto=f"Arrendamiento{concepto_periodo} ({contrato.inmueble_nombre}): {contrato.contraparte_nombre}",
                referencia_tipo="arrendamiento",
                referencia_id=pago.id,
                usuario_id=usuario_id
            ))

    db.commit()
    db.refresh(pago)
    return pago
