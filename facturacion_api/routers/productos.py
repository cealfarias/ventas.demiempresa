from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from routers.kardex import registrar_movimiento
from models import Producto, Bodega, StockBodega, CategoriaProducto
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/productos", tags=["Productos"])

# ── Categorías de Producto Schemas ───────────────────────────────────────────

class CategoriaProductoBase(BaseModel):
    nombre: str
    codigo_prefijo: Optional[str] = None
    descripcion: Optional[str] = None
    cuenta_contable_ventas: Optional[str] = None
    cuenta_contable_inventario: Optional[str] = None
    cuenta_contable_costo: Optional[str] = None

class CategoriaProductoCreate(CategoriaProductoBase):
    pass

class CategoriaProductoResponse(CategoriaProductoBase):
    id: int
    empresa_id: str

    class Config:
        from_attributes = True


# ── Producto Schemas ──────────────────────────────────────────────────────────

class ProductoBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_venta: float
    costo_promedio: float = 0.0
    stock: float = 0.0
    categoria_id: Optional[int] = None
    subcategoria: Optional[str] = None
    marca: Optional[str] = None
    tipo_item: Optional[str] = "BIEN"
    unidad_medida: Optional[str] = "UNIDAD"

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id_producto: int
    empresa_id: str
    activo: bool
    categoria_nombre: Optional[str] = None
    categoria_prefijo: Optional[str] = None

    class Config:
        from_attributes = True

class ProductoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_venta: Optional[float] = None
    costo_promedio: Optional[float] = None
    stock: Optional[float] = None
    categoria_id: Optional[int] = None
    subcategoria: Optional[str] = None
    marca: Optional[str] = None
    tipo_item: Optional[str] = None
    unidad_medida: Optional[str] = None
    activo: Optional[bool] = None


# ── Endpoints Categorías ──────────────────────────────────────────────────────

