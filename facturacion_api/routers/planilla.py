from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List, Optional
from datetime import datetime, date
import io
import requests
from database import get_db
from models.planilla import EmpleadoPlanilla, PeriodoPlanilla, BoletaPago, SolicitudVacaciones, RegistroAguinaldo
from pydantic import BaseModel

router = APIRouter(prefix="/planilla", tags=["Recursos Humanos & Planillas (El Salvador)"])

# ---------------------------------------------------------------------------
# CÁLCULOS LEGALES EL SALVADOR
# ---------------------------------------------------------------------------
def calcular_isss_empleado(salario_bruto: float) -> float:
    """ISSS Empleado: 3.00% con tope de $1,000.00 de salario (Máx $30.00)"""
    salario_cotizable = min(salario_bruto, 1000.00)
    return round(salario_cotizable * 0.03, 2)

def calcular_afp_empleado(salario_bruto: float) -> float:
    """AFP Empleado: 7.25% con tope de $3,000.00 de salario (Máx $217.50)"""
    salario_cotizable = min(salario_bruto, 3000.00)
    return round(salario_cotizable * 0.0725, 2)

def calcular_isss_patronal(salario_bruto: float) -> float:
    """ISSS Patronal: 7.50% con tope de $1,000.00 (Máx $75.00)"""
    salario_cotizable = min(salario_bruto, 1000.00)
    return round(salario_cotizable * 0.075, 2)

def calcular_afp_patronal(salario_bruto: float) -> float:
    """AFP Patronal: 8.75% con tope de $3,000.00 (Máx $262.50)"""
    salario_cotizable = min(salario_bruto, 3000.00)
    return round(salario_cotizable * 0.0875, 2)

def calcular_isr_mensual_sv(salario_gravable: float) -> float:
    """Tabla Oficial Impuesto sobre la Renta Mensual - Ministerio de Hacienda SV"""
    if salario_gravable <= 472.00:
        return 0.00
    elif salario_gravable <= 895.24:
        return round(((salario_gravable - 472.00) * 0.10) + 17.67, 2)
    elif salario_gravable <= 2038.10:
        return round(((salario_gravable - 895.24) * 0.20) + 60.00, 2)
    else:
        return round(((salario_gravable - 2038.10) * 0.30) + 288.57, 2)


# ---------------------------------------------------------------------------
# SCHEMAS PYDANTIC
# ---------------------------------------------------------------------------
class EmpleadoSchema(BaseModel):
    dui: str
    nit: Optional[str] = None
    nup_afp: Optional[str] = None
    isss_afiliacion: Optional[str] = None
    primer_nombre: str
    segundo_nombre: Optional[str] = None
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    cargo: str = "Colaborador"
    departamento: str = "Administrativo"
    salario_base: float = 365.00
    tipo_contrato: str = "PERMANENTE"
    fecha_ingreso: Optional[date] = None
    banco_nombre: Optional[str] = "Banco Agrícola"
    numero_cuenta: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None

class ProcesarPlanillaSchema(BaseModel):
    codigo_periodo: str
    tipo_planilla: str = "MENSUAL" # MENSUAL, QUINCENAL
    fecha_inicio: date
    fecha_fin: date
    fecha_pago: Optional[date] = None


# ---------------------------------------------------------------------------
# ENDPOINTS GESTIÓN DE EMPLEADOS
# ---------------------------------------------------------------------------
@router.get("/empleados")
def listar_empleados(empresa_id: str, db: Session = Depends(get_db)):
    """Obtiene el listado activo de empleados de la empresa."""
    return db.query(EmpleadoPlanilla).filter(
        EmpleadoPlanilla.empresa_id == empresa_id,
        EmpleadoPlanilla.estado == "activo"
    ).order_by(EmpleadoPlanilla.primer_apellido.asc()).all()

