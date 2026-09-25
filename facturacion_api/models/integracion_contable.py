from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from datetime import datetime
import pytz
from database import Base

TIMEZONE = pytz.timezone("America/El_Salvador")

class ConfiguracionIntegracionContable(Base):
    __tablename__ = "configuracion_integracion_contable"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False, unique=True)
    url_api_contable = Column(String(300), default="http://127.0.0.1:8000")
    api_key_empresa = Column(String(200), nullable=False)
    
    # Mapeo de Cuentas Contables por Defecto
    cuenta_caja_general = Column(String(50), nullable=True) # Ej: 110101
    cuenta_bancos = Column(String(50), nullable=True)       # Ej: 110201
    cuenta_iva_debito = Column(String(50), nullable=True)   # Ej: 210201
    cuenta_iva_credito = Column(String(50), nullable=True)  # Ej: 110601
    cuenta_cxc_clientes = Column(String(50), nullable=True) # Ej: 110301
    cuenta_cxp_proveedores = Column(String(50), nullable=True) # Ej: 210101
    cuenta_ventas_cf = Column(String(50), nullable=True)   # Ej: 410101
    cuenta_ventas_ccf = Column(String(50), nullable=True)  # Ej: 410102
    cuenta_inventario = Column(String(50), nullable=True)  # Ej: 110501
    cuenta_costo_ventas = Column(String(50), nullable=True)# Ej: 510101
    
    activo = Column(Boolean, default=True)
    fecha_actualizacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE), onupdate=lambda: datetime.now(TIMEZONE))


class BitacoraPartidaContable(Base):
    __tablename__ = "bitacora_partidas_contables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    
    # ccf_individual | resumen_diario_cf | compra_proveedor | pago_cxc | pago_cxp
    tipo_origen = Column(String(50), nullable=False)
    referencia_id = Column(String(100), nullable=True)
    fecha_partida = Column(String(10), nullable=False) # YYYY-MM-DD
    concepto = Column(String(300), nullable=False)
    
    payload_json = Column(JSON, nullable=False)
    
    # pendiente | enviado | error
    estado = Column(String(20), default="pendiente")
    mensaje_error = Column(Text, nullable=True)
    respuesta_contabilidad = Column(Text, nullable=True)
    
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    fecha_envio = Column(DateTime(timezone=True), nullable=True)
