from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import pytz
from database import Base

TIMEZONE = pytz.timezone("America/El_Salvador")

# ==========================================
# MODELOS BASE SAAS (MULTIEMPRESA)
# ==========================================

class Empresa(Base):
    __tablename__ = "empresas"
    
    id_empresa = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    nit = Column(String(50))
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id_empresa"), nullable=False)
    
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    rol = Column(String(50), default="admin") # admin, cajera, auditor
    
    # 2FA
    is_2fa_enabled = Column(Boolean, default=False)
    secret_2fa = Column(String(100), nullable=True)
    
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))

class Cliente(Base):
    __tablename__ = "clientes"
    
    id_cliente = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(Integer, index=True, nullable=False) # SaaS Multi-Tenant
    
    codigo = Column(String(50))
    nombre = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200))
    nit = Column(String(20))
    dui = Column(String(20))
    email = Column(String(100))
    
    limite_credito = Column(Integer, default=0)   # Dinero en centavos
    saldo_pendiente = Column(Integer, default=0)
    
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    
    facturas = relationship("Factura", back_populates="cliente")


class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(Integer, index=True, nullable=False) # SaaS Multi-Tenant
    
    codigo = Column(String(50), nullable=False)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    
    precio_venta = Column(Integer, default=0) # Centavos o 4 decimales
    costo_promedio = Column(Integer, default=0)
    stock = Column(Float, default=0.0)
    
    activo = Column(Boolean, default=True)
    
    inventarios = relationship("Inventario", back_populates="producto")


class Factura(Base):
    __tablename__ = "facturas"
    
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, index=True, nullable=False) # SaaS Multi-Tenant
    usuario_id = Column(Integer, nullable=False) # Auditora
    
    numero = Column(String(30), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    
    fecha_emision = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE), nullable=False)
    
    subtotal = Column(Integer, nullable=False, default=0)
    iva = Column(Integer, nullable=False, default=0)
    total = Column(Integer, nullable=False, default=0)
    
    estado = Column(String(20), default="emitida") # emitida, anulada
    
    cliente = relationship("Cliente", back_populates="facturas")
    items = relationship("ItemFactura", back_populates="factura", cascade="all, delete-orphan")


class ItemFactura(Base):
    __tablename__ = "items_factura"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Integer, nullable=False)
    subtotal = Column(Integer, nullable=False)
    
    factura = relationship("Factura", back_populates="items")
    producto = relationship("Producto")


class Inventario(Base):
    __tablename__ = "inventarios"
    
    id_inventario = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(Integer, index=True, nullable=False) # SaaS Multi-Tenant
    
    producto_id = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    tipo_movimiento = Column(String(20)) # entrada, salida, ajuste
    cantidad = Column(Float, nullable=False)
    stock_resultante = Column(Float, nullable=False)
    
    referencia = Column(String(100)) # ej: "FAC-1234"
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    
    producto = relationship("Producto", back_populates="inventarios")