@router.get("/categorias", response_model=List[CategoriaProductoResponse])
def listar_categorias_producto(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(CategoriaProducto).filter(CategoriaProducto.empresa_id == empresa_id).order_by(CategoriaProducto.nombre.asc()).all()

@router.post("/categorias", response_model=CategoriaProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_categoria_producto(empresa_id: str, cat: CategoriaProductoCreate, db: Session = Depends(get_db)):
    db_cat = CategoriaProducto(**cat.dict(), empresa_id=empresa_id)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.put("/categorias/{cat_id}", response_model=CategoriaProductoResponse)
def actualizar_categoria_producto(cat_id: int, empresa_id: str, cat: CategoriaProductoCreate, db: Session = Depends(get_db)):
    db_cat = db.query(CategoriaProducto).filter(CategoriaProducto.id == cat_id, CategoriaProducto.empresa_id == empresa_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for k, v in cat.dict(exclude_unset=True).items():
        setattr(db_cat, k, v)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categorias/{cat_id}")
def eliminar_categoria_producto(cat_id: int, empresa_id: str, db: Session = Depends(get_db)):
    db_cat = db.query(CategoriaProducto).filter(CategoriaProducto.id == cat_id, CategoriaProducto.empresa_id == empresa_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(db_cat)
    db.commit()
    return {"detail": "Categoría eliminada"}

@router.get("/siguiente-codigo")
def obtener_siguiente_codigo(empresa_id: str, categoria_id: Optional[int] = None, prefijo: Optional[str] = None, db: Session = Depends(get_db)):
    pref = (prefijo or "").strip().upper()
    if not pref and categoria_id:
        cat = db.query(CategoriaProducto).filter(CategoriaProducto.id == categoria_id, CategoriaProducto.empresa_id == empresa_id).first()
        if cat and cat.codigo_prefijo:
            pref = cat.codigo_prefijo.strip().upper()
    
    if not pref:
        pref = "PROD"
        
    prods = db.query(Producto.codigo).filter(Producto.empresa_id == empresa_id, Producto.codigo.ilike(f"{pref}-%")).all()
    max_num = 0
    for (cod,) in prods:
        try:
            num = int(cod.split("-")[-1])
            if num > max_num:
                max_num = num
        except Exception:
            pass
            
    siguiente_num = max_num + 1
    siguiente_codigo = f"{pref}-{siguiente_num:04d}"
    return {"codigo_sugerido": siguiente_codigo, "prefijo": pref}


# ── Endpoints Productos ───────────────────────────────────────────────────────

def _convertir_producto_response(p):
    res = ProductoResponse.from_orm(p)
    if p.categoria_obj:
        res.categoria_nombre = p.categoria_obj.nombre
        res.categoria_prefijo = p.categoria_obj.codigo_prefijo
    return res

@router.get("/", response_model=List[ProductoResponse])
def listar_productos(empresa_id: str, bodega_id: Optional[int] = None, categoria_id: Optional[int] = None, tipo_item: Optional[str] = None, db: Session = Depends(get_db)):
    bodega_target = None
    if bodega_id:
        bodega_target = db.query(Bodega).filter(Bodega.empresa_id == empresa_id, Bodega.id == bodega_id).first()
    if not bodega_target:
        bodega_target = db.query(Bodega).filter(Bodega.empresa_id == empresa_id, Bodega.es_principal == True).first()
    if not bodega_target:
        bodega_target = db.query(Bodega).filter(Bodega.empresa_id == empresa_id).first()

    query = db.query(Producto).filter(Producto.empresa_id == empresa_id, Producto.activo == True)

    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)
    if tipo_item:
        query = query.filter(Producto.tipo_item == tipo_item)

    productos = query.order_by(Producto.nombre.asc()).all()

    if bodega_target:
        stocks_bodega = {
            sb.producto_id: sb.stock_actual
            for sb in db.query(StockBodega).filter(
                StockBodega.empresa_id == empresa_id,
                StockBodega.bodega_id == bodega_target.id
            ).all()
        }
        for p in productos:
            if p.id_producto in stocks_bodega:
                p.stock = stocks_bodega[p.id_producto]

    return [_convertir_producto_response(p) for p in productos]

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(empresa_id: str, producto: ProductoCreate, db: Session = Depends(get_db)):
    db_producto = Producto(**producto.dict(), empresa_id=empresa_id)
    stock_inicial = db_producto.stock
    db_producto.stock = 0.0  # Se registrar via kardex
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    
    if stock_inicial > 0:
        bodega = db.query(Bodega).filter(Bodega.empresa_id == empresa_id, Bodega.es_principal == True).first()
        if not bodega:
            bodega = db.query(Bodega).filter(Bodega.empresa_id == empresa_id).first()
            
        if bodega:
            registrar_movimiento(
                db=db,
                empresa_id=empresa_id,
                bodega_id=bodega.id,
                producto_id=db_producto.id_producto,
                tipo_movimiento="AJUSTE_POSITIVO",
                cantidad=stock_inicial,
                costo_unitario=db_producto.costo_promedio,
                referencia_tipo="manual",
                notas="Saldo inicial"
            )
            db.commit()
            db.refresh(db_producto)
            
    return _convertir_producto_response(db_producto)

@router.put("/{id_producto}", response_model=ProductoResponse)
def actualizar_producto(id_producto: int, empresa_id: str, producto: ProductoUpdate, db: Session = Depends(get_db)):
    db_prod = db.query(Producto).filter(Producto.id_producto == id_producto, Producto.empresa_id == empresa_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = producto.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prod, key, value)
        
    db.commit()
    db.refresh(db_prod)
    return _convertir_producto_response(db_prod)

@router.delete("/{id_producto}")
def eliminar_producto(id_producto: int, empresa_id: str, db: Session = Depends(get_db)):
    db_prod = db.query(Producto).filter(Producto.id_producto == id_producto, Producto.empresa_id == empresa_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db_prod.activo = False
    db.commit()
    return {"detail": "Producto eliminado (marcado inactivo)"}

