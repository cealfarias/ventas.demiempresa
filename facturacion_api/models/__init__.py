from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import pytz
from database import Base

TIMEZONE = pytz.timezone("America/El_Salvador")

# ==========================================
# MODELOS BASE SAAS (MULTIEMPRESA) - ALINEADOS CON DB GLOBAL
# ==========================================

class Empresa(Base):
    __tablename__ = "empresas"
    
    id = Column(String, primary_key=True)
    razon_social = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200))
    nit = Column(String(50))
    nrc = Column(String(50))
    giro = Column(String(200))
    normativa = Column(String(100))
    usuario_creacion = Column(String(100))
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    usuario_modificacion = Column(String(100))
    fecha_modificacion = Column(DateTime(timezone=True))
    terminal_ip = Column(String(50))

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    rol = Column(String(50), default="admin") # admin, cajera, auditor
    
    # 2FA
    is_2fa_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(100), nullable=True)
    
    is_active = Column(Boolean, default=True)
    usuario_creacion = Column(String(100))
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    usuario_modificacion = Column(String(100))
    fecha_modificacion = Column(DateTime(timezone=True))
    terminal_ip = Column(String(50))


class Cliente(Base):
    __tablename__ = "clientes"
    
    id_cliente = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False) # SaaS Multi-Tenant (UUID)
    
    codigo = Column(String(50))
    nombre = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200))
    nit = Column(String(20))
    nrc = Column(String(20))
    dui = Column(String(20))
    email = Column(String(100))
    telefono = Column(String(20))
    direccion = Column(String(300))
    
    # DTE Fields
    es_gran_contribuyente = Column(Boolean, default=False)
    actividad_economica_cod = Column(String(10)) # CAT-019
    
    limite_credito = Column(Integer, default=0)   # Dinero en centavos
    saldo_pendiente = Column(Integer, default=0)
    
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    
    facturas = relationship("Factura", back_populates="cliente")
    cuentas_cobrar = relationship("CuentaPorCobrar", back_populates="cliente")


class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False) # SaaS Multi-Tenant (UUID)
    
    codigo = Column(String(50), nullable=False)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    imagen_url = Column(String(500), nullable=True)
    
    precio_venta = Column(Integer, default=0) # Centavos o 4 decimales
    costo_promedio = Column(Integer, default=0)
    stock = Column(Float, default=0.0)
    
    activo = Column(Boolean, default=True)
    
    kardex = relationship("Kardex", back_populates="producto")


class Factura(Base):
    __tablename__ = "facturas"
    
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(String, index=True, nullable=False) # SaaS Multi-Tenant (UUID)
    usuario_id = Column(Integer, nullable=False) # Cajero/Vendedor
    
    numero = Column(String(30), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    bodega_salida_id = Column(Integer, ForeignKey("bodegas.id"), nullable=True)
    
    # Documento y DTE
    tipo_doc = Column(String(20), default="FACTURA") # FACTURA | CCF | EXPORTACION
    condicion_operacion = Column(String(20), default="CONTADO") # CONTADO | CREDITO
    
    # DTE tracking (Ministerio de Hacienda)
    codigo_generacion = Column(String(100)) # UUID MH
    numero_control = Column(String(100))
    sello_recepcion = Column(String(200))
    estado_dte = Column(String(20), default="pendiente") # pendiente | procesado | rechazado
    json_firmado = Column(Text)
    
    fecha_emision = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE), nullable=False)
    
    subtotal = Column(Integer, nullable=False, default=0)
    iva = Column(Integer, nullable=False, default=0)
    total = Column(Integer, nullable=False, default=0)
    
    estado = Column(String(20), default="emitida") # emitida, anulada
    
    cliente = relationship("Cliente", back_populates="facturas")
    items = relationship("ItemFactura", back_populates="factura", cascade="all, delete-orphan")
    bodega_salida = relationship("Bodega")
    cuentas_cobrar = relationship("CuentaPorCobrar", back_populates="factura")


class ItemFactura(Base):
    __tablename__ = "items_factura"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    
    cantidad = Column(Float, nullable=False)
    precio_unitario = Column(Integer, nullable=False)
    subtotal = Column(Integer, nullable=False)
    
    factura = relationship("Factura", back_populates="items")
    producto = relationship("Producto")


class Inventario(Base):
    """Mantenido por compatibilidad con datos existentes. Reemplazado por Kardex."""
    __tablename__ = "inventarios"
    
    id_inventario = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    tipo_movimiento = Column(String(20))
    cantidad = Column(Float, nullable=False)
    stock_resultante = Column(Float, nullable=False)
    referencia = Column(String(100))
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    producto = relationship("Producto")


# ==========================================
# MÓDULO DE ALMACÉN — MULTI-BODEGA
# ==========================================

