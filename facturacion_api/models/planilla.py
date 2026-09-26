from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, Date, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import pytz
from database import Base

TIMEZONE = pytz.timezone("America/El_Salvador")

class EmpleadoPlanilla(Base):
    __tablename__ = "empleados_planilla"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String(50), nullable=False, index=True)
    
    dui = Column(String(20), nullable=False, index=True)
    nit = Column(String(20), nullable=True)
    nup_afp = Column(String(20), nullable=True)
    isss_afiliacion = Column(String(20), nullable=True)
    
    primer_nombre = Column(String(50), nullable=False)
    segundo_nombre = Column(String(50), nullable=True)
    primer_apellido = Column(String(50), nullable=False)
    segundo_apellido = Column(String(50), nullable=True)
    
    fecha_nacimiento = Column(Date, nullable=True)
    genero = Column(String(10), default="M")
    
    cargo = Column(String(100), nullable=False, default="Colaborador")
    departamento = Column(String(100), default="Administrativo")
    salario_base = Column(Float, nullable=False, default=365.00)
    
    tipo_contrato = Column(String(50), default="PERMANENTE")
    fecha_ingreso = Column(Date, nullable=True)
    
    banco_nombre = Column(String(100), nullable=True, default="Banco Agrícola")
    numero_cuenta = Column(String(50), nullable=True)
    medio_pago = Column(String(50), default="TRANSFERENCIA")
    
    email = Column(String(100), nullable=True)
    telefono = Column(String(20), nullable=True)
    
    estado = Column(String(20), default="activo") # activo, inactivo
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))


class PeriodoPlanilla(Base):
    __tablename__ = "periodos_planilla"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String(50), nullable=False, index=True)
    
    codigo_periodo = Column(String(50), nullable=False) # Ej: PLANILLA-2026-09-Q2
    tipo_planilla = Column(String(30), default="MENSUAL") # MENSUAL, QUINCENAL, AGUINALDO
    
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    fecha_pago = Column(Date, nullable=True)
    
    estado = Column(String(30), default="abierta") # abierta, procesada, contabilizada
    
    total_bruto = Column(Float, default=0.0)
    total_isss_empleados = Column(Float, default=0.0)
    total_afp_empleados = Column(Float, default=0.0)
    total_isr_empleados = Column(Float, default=0.0)
    total_isss_patronal = Column(Float, default=0.0)
    total_afp_patronal = Column(Float, default=0.0)
    total_descuentos = Column(Float, default=0.0)
    total_neto_liquido = Column(Float, default=0.0)
    
    partida_contable_id = Column(String(50), nullable=True)
    fecha_procesamiento = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))


class BoletaPago(Base):
    __tablename__ = "boletas_pago"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String(50), nullable=False, index=True)
    periodo_id = Column(Integer, ForeignKey("periodos_planilla.id"), nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados_planilla.id"), nullable=False)
    
    salario_base = Column(Float, nullable=False)
    dias_trabajados = Column(Integer, default=15)
    horas_extra_monto = Column(Float, default=0.0)
    bonificaciones = Column(Float, default=0.0)
    comisiones = Column(Float, default=0.0)
    
    total_devengado = Column(Float, nullable=False)
    
    # Retenciones de Ley Empleado (SV)
    afp_empleado = Column(Float, default=0.0) # 7.25%
    isss_empleado = Column(Float, default=0.0) # 3.00%
    salario_gravable = Column(Float, default=0.0)
    isr_empleado = Column(Float, default=0.0) # Tabla MH
    
    # Aportes Patronales (SV)
    afp_patronal = Column(Float, default=0.0) # 8.75%
    isss_patronal = Column(Float, default=0.0) # 7.50%
    
    otros_descuentos = Column(Float, default=0.0)
    total_deducciones = Column(Float, nullable=False)
    
    salario_liquido = Column(Float, nullable=False)
    
    empleado = relationship("EmpleadoPlanilla")
    periodo = relationship("PeriodoPlanilla")


class SolicitudVacaciones(Base):
    __tablename__ = "vacaciones_empleado"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String(50), nullable=False, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados_planilla.id"), nullable=False)
    
    dias_vacaciones = Column(Integer, default=15)
    salario_diario = Column(Float, nullable=False)
    monto_vacaciones_ordinario = Column(Float, nullable=False)
    monto_recargo_30 = Column(Float, nullable=False) # 30% adicional por Ley SV
    total_vacaciones = Column(Float, nullable=False)
    
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estado = Column(String(20), default="APROBADA")
    
    empleado = relationship("EmpleadoPlanilla")


class RegistroAguinaldo(Base):
    __tablename__ = "aguinaldos_empleado"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String(50), nullable=False, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados_planilla.id"), nullable=False)
    
    anio = Column(Integer, nullable=False)
    anios_antiguedad = Column(Float, nullable=False)
    dias_aguinaldo = Column(Integer, nullable=False) # 15 dias (1-3 años), 19 dias (3-10 años), 21 dias (>10 años)
    monto_aguinaldo = Column(Float, nullable=False)
    
    monto_exento_isr = Column(Float, default=0.0) # Hasta 2 Salarios Mínimos exento
    monto_gravado_isr = Column(Float, default=0.0)
    
    empleado = relationship("EmpleadoPlanilla")