@router.post("/empleados")
def crear_empleado(empresa_id: str, datos: EmpleadoSchema, db: Session = Depends(get_db)):
    """Registra un nuevo empleado en el expediente digital de RRHH."""
    nuevo = EmpleadoPlanilla(
        empresa_id=empresa_id,
        **datos.dict()
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ---------------------------------------------------------------------------
# ENDPOINTS PROCESAMIENTO DE PLANILLA Y NÓMINA
# ---------------------------------------------------------------------------
@router.get("/periodos")
def listar_periodos_planilla(empresa_id: str, db: Session = Depends(get_db)):
    """Lista los periodos de planilla procesados o abiertos."""
    return db.query(PeriodoPlanilla).filter(
        PeriodoPlanilla.empresa_id == empresa_id
    ).order_by(PeriodoPlanilla.id.desc()).all()

@router.post("/procesar-periodo")
def procesar_planilla(empresa_id: str, payload: ProcesarPlanillaSchema, db: Session = Depends(get_db)):
    """
    Procesa y liquida automáticamente la nómina del periodo para todos los empleados activos.
    Aplica deducciones de ISSS (3%), AFP (7.25%) e ISR según Tabla Oficial MH.
    Calcula aportes patronales ISSS (7.5%) y AFP (8.75%).
    """
    empleados = db.query(EmpleadoPlanilla).filter(
        EmpleadoPlanilla.empresa_id == empresa_id,
        EmpleadoPlanilla.estado == "activo"
    ).all()

    if not empleados:
        raise HTTPException(status_code=400, detail="No hay empleados activos para procesar la planilla.")

    # Crear periodo
    periodo = PeriodoPlanilla(
        empresa_id=empresa_id,
        codigo_periodo=payload.codigo_periodo,
        tipo_planilla=payload.tipo_planilla,
        fecha_inicio=payload.fecha_inicio,
        fecha_fin=payload.fecha_fin,
        fecha_pago=payload.fecha_pago or payload.fecha_fin,
        estado="procesada"
    )
    db.add(periodo)
    db.flush()

    tot_bruto = 0.0
    tot_isss_emp = 0.0
    tot_afp_emp = 0.0
    tot_isr_emp = 0.0
    tot_isss_pat = 0.0
    tot_afp_pat = 0.0
    tot_neto = 0.0

    factor_salario = 0.5 if payload.tipo_planilla == "QUINCENAL" else 1.0

    for emp in empleados:
        salario_devengado = round(emp.salario_base * factor_salario, 2)
        isss_e = calcular_isss_empleado(salario_devengado)
        afp_e = calcular_afp_empleado(salario_devengado)
        
        sal_gravable = round(salario_devengado - isss_e - afp_e, 2)
        isr_e = calcular_isr_mensual_sv(sal_gravable * (2.0 if payload.tipo_planilla == "QUINCENAL" else 1.0))
        if payload.tipo_planilla == "QUINCENAL":
            isr_e = round(isr_e / 2.0, 2)

        isss_p = calcular_isss_patronal(salario_devengado)
        afp_p = calcular_afp_patronal(salario_devengado)

        deducciones = round(isss_e + afp_e + isr_e, 2)
        liquido = round(salario_devengado - deducciones, 2)

        boleta = BoletaPago(
            empresa_id=empresa_id,
            periodo_id=periodo.id,
            empleado_id=emp.id,
            salario_base=emp.salario_base,
            dias_trabajados=15 if payload.tipo_planilla == "QUINCENAL" else 30,
            total_devengado=salario_devengado,
            afp_empleado=afp_e,
            isss_empleado=isss_e,
            salario_gravable=sal_gravable,
            isr_empleado=isr_e,
            afp_patronal=afp_p,
            isss_patronal=isss_p,
            total_deducciones=deducciones,
            salario_liquido=liquido
        )
        db.add(boleta)

        tot_bruto += salario_devengado
        tot_isss_emp += isss_e
        tot_afp_emp += afp_e
        tot_isr_emp += isr_e
        tot_isss_pat += isss_p
        tot_afp_pat += afp_p
        tot_neto += liquido

    periodo.total_bruto = round(tot_bruto, 2)
    periodo.total_isss_empleados = round(tot_isss_emp, 2)
    periodo.total_afp_empleados = round(tot_afp_emp, 2)
    periodo.total_isr_empleados = round(tot_isr_emp, 2)
    periodo.total_isss_patronal = round(tot_isss_pat, 2)
    periodo.total_afp_patronal = round(tot_afp_pat, 2)
    periodo.total_descuentos = round(tot_isss_emp + tot_afp_emp + tot_isr_emp, 2)
    periodo.total_neto_liquido = round(tot_neto, 2)

    db.commit()
    db.refresh(periodo)
    return periodo

@router.get("/boletas/{periodo_id}")
def obtener_boletas_periodo(periodo_id: int, empresa_id: str, db: Session = Depends(get_db)):
    """Devuelve las boletas de pago generadas para un periodo."""
    return db.query(BoletaPago).filter(
        BoletaPago.periodo_id == periodo_id,
        BoletaPago.empresa_id == empresa_id
    ).all()


# ---------------------------------------------------------------------------
# ENDPOINT INTEGRACIÓN CONTABLE AUTOMÁTICA
# ---------------------------------------------------------------------------
@router.post("/contabilizar/{periodo_id}")
def contabilizar_planilla(periodo_id: int, empresa_id: str, db: Session = Depends(get_db)):
    """
    Genera automáticamente la Partida Contable Doble de Nómina y la transmite al módulo de Contabilidad.
    """
    periodo = db.query(PeriodoPlanilla).filter(
        PeriodoPlanilla.id == periodo_id,
        PeriodoPlanilla.empresa_id == empresa_id
    ).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Periodo no encontrado")

    CONTA_URL = "https://conta-demiempresa.onrender.com"
    api_key = f"auto_{empresa_id}"

    # Asignación de Partida Doble Nómina
    # Cargo (Debe): Gastos de Sueldos (Bruto) + Gastos ISSS Patronal + Gastos AFP Patronal
    # Abono (Haber): Retenciones por Pagar (ISSS, AFP, ISR) + Sueldos por Pagar / Bancos
    lineas = [
        {"cuenta_codigo": "510101", "cuenta_nombre": "Gastos de Sueldos y Salarios", "concepto": f"Nómina {periodo.codigo_periodo}", "debe": periodo.total_bruto, "haber": 0.0},
        {"cuenta_codigo": "510102", "cuenta_nombre": "Gastos ISSS Patronal", "concepto": "Aporte ISSS Patronal", "debe": periodo.total_isss_patronal, "haber": 0.0},
        {"cuenta_codigo": "510103", "cuenta_nombre": "Gastos AFP Patronal", "concepto": "Aporte AFP Patronal", "debe": periodo.total_afp_patronal, "haber": 0.0},
        
        {"cuenta_codigo": "210201", "cuenta_nombre": "ISSS por Pagar (Empleado + Patronal)", "concepto": "Aportes ISSS", "debe": 0.0, "haber": round(periodo.total_isss_empleados + periodo.total_isss_patronal, 2)},
        {"cuenta_codigo": "210202", "cuenta_nombre": "AFP por Pagar (Empleado + Patronal)", "concepto": "Aportes AFP", "debe": 0.0, "haber": round(periodo.total_afp_empleados + periodo.total_afp_patronal, 2)},
        {"cuenta_codigo": "210203", "cuenta_nombre": "Retención ISR por Pagar", "concepto": "Retenciones Impuesto Renta", "debe": 0.0, "haber": periodo.total_isr_empleados},
        {"cuenta_codigo": "210101", "cuenta_nombre": "Sueldos y Salarios por Pagar (Líquido)", "concepto": "Líquido a Pagar Empleados", "debe": 0.0, "haber": periodo.total_neto_liquido}
    ]

    payload_partida = {
        "fecha": periodo.fecha_pago.strftime("%Y-%m-%d") if periodo.fecha_pago else datetime.now().strftime("%Y-%m-%d"),
        "concepto": f"Partida Automática de Nómina de Sueldos y Aportes — {periodo.codigo_periodo}",
        "origen_modulo": "PLANILLA",
        "documento_referencia": periodo.codigo_periodo,
        "lineas": lineas
    }

    try:
        resp = requests.post(
            f"{CONTA_URL}/api/v1/integracion/webhook/partida",
            json=payload_partida,
            headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            timeout=10
        )
        if resp.status_code in [200, 201]:
            periodo.estado = "contabilizada"
            periodo.partida_contable_id = resp.json().get("partida_id", "OK")
            db.commit()
            return {"status": "OK", "mensaje": "Partida Contable de Nómina registrada exitosamente en Contabilidad."}
        else:
            raise HTTPException(status_code=400, detail=f"Contabilidad rechazó la partida: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo conectar con el servicio contable: {str(e)}")


# ---------------------------------------------------------------------------
# ENDPOINTS EXPORTACIONES OFICIALES (ISSS & AFP EL SALVADOR)
# ---------------------------------------------------------------------------
@router.get("/exportar/isss-txt")
def exportar_isss_txt(periodo_id: int, empresa_id: str, db: Session = Depends(get_db)):
    """Exporta el archivo de Planilla Única ISSS en formato oficial OIR."""
    periodo = db.query(PeriodoPlanilla).filter(PeriodoPlanilla.id == periodo_id, PeriodoPlanilla.empresa_id == empresa_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Periodo no encontrado")

    boletas = db.query(BoletaPago).filter(BoletaPago.periodo_id == periodo_id).all()
    
    lineas = []
    num_patronal = "000000000"

    for b in boletas:
        emp = b.empleado
        if emp:
            dui_clean = emp.dui.replace("-", "").strip()
            nombre = f"{emp.primer_nombre} {emp.segundo_nombre or ''} {emp.primer_apellido} {emp.segundo_apellido or ''}".strip().upper()
            salario = f"{b.total_devengado:.2f}"
            dias = str(b.dias_trabajados or 15)
            isss = f"{b.isss_empleado:.2f}"
            lineas.append(f"{num_patronal}|{dui_clean}|{nombre}|{salario}|{dias}|{isss}")

    content = "\r\n".join(lineas)
    filename = f"Planilla_ISSS_{periodo.codigo_periodo}.txt"
    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/exportar/afp-csv")
def exportar_afp_csv(periodo_id: int, empresa_id: str, db: Session = Depends(get_db)):
    """Exporta el archivo de Cotizaciones AFP (Crecer / Confia) en formato CSV oficial."""
    periodo = db.query(PeriodoPlanilla).filter(PeriodoPlanilla.id == periodo_id, PeriodoPlanilla.empresa_id == empresa_id).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Periodo no encontrado")

    boletas = db.query(BoletaPago).filter(BoletaPago.periodo_id == periodo_id).all()
    
    lineas = ["NUP,DUI,NOMBRE_EMPLEADO,SALARIO_DEVENGADO,COTIZACION_EMPLEADO_AFP,COTIZACION_PATRONAL_AFP"]

    for b in boletas:
        emp = b.empleado
        if emp:
            nup = emp.nup_afp or "000000000000"
            dui = emp.dui or ""
            nombre = f"{emp.primer_nombre} {emp.primer_apellido}".upper()
            salario = f"{b.total_devengado:.2f}"
            afp_e = f"{b.afp_empleado:.2f}"
            afp_p = f"{b.afp_patronal:.2f}"
            lineas.append(f'"{nup}","{dui}","{nombre}",{salario},{afp_e},{afp_p}')

    content = "\n".join(lineas)
    filename = f"Planilla_AFP_{periodo.codigo_periodo}.csv"
    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