class Bodega(Base):
    __tablename__ = "bodegas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)

    codigo = Column(String(20), nullable=False)
    nombre = Column(String(200), nullable=False)
    ubicacion = Column(String(300))
    responsable_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    es_principal = Column(Boolean, default=False)
    activa = Column(Boolean, default=True)

    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))

    stock = relationship("StockBodega", back_populates="bodega", cascade="all, delete-orphan")
    kardex = relationship("Kardex", back_populates="bodega")
    responsable = relationship("Usuario")


class StockBodega(Base):
    """Saldo actual de cada producto en cada bodega (tabla de posiciones)."""
    __tablename__ = "stock_bodega"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    bodega_id = Column(Integer, ForeignKey("bodegas.id"), nullable=False)

    stock_actual = Column(Float, nullable=False, default=0.0)
    costo_promedio = Column(Integer, nullable=False, default=0)   # centavos

    __table_args__ = (
        UniqueConstraint("empresa_id", "producto_id", "bodega_id", name="uq_stock_producto_bodega"),
    )

    producto = relationship("Producto")
    bodega = relationship("Bodega", back_populates="stock")


class Kardex(Base):
    """Registro histórico de todos los movimientos de inventario."""
    __tablename__ = "kardex"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    bodega_id = Column(Integer, ForeignKey("bodegas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)

    # Tipo: ENTRADA_COMPRA | SALIDA_VENTA | AJUSTE_POSITIVO | AJUSTE_NEGATIVO
    tipo_movimiento = Column(String(30), nullable=False)

    # Documento origen que causó el movimiento
    referencia_tipo = Column(String(30))   # orden_compra | factura | despacho | manual
    referencia_id = Column(Integer)        # ID del documento origen

    cantidad = Column(Float, nullable=False)
    costo_unitario = Column(Integer, nullable=False, default=0)  # centavos al momento
    costo_total = Column(Integer, nullable=False, default=0)     # centavos

    # Snapshot de existencias para auditoría
    stock_anterior = Column(Float, nullable=False, default=0.0)
    stock_resultante = Column(Float, nullable=False, default=0.0)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    notas = Column(String(300))

    bodega = relationship("Bodega", back_populates="kardex")
    producto = relationship("Producto", back_populates="kardex")
    usuario = relationship("Usuario")


# ==========================================
# MÓDULO DE PROVEEDORES Y COMPRAS
# ==========================================

class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)

    codigo = Column(String(20))
    nombre = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200))
    nit = Column(String(20))
    nrc = Column(String(20))
    es_gran_contribuyente = Column(Boolean, default=False)
    email = Column(String(100))
    telefono = Column(String(20))
    direccion = Column(String(300))
    contacto_nombre = Column(String(150))
    contacto_telefono = Column(String(20))

    limite_credito = Column(Integer, default=0)    # centavos
    saldo_pendiente = Column(Integer, default=0)   # centavos

    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))

    ordenes = relationship("OrdenCompra", back_populates="proveedor")
    cuentas_pagar = relationship("CuentaPorPagar", back_populates="proveedor")


class OrdenCompra(Base):
    __tablename__ = "ordenes_compra"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    numero = Column(String(30), nullable=False)        # OC-2025-0001
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)

    tipo_doc = Column(String(20), default="CCF")       # CCF | FACTURA_CONSUMIDOR | MANUAL
    # Importación DTE del proveedor
    json_dte_proveedor = Column(Text)
    codigo_generacion_proveedor = Column(String(100))
    sello_recepcion_proveedor = Column(String(200))

    subtotal = Column(Integer, default=0)              # centavos
    iva = Column(Integer, default=0)
    total = Column(Integer, default=0)

    fecha_emision = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    fecha_esperada_entrega = Column(DateTime(timezone=True))

    # borrador | enviada | recibida_parcial | recibida | anulada
    estado = Column(String(20), default="borrador")
    bodega_destino_id = Column(Integer, ForeignKey("bodegas.id"), nullable=True)
    notas = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))

    proveedor = relationship("Proveedor", back_populates="ordenes")
    detalles = relationship("DetalleOrdenCompra", back_populates="orden", cascade="all, delete-orphan")
    cuentas_pagar = relationship("CuentaPorPagar", back_populates="orden")
    bodega_destino = relationship("Bodega")
    usuario = relationship("Usuario")


class DetalleOrdenCompra(Base):
    __tablename__ = "detalles_orden_compra"

    id = Column(Integer, primary_key=True, autoincrement=True)
    orden_compra_id = Column(Integer, ForeignKey("ordenes_compra.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)

    cantidad_pedida = Column(Float, nullable=False)
    cantidad_recibida = Column(Float, default=0.0)     # se actualiza en recepcion
    precio_unitario = Column(Integer, nullable=False)  # centavos
    subtotal = Column(Integer, nullable=False)         # centavos

    orden = relationship("OrdenCompra", back_populates="detalles")
    producto = relationship("Producto")


class CuentaPorPagar(Base):
    __tablename__ = "cuentas_pagar"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    orden_compra_id = Column(Integer, ForeignKey("ordenes_compra.id"), nullable=True)

    monto_original = Column(Integer, nullable=False)   # centavos
    monto_pendiente = Column(Integer, nullable=False)  # centavos
    fecha_vencimiento = Column(DateTime(timezone=True))

    # pendiente | parcial | pagada | vencida
    estado = Column(String(20), default="pendiente")
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))

    proveedor = relationship("Proveedor", back_populates="cuentas_pagar")
    orden = relationship("OrdenCompra", back_populates="cuentas_pagar")
    pagos = relationship("PagoCxP", back_populates="cuenta", cascade="all, delete-orphan")


