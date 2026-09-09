from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Acreedor, MovimientoAcreedor, SesionCaja, MovimientoCaja, Caja, PrestamoAcreedor, CuotaAmortizacion
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/finanzas/acreedores", tags=["Acreedores y Préstamos"])

# Helper para sumar meses a una fecha
def add_months(dt: datetime, months: int) -> datetime:
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, 28)
    return dt.replace(year=year, month=month, day=day)

# ── Schemas ───────────────────────────────────────────────────────────────────

class AcreedorCreate(BaseModel):
    nombre: str
    contacto_telefono: Optional[str] = None
    dui_nit: Optional[str] = None
    email: Optional[str] = None
    tasa_interes_anual: Optional[float] = 0.0
    saldo_capital: Optional[int] = 0 # centavos iniciales si aplica
    notas: Optional[str] = None

class MovimientoAcreedorCreate(BaseModel):
    tipo: str # PRESTAMO_RECIBIDO | PAGO_CAPITAL | PAGO_INTERES | PAGO_MIXTO
    monto_capital: Optional[int] = 0
    monto_interes: Optional[int] = 0
    metodo_pago: Optional[str] = "efectivo"
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha: Optional[str] = None

class MovimientoAcreedorResponse(BaseModel):
    id: int
    acreedor_id: int
    tipo: str
    monto_capital: int
    monto_interes: int
    monto_total: int
    metodo_pago: str
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha: datetime
    class Config:
        from_attributes = True

class AcreedorResponse(BaseModel):
    id: int
    empresa_id: str
    nombre: str
    contacto_telefono: Optional[str] = None
    dui_nit: Optional[str] = None
    email: Optional[str] = None
    notas: Optional[str] = None
    tasa_interes_anual: float
    saldo_capital: int
    saldo_interes: int
    intereses_pagados_anio: int
    total_pagado_historico: int
    activo: bool
    fecha_registro: datetime
    class Config:
        from_attributes = True

class PrestamoCreate(BaseModel):
    acreedor_id: int
    monto_prestamo: int # centavos
    tasa_interes_anual: float # ej 12.0
    plazo_meses: int # ej 12
    tipo_amortizacion: str # saldos_frances | interes_simple
    fecha_desembolso: Optional[str] = None
    notas: Optional[str] = None

class PagarCuotaRequest(BaseModel):
    metodo_pago: Optional[str] = "efectivo"
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha_pago: Optional[str] = None


# ── Endpoints de Acreedores ───────────────────────────────────────────────────

def obtener_acreedor_response(a: Acreedor, db: Session) -> AcreedorResponse:
    movs = db.query(MovimientoAcreedor).filter(MovimientoAcreedor.acreedor_id == a.id).all()
    anio_actual = datetime.now().year
    intereses_anio = sum(m.monto_interes for m in movs if m.fecha and m.fecha.year == anio_actual)
    total_pagado = sum(m.monto_total for m in movs if m.tipo in ["PAGO_CAPITAL", "PAGO_INTERES", "PAGO_MIXTO"])
    
    return AcreedorResponse(
        id=a.id,
        empresa_id=a.empresa_id,
        nombre=a.nombre,
        contacto_telefono=a.contacto_telefono,
        dui_nit=a.dui_nit,
        email=a.email,
        notas=a.notas,
        tasa_interes_anual=a.tasa_interes_anual or 0.0,
        saldo_capital=a.saldo_capital or 0,
        saldo_interes=a.saldo_interes or 0,
        intereses_pagados_anio=intereses_anio,
        total_pagado_historico=total_pagado,
        activo=a.activo,
        fecha_registro=a.fecha_registro
    )


@router.get("", response_model=List[AcreedorResponse])
@router.get("/", response_model=List[AcreedorResponse])
def listar_acreedores(empresa_id: str, db: Session = Depends(get_db)):
    acreedores = db.query(Acreedor).filter(Acreedor.empresa_id == empresa_id, Acreedor.activo == True).order_by(Acreedor.nombre).all()
    return [obtener_acreedor_response(a, db) for a in acreedores]


