import sys

with open("models/__init__.py", "r", encoding="utf-8") as f:
    code = f.read()

models = """
# ==========================================
# MÓDULO DE CAJA Y GASTOS
# ==========================================

class Caja(Base):
    __tablename__ = "cajas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    bodega_id = Column(Integer, ForeignKey("bodegas.id"), nullable=True)
    nombre = Column(String(100), nullable=False)
    activa = Column(Boolean, default=True)

    bodega = relationship("Bodega")
    sesiones = relationship("SesionCaja", back_populates="caja")

class SesionCaja(Base):
    __tablename__ = "sesiones_caja"

    id = Column(Integer, primary_key=True, autoincrement=True)
    caja_id = Column(Integer, ForeignKey("cajas.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    fecha_apertura = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    fecha_cierre = Column(DateTime(timezone=True), nullable=True)
    
    saldo_inicial = Column(Integer, default=0) # centavos
    estado = Column(String(20), default="abierta") # abierta | cerrada
    notas = Column(Text, nullable=True)
    
    caja = relationship("Caja", back_populates="sesiones")
    usuario = relationship("Usuario")
    movimientos = relationship("MovimientoCaja", back_populates="sesion")

class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sesion_caja_id = Column(Integer, ForeignKey("sesiones_caja.id"), nullable=False)
    
    tipo = Column(String(20), nullable=False) # ingreso | egreso
    metodo_pago = Column(String(50), default="efectivo") # efectivo | transferencia | tarjeta
    monto = Column(Integer, nullable=False) # centavos
    concepto = Column(String(200), nullable=False)
    
    referencia_tipo = Column(String(50), nullable=True) # factura | gasto | manual
    referencia_id = Column(Integer, nullable=True)
    
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    sesion = relationship("SesionCaja", back_populates="movimientos")
    usuario = relationship("Usuario")

class CategoriaGasto(Base):
    __tablename__ = "categorias_gasto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    
    gastos = relationship("Gasto", back_populates="categoria")

class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(String, index=True, nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias_gasto.id"), nullable=False)
    sesion_caja_id = Column(Integer, ForeignKey("sesiones_caja.id"), nullable=True)
    
    monto = Column(Integer, nullable=False)
    metodo_pago = Column(String(50), default="efectivo")
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.now(TIMEZONE))
    descripcion = Column(String(300), nullable=False)
    
    categoria = relationship("CategoriaGasto", back_populates="gastos")
    sesion = relationship("SesionCaja")

"""

if "class Caja(Base):" not in code:
    code = code + "\\n" + models
    with open("models/__init__.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("Modelos creados")