class PagoCxP(Base):
    __tablename__ = "pagos_cxp"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cuenta_pagar_id = Column(Integer, ForeignKey("cuentas_pagar.id"), nullable=False)
    monto = Column(Integer, nullable=False)            # centavos
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    metodo_pago = Column(String(30), default="efectivo")  # efectivo|transferencia|cheque|deposito
    referencia = Column(String(100))
    notas = Column(String(300))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    cuenta = relationship("CuentaPorPagar", back_populates="pagos")
    usuario = relationship("Usuario")


# ==========================================
# MÓDULO DE VENTAS Y CUENTAS POR COBRAR
# ==========================================

class CuentaPorCobrar(Base):
    __tablename__ = "cuentas_cobrar"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=True)

    monto_original = Column(Integer, nullable=False)   # centavos
    monto_pendiente = Column(Integer, nullable=False)  # centavos
    fecha_vencimiento = Column(DateTime(timezone=True))

    # pendiente | parcial | pagada | vencida
    estado = Column(String(20), default="pendiente")
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))

    cliente = relationship("Cliente", back_populates="cuentas_cobrar")
    factura = relationship("Factura", back_populates="cuentas_cobrar")
    pagos = relationship("PagoCxC", back_populates="cuenta", cascade="all, delete-orphan")


class PagoCxC(Base):
    __tablename__ = "pagos_cxc"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cuenta_cobrar_id = Column(Integer, ForeignKey("cuentas_cobrar.id"), nullable=False)
    monto = Column(Integer, nullable=False)            # centavos
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    metodo_pago = Column(String(30), default="efectivo")
    referencia = Column(String(100))
    notas = Column(String(300))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    cuenta = relationship("CuentaPorCobrar", back_populates="pagos")
    usuario = relationship("Usuario")


# ==========================================
# MÓDULO DE INTEGRACIÓN DTE (MINISTERIO DE HACIENDA)
# ==========================================

class ConfiguracionDTE(Base):
    __tablename__ = "configuracion_dte"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False, unique=True) # 1 a 1 con la Empresa

    # Datos del Emisor
    nit = Column(String(20))
    nrc = Column(String(20))
    nombre_comercial = Column(String(200))
    actividad_economica_cod = Column(String(10)) # ej. 62010
    desc_actividad_economica = Column(String(200))
    direccion_municipio = Column(String(5))
    direccion_departamento = Column(String(5))
    direccion_complemento = Column(String(300))
    telefono = Column(String(20))
    email = Column(String(100))
    establecimiento_tipo = Column(String(10), default="02") # 02=Sucursal, etc.
    establecimiento_cod = Column(String(10), default="0000")

    # API Ministerio Hacienda
    ambiente = Column(String(2), default="00") # "00" = Pruebas, "01" = Produccion
    api_pwd = Column(String(100)) # Contraseña API MH

    # Certificado (Firma)
    certificado_p12_base64 = Column(Text)
    certificado_pwd = Column(String(100))

    # Control de Series y Correlativos (Simplificado)
    correlativo_factura = Column(Integer, default=0)
    correlativo_ccf = Column(Integer, default=0)

    activo = Column(Boolean, default=True)
    fecha_actualizacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE), onupdate=lambda: datetime.now(TIMEZONE))


# ==========================================
# MÓDULO DE DESPACHOS Y ENTREGAS
# ==========================================

class Despacho(Base):
    __tablename__ = "despachos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    
    numero = Column(String(30), nullable=False) # DESP-2025-0001
    
    motorista = Column(String(100))
    vehiculo_placa = Column(String(20))
    fecha_programada = Column(DateTime(timezone=True))
    fecha_salida = Column(DateTime(timezone=True))
    fecha_entrega = Column(DateTime(timezone=True))
    
    # programado | en_transito | entregado | cancelado
    estado = Column(String(20), default="programado")
    notas = Column(Text)
    
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    
    detalles = relationship("DetalleDespacho", back_populates="despacho", cascade="all, delete-orphan")
    usuario = relationship("Usuario")

class DetalleDespacho(Base):
    __tablename__ = "detalles_despacho"

    id = Column(Integer, primary_key=True, autoincrement=True)
    despacho_id = Column(Integer, ForeignKey("despachos.id"), nullable=False)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    
    direccion_entrega = Column(String(300))
    estado = Column(String(20), default="pendiente") # pendiente | entregado | fallido
    notas_entrega = Column(String(200))
    
    despacho = relationship("Despacho", back_populates="detalles")
    factura = relationship("Factura")