@router.post("", response_model=AcreedorResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AcreedorResponse, status_code=status.HTTP_201_CREATED)
def crear_acreedor(empresa_id: str, data: AcreedorCreate, db: Session = Depends(get_db)):
    a = Acreedor(
        empresa_id=empresa_id,
        nombre=data.nombre,
        contacto_telefono=data.contacto_telefono,
        dui_nit=data.dui_nit,
        email=data.email,
        tasa_interes_anual=data.tasa_interes_anual or 0.0,
        saldo_capital=data.saldo_capital or 0,
        notas=data.notas
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    
    if data.saldo_capital and data.saldo_capital > 0:
        mov = MovimientoAcreedor(
            acreedor_id=a.id,
            empresa_id=empresa_id,
            tipo="PRESTAMO_RECIBIDO",
            monto_capital=data.saldo_capital,
            monto_interes=0,
            monto_total=data.saldo_capital,
            metodo_pago="transferencia",
            notas="Saldo de préstamo inicial"
        )
        db.add(mov)
        db.commit()

    return obtener_acreedor_response(a, db)


@router.put("/{acreedor_id}", response_model=AcreedorResponse)
def actualizar_acreedor(acreedor_id: int, empresa_id: str, data: AcreedorCreate, db: Session = Depends(get_db)):
    a = db.query(Acreedor).filter(Acreedor.id == acreedor_id, Acreedor.empresa_id == empresa_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Acreedor no encontrado")
    
    a.nombre = data.nombre
    a.contacto_telefono = data.contacto_telefono
    a.dui_nit = data.dui_nit
    a.email = data.email
    a.tasa_interes_anual = data.tasa_interes_anual or 0.0
    a.notas = data.notas
    
    db.commit()
    db.refresh(a)
    return obtener_acreedor_response(a, db)


@router.get("/{acreedor_id}/movimientos", response_model=List[MovimientoAcreedorResponse])
def listar_movimientos_acreedor(acreedor_id: int, empresa_id: str, db: Session = Depends(get_db)):
    a = db.query(Acreedor).filter(Acreedor.id == acreedor_id, Acreedor.empresa_id == empresa_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Acreedor no encontrado")
    
    movs = db.query(MovimientoAcreedor).filter(MovimientoAcreedor.acreedor_id == acreedor_id).order_by(MovimientoAcreedor.fecha.desc()).all()
    return movs


@router.post("/{acreedor_id}/movimiento", response_model=MovimientoAcreedorResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimiento_acreedor(acreedor_id: int, empresa_id: str, usuario_id: int, data: MovimientoAcreedorCreate, db: Session = Depends(get_db)):
    a = db.query(Acreedor).filter(Acreedor.id == acreedor_id, Acreedor.empresa_id == empresa_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Acreedor no encontrado")
    
    m_cap = data.monto_capital or 0
    m_int = data.monto_interes or 0
    m_total = m_cap + m_int
    
    if m_total <= 0:
        raise HTTPException(status_code=400, detail="El monto total del movimiento debe ser mayor a cero")

    if data.tipo == "PRESTAMO_RECIBIDO":
        a.saldo_capital = (a.saldo_capital or 0) + m_cap
    elif data.tipo in ["PAGO_CAPITAL", "PAGO_INTERES", "PAGO_MIXTO"]:
        if m_cap > 0:
            a.saldo_capital = max(0, (a.saldo_capital or 0) - m_cap)
        if m_int > 0 and (a.saldo_interes or 0) > 0:
            a.saldo_interes = max(0, (a.saldo_interes or 0) - m_int)

    mov = MovimientoAcreedor(
        acreedor_id=a.id,
        empresa_id=empresa_id,
        tipo=data.tipo,
        monto_capital=m_cap,
        monto_interes=m_int,
        monto_total=m_total,
        metodo_pago=data.metodo_pago or "efectivo",
        referencia=data.referencia,
        notas=data.notas,
        usuario_id=usuario_id
    )
    if data.fecha:
        try:
            mov.fecha = datetime.fromisoformat(data.fecha)
        except Exception:
            pass

    db.add(mov)
    db.flush()

    sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
    if sesion:
        if data.tipo == "PRESTAMO_RECIBIDO":
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="ingreso",
                metodo_pago=data.metodo_pago or "efectivo",
                monto=m_total,
                concepto=f"Préstamo Recibido (Acreedor): {a.nombre}",
                referencia_tipo="acreedor",
                referencia_id=mov.id,
                usuario_id=usuario_id
            ))
        elif data.tipo in ["PAGO_CAPITAL", "PAGO_INTERES", "PAGO_MIXTO"]:
            concepto_str = f"Pago a Acreedor: {a.nombre}"
            if m_cap > 0 and m_int > 0:
                concepto_str += f" (Cap: ${m_cap/100:.2f}, Int: ${m_int/100:.2f})"
            elif m_int > 0:
                concepto_str += f" (Intereses: ${m_int/100:.2f})"
            else:
                concepto_str += f" (Capital: ${m_cap/100:.2f})"
                
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="egreso",
                metodo_pago=data.metodo_pago or "efectivo",
                monto=m_total,
                concepto=concepto_str,
                referencia_tipo="acreedor",
                referencia_id=mov.id,
                usuario_id=usuario_id
            ))

    db.commit()
    db.refresh(mov)
    return mov


# ── Endpoints de Préstamos y Amortizaciones ────────────────────────────────────

@router.post("/prestamos", status_code=status.HTTP_201_CREATED)
def crear_prestamo(empresa_id: str, usuario_id: int, data: PrestamoCreate, db: Session = Depends(get_db)):
    acreedor = db.query(Acreedor).filter(Acreedor.id == data.acreedor_id, Acreedor.empresa_id == empresa_id).first()
    if not acreedor:
        raise HTTPException(status_code=404, detail="Acreedor no encontrado")

    if data.monto_prestamo <= 0 or data.plazo_meses <= 0:
        raise HTTPException(status_code=400, detail="Monto y plazo deben ser mayores a cero")

    fecha_inicio = datetime.now(TIMEZONE)
    if data.fecha_desembolso:
        try:
            fecha_inicio = datetime.fromisoformat(data.fecha_desembolso)
        except Exception:
            pass

    # Generación de la Tabla de Amortización Teórica
    P = data.monto_prestamo # centavos
    n = data.plazo_meses
    r = data.tasa_interes_anual / 100.0 # tasa anual decimal
    i = r / 12.0 # tasa mensual decimal

    cuotas_teoricas = []
    saldo_restante = P

    if data.tipo_amortizacion == "saldos_frances":
        # Sistema Francés: Cuota fija sobre saldos
        if i > 0:
            C_float = P * (i * ((1 + i) ** n)) / (((1 + i) ** n) - 1)
        else:
            C_float = P / n
        cuota_fija = round(C_float)

        for k in range(1, n + 1):
            if k == n:
                # Última cuota ajusta capital exacto al saldo restante
                interes_k = round(saldo_restante * i)
                capital_k = saldo_restante
                cuota_k = capital_k + interes_k
                saldo_restante = 0
            else:
                interes_k = round(saldo_restante * i)
                capital_k = cuota_fija - interes_k
                if capital_k > saldo_restante:
                    capital_k = saldo_restante
                cuota_k = capital_k + interes_k
                saldo_restante -= capital_k

            vencimiento = add_months(fecha_inicio, k)
            cuotas_teoricas.append({
                "numero_cuota": k,
                "fecha_vencimiento": vencimiento,
                "monto_cuota_teorica": cuota_k,
                "monto_capital_teorico": capital_k,
                "monto_interes_teorico": interes_k,
                "saldo_teorico": max(0, saldo_restante)
            })

    else: # interes_simple (Flat Rate)
        # Interés total = P * (r) * (n/12)
        interes_total = P * r * (n / 12.0)
        interes_cuota = round(interes_total / n)
        capital_cuota_base = round(P / n)

        for k in range(1, n + 1):
            if k == n:
                capital_k = saldo_restante
                saldo_restante = 0
            else:
                capital_k = capital_cuota_base
                saldo_restante -= capital_k

            cuota_k = capital_k + interes_cuota
            vencimiento = add_months(fecha_inicio, k)
            cuotas_teoricas.append({
                "numero_cuota": k,
                "fecha_vencimiento": vencimiento,
                "monto_cuota_teorica": cuota_k,
                "monto_capital_teorico": capital_k,
                "monto_interes_teorico": interes_cuota,
                "saldo_teorico": max(0, saldo_restante)
            })

    cuota_mensual_estimada = cuotas_teoricas[0]["monto_cuota_teorica"] if cuotas_teoricas else 0

    prestamo = PrestamoAcreedor(
        acreedor_id=data.acreedor_id,
        empresa_id=empresa_id,
        monto_prestamo=P,
        tasa_interes_anual=data.tasa_interes_anual,
        plazo_meses=n,
        tipo_amortizacion=data.tipo_amortizacion,
        fecha_desembolso=fecha_inicio,
        monto_cuota_mensual=cuota_mensual_estimada,
        saldo_pendiente=P,
        estado="activo",
        notas=data.notas
    )
    db.add(prestamo)
    db.flush()

    for c in cuotas_teoricas:
        cuota_db = CuotaAmortizacion(
            prestamo_id=prestamo.id,
            empresa_id=empresa_id,
            numero_cuota=c["numero_cuota"],
            fecha_vencimiento=c["fecha_vencimiento"],
            monto_cuota_teorica=c["monto_cuota_teorica"],
            monto_capital_teorico=c["monto_capital_teorico"],
            monto_interes_teorico=c["monto_interes_teorico"],
            saldo_teorico=c["saldo_teorico"],
            estado="pendiente"
        )
        db.add(cuota_db)

    # Actualizar saldo del acreedor
    acreedor.saldo_capital = (acreedor.saldo_capital or 0) + P

    # Registrar movimiento de desembolso
    mov = MovimientoAcreedor(
        acreedor_id=acreedor.id,
        empresa_id=empresa_id,
        tipo="PRESTAMO_RECIBIDO",
        monto_capital=P,
        monto_interes=0,
        monto_total=P,
        metodo_pago="transferencia",
        notas=f"Desembolso de Préstamo #{prestamo.id} ({data.tipo_amortizacion})",
        usuario_id=usuario_id
    )
    db.add(mov)
    db.flush()

    # Integración con Caja si hay sesión abierta
    sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
    if sesion:
        db.add(MovimientoCaja(
            sesion_caja_id=sesion.id,
            tipo="ingreso",
            metodo_pago="transferencia",
            monto=P,
            concepto=f"Desembolso Préstamo #{prestamo.id}: {acreedor.nombre}",
            referencia_tipo="acreedor",
            referencia_id=mov.id,
            usuario_id=usuario_id
        ))

    db.commit()
    db.refresh(prestamo)
    return {"id": prestamo.id, "mensaje": "Préstamo y tabla de amortización teórica creados exitosamente"}


@router.get("/prestamos")
def listar_prestamos(empresa_id: str, db: Session = Depends(get_db)):
    prestamos = db.query(PrestamoAcreedor).filter(PrestamoAcreedor.empresa_id == empresa_id).order_by(PrestamoAcreedor.id.desc()).all()
    resultado = []
    for p in prestamos:
        acreedor_nombre = p.acreedor.nombre if p.acreedor else "N/A"
        cuotas_pagadas = db.query(CuotaAmortizacion).filter(CuotaAmortizacion.prestamo_id == p.id, CuotaAmortizacion.estado == "pagado").count()
        resultado.append({
            "id": p.id,
            "acreedor_id": p.acreedor_id,
            "acreedor_nombre": acreedor_nombre,
            "monto_prestamo": p.monto_prestamo,
            "tasa_interes_anual": p.tasa_interes_anual,
            "plazo_meses": p.plazo_meses,
            "tipo_amortizacion": p.tipo_amortizacion,
            "fecha_desembolso": p.fecha_desembolso,
            "monto_cuota_mensual": p.monto_cuota_mensual,
            "saldo_pendiente": p.saldo_pendiente,
            "estado": p.estado,
            "cuotas_pagadas": cuotas_pagadas,
            "notas": p.notas
        })
    return resultado


@router.get("/prestamos/{prestamo_id}/tabla")
def obtener_tabla_amortizacion(prestamo_id: int, empresa_id: str, db: Session = Depends(get_db)):
    prestamo = db.query(PrestamoAcreedor).filter(PrestamoAcreedor.id == prestamo_id, PrestamoAcreedor.empresa_id == empresa_id).first()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    cuotas = db.query(CuotaAmortizacion).filter(CuotaAmortizacion.prestamo_id == prestamo_id).order_by(CuotaAmortizacion.numero_cuota).all()

    # Encontrar la siguiente cuota habilitada para pagar (la menor con estado 'pendiente')
    siguiente_cuota_num = None
    for c in cuotas:
        if c.estado == "pendiente":
            siguiente_cuota_num = c.numero_cuota
            break

    cuotas_formatted = []
    for c in cuotas:
        cuotas_formatted.append({
            "id": c.id,
            "numero_cuota": c.numero_cuota,
            "fecha_vencimiento": c.fecha_vencimiento,
            "monto_cuota_teorica": c.monto_cuota_teorica,
            "monto_capital_teorico": c.monto_capital_teorico,
            "monto_interes_teorico": c.monto_interes_teorico,
            "saldo_teorico": c.saldo_teorico,
            "estado": c.estado,
            "es_siguiente_a_pagar": (c.numero_cuota == siguiente_cuota_num),
            "fecha_pago_real": c.fecha_pago_real,
            "monto_pagado_real": c.monto_pagado_real,
            "metodo_pago": c.metodo_pago,
            "referencia": c.referencia,
            "notas": c.notas
        })

    return {
        "prestamo": {
            "id": prestamo.id,
            "acreedor_id": prestamo.acreedor_id,
            "acreedor_nombre": prestamo.acreedor.nombre if prestamo.acreedor else "N/A",
            "monto_prestamo": prestamo.monto_prestamo,
            "tasa_interes_anual": prestamo.tasa_interes_anual,
            "plazo_meses": prestamo.plazo_meses,
            "tipo_amortizacion": prestamo.tipo_amortizacion,
            "fecha_desembolso": prestamo.fecha_desembolso,
            "saldo_pendiente": prestamo.saldo_pendiente,
            "estado": prestamo.estado,
            "siguiente_cuota_num": siguiente_cuota_num
        },
        "cuotas": cuotas_formatted
    }


@router.post("/prestamos/{prestamo_id}/pagar-cuota/{numero_cuota}")
def pagar_cuota_prestamo(prestamo_id: int, numero_cuota: int, empresa_id: str, usuario_id: int, data: PagarCuotaRequest, db: Session = Depends(get_db)):
    prestamo = db.query(PrestamoAcreedor).filter(PrestamoAcreedor.id == prestamo_id, PrestamoAcreedor.empresa_id == empresa_id).first()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    target_cuota = db.query(CuotaAmortizacion).filter(CuotaAmortizacion.prestamo_id == prestamo_id, CuotaAmortizacion.numero_cuota == numero_cuota).first()
    if not target_cuota:
        raise HTTPException(status_code=404, detail=f"Cuota #{numero_cuota} no encontrada")

    if target_cuota.estado == "pagado":
        raise HTTPException(status_code=400, detail=f"La cuota #{numero_cuota} ya ha sido pagada previamente.")

    # ── VALIDACIÓN DE CORRELATIVIDAD DE CUOTAS ────────────────────────────────
    # Verificar si existe alguna cuota anterior no pagada
    cuota_anterior_pendiente = db.query(CuotaAmortizacion).filter(
        CuotaAmortizacion.prestamo_id == prestamo_id,
        CuotaAmortizacion.numero_cuota < numero_cuota,
        CuotaAmortizacion.estado != "pagado"
    ).order_by(CuotaAmortizacion.numero_cuota).first()

    if cuota_anterior_pendiente:
        raise HTTPException(
            status_code=400,
            detail=f"No puede pagar la cuota #{numero_cuota} porque la cuota #{cuota_anterior_pendiente.numero_cuota} aún está pendiente de pago."
        )

    # Procesar pago de la cuota
    fecha_pago = datetime.now(TIMEZONE)
    if data.fecha_pago:
        try:
            fecha_pago = datetime.fromisoformat(data.fecha_pago)
        except Exception:
            pass

    target_cuota.estado = "pagado"
    target_cuota.fecha_pago_real = fecha_pago
    target_cuota.monto_pagado_real = target_cuota.monto_cuota_teorica
    target_cuota.metodo_pago = data.metodo_pago or "efectivo"
    target_cuota.referencia = data.referencia
    target_cuota.notas = data.notas
    target_cuota.usuario_id = usuario_id

    # Actualizar saldos del préstamo y del acreedor
    prestamo.saldo_pendiente = max(0, prestamo.saldo_pendiente - target_cuota.monto_capital_teorico)
    if prestamo.saldo_pendiente == 0:
        prestamo.estado = "liquidado"

    if prestamo.acreedor:
        prestamo.acreedor.saldo_capital = max(0, (prestamo.acreedor.saldo_capital or 0) - target_cuota.monto_capital_teorico)

    # Registrar movimiento de acreedor
    mov = MovimientoAcreedor(
        acreedor_id=prestamo.acreedor_id,
        empresa_id=empresa_id,
        tipo="PAGO_MIXTO",
        monto_capital=target_cuota.monto_capital_teorico,
        monto_interes=target_cuota.monto_interes_teorico,
        monto_total=target_cuota.monto_cuota_teorica,
        metodo_pago=data.metodo_pago or "efectivo",
        referencia=data.referencia,
        notas=f"Pago de Cuota #{numero_cuota}/{prestamo.plazo_meses} de Préstamo #{prestamo.id}",
        usuario_id=usuario_id
    )
    db.add(mov)
    db.flush()

    # Integración automática con Movimiento de Caja (Egreso)
    sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
    if sesion:
        db.add(MovimientoCaja(
            sesion_caja_id=sesion.id,
            tipo="egreso",
            metodo_pago=data.metodo_pago or "efectivo",
            monto=target_cuota.monto_cuota_teorica,
            concepto=f"Pago Cuota #{numero_cuota} Préstamo #{prestamo.id}: {prestamo.acreedor.nombre if prestamo.acreedor else ''}",
            referencia_tipo="acreedor",
            referencia_id=mov.id,
            usuario_id=usuario_id
        ))

    db.commit()
    db.refresh(target_cuota)
    return {
        "mensaje": f"Cuota #{numero_cuota} pagada exitosamente",
        "cuota_id": target_cuota.id,
        "saldo_prestamo_restante": prestamo.saldo_pendiente
    }

