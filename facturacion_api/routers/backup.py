from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import pytz
import json
import hmac
import hashlib

TIMEZONE = pytz.timezone("America/El_Salvador")
SECRET_KEY = "demiempresa-backup-hmac-secret-key-2026"

router = APIRouter(tags=["Backup y Recuperación"])

def serializar_valor(val):
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    return val

def generar_firma_hmac(datos_dict: dict) -> str:
    cadena_canonica = json.dumps(datos_dict, sort_keys=True, ensure_ascii=False, default=serializar_valor)
    return hmac.new(SECRET_KEY.encode('utf-8'), cadena_canonica.encode('utf-8'), hashlib.sha256).hexdigest()

def verificar_firma_hmac(datos_dict: dict, firma_esperada: str) -> bool:
    firma_calculada = generar_firma_hmac(datos_dict)
    return hmac.compare_digest(firma_calculada, firma_esperada)

# ── Endpoints de Exportación ───────────────────────────────────────────────────

@router.get("/export")
@router.get("/export/")
def exportar_respaldo(empresa_id: str, db: Session = Depends(get_db)):
    # Extraer entidades filtradas por empresa_id
    productos = db.query(models.Producto).filter(models.Producto.empresa_id == empresa_id).all()
    clientes = db.query(models.Cliente).filter(models.Cliente.empresa_id == empresa_id).all()
    proveedores = db.query(models.Proveedor).filter(models.Proveedor.empresa_id == empresa_id).all()
    bodegas = db.query(models.Bodega).filter(models.Bodega.empresa_id == empresa_id).all()
    cajas = db.query(models.Caja).filter(models.Caja.empresa_id == empresa_id).all()
    gastos_cats = db.query(models.CategoriaGasto).filter(models.CategoriaGasto.empresa_id == empresa_id).all()
    gastos = db.query(models.Gasto).filter(models.Gasto.empresa_id == empresa_id).all()
    acreedores = db.query(models.Acreedor).filter(models.Acreedor.empresa_id == empresa_id).all()
    movs_acreedores = db.query(models.MovimientoAcreedor).filter(models.MovimientoAcreedor.empresa_id == empresa_id).all()
    aportantes = db.query(models.Aportante).filter(models.Aportante.empresa_id == empresa_id).all()
    movs_aportantes = db.query(models.MovimientoAportante).filter(models.MovimientoAportante.empresa_id == empresa_id).all()
    prestamos = db.query(models.PrestamoAcreedor).filter(models.PrestamoAcreedor.empresa_id == empresa_id).all()
    cuotas = db.query(models.CuotaAmortizacion).filter(models.CuotaAmortizacion.empresa_id == empresa_id).all()

    datos_payload = {
        "empresa_id": empresa_id,
        "tablas": {
            "productos": [
                {
                    "id_producto": p.id_producto,
                    "codigo": p.codigo,
                    "nombre": p.nombre,
                    "descripcion": p.descripcion,
                    "precio_unitario": p.precio_unitario,
                    "costo_unitario": p.costo_unitario,
                    "stock": p.stock,
                    "categoria": p.categoria,
                    "activo": p.activo
                } for p in productos
            ],
            "clientes": [
                {
                    "id_cliente": c.id_cliente,
                    "nombre": c.nombre,
                    "dui_nit": c.dui_nit,
                    "nrc": c.nrc,
                    "email": c.email,
                    "telefono": c.telefono,
                    "direccion": c.direccion,
                    "limite_credito": c.limite_credito,
                    "activo": c.activo
                } for c in clientes
            ],
            "proveedores": [
                {
                    "id": pr.id,
                    "codigo": pr.codigo,
                    "nombre": pr.nombre,
                    "nombre_comercial": pr.nombre_comercial,
                    "nit": pr.nit,
                    "nrc": pr.nrc,
                    "email": pr.email,
                    "telefono": pr.telefono,
                    "direccion": pr.direccion,
                    "contacto_nombre": pr.contacto_nombre,
                    "contacto_telefono": pr.contacto_telefono,
                    "limite_credito": pr.limite_credito,
                    "activo": pr.activo
                } for pr in proveedores
            ],
            "bodegas": [
                {
                    "id": b.id,
                    "codigo": b.codigo,
                    "nombre": b.nombre,
                    "ubicacion": b.ubicacion,
                    "es_principal": b.es_principal,
                    "activa": b.activa
                } for b in bodegas
            ],
            "cajas": [
                {
                    "id": cj.id,
                    "codigo": cj.codigo,
                    "nombre": cj.nombre,
                    "ubicacion": cj.ubicacion,
                    "activa": cj.activa
                } for cj in cajas
            ],
            "gastos_categorias": [
                {
                    "id": gc.id,
                    "nombre": gc.nombre,
                    "descripcion": gc.descripcion
                } for gc in gastos_cats
            ],
            "gastos": [
                {
                    "id": g.id,
                    "categoria_id": g.categoria_id,
                    "monto": g.monto,
                    "fecha": serializar_valor(g.fecha),
                    "descripcion": g.descripcion,
                    "metodo_pago": g.metodo_pago
                } for g in gastos
            ],
            "acreedores": [
                {
                    "id": a.id,
                    "nombre": a.nombre,
                    "contacto_telefono": a.contacto_telefono,
                    "dui_nit": a.dui_nit,
                    "email": a.email,
                    "tasa_interes_anual": a.tasa_interes_anual,
                    "saldo_capital": a.saldo_capital,
                    "saldo_interes": a.saldo_interes,
                    "notas": a.notas,
                    "activo": a.activo
                } for a in acreedores
            ],
            "movimientos_acreedores": [
                {
                    "id": ma.id,
                    "acreedor_id": ma.acreedor_id,
                    "tipo": ma.tipo,
                    "monto_capital": ma.monto_capital,
                    "monto_interes": ma.monto_interes,
                    "monto_total": ma.monto_total,
                    "metodo_pago": ma.metodo_pago,
                    "referencia": ma.referencia,
                    "notas": ma.notas,
                    "fecha": serializar_valor(ma.fecha)
                } for ma in movs_acreedores
            ],
            "aportantes": [
                {
                    "id": ap.id,
                    "nombre": ap.nombre,
                    "tipo_relacion": ap.tipo_relacion,
                    "contacto_telefono": ap.contacto_telefono,
                    "dui_nit": ap.dui_nit,
                    "email": ap.email,
                    "total_aportado": ap.total_aportado,
                    "total_devuelto": ap.total_devuelto,
                    "saldo_pendiente": ap.saldo_pendiente,
                    "notas": ap.notas,
                    "activo": ap.activo
                } for ap in aportantes
            ],
            "movimientos_aportantes": [
                {
                    "id": map.id,
                    "aportante_id": map.aportante_id,
                    "tipo": map.tipo,
                    "monto": map.monto,
                    "metodo_pago": map.metodo_pago,
                    "referencia": map.referencia,
                    "notas": map.notas,
                    "fecha": serializar_valor(map.fecha)
                } for map in movs_aportantes
            ],
            "prestamos_acreedores": [
                {
                    "id": p.id,
                    "acreedor_id": p.acreedor_id,
                    "monto_prestamo": p.monto_prestamo,
                    "tasa_interes_anual": p.tasa_interes_anual,
                    "plazo_meses": p.plazo_meses,
                    "tipo_amortizacion": p.tipo_amortizacion,
                    "fecha_desembolso": serializar_valor(p.fecha_desembolso),
                    "monto_cuota_mensual": p.monto_cuota_mensual,
                    "saldo_pendiente": p.saldo_pendiente,
                    "estado": p.estado,
                    "notas": p.notas
                } for p in prestamos
            ],
            "cuotas_amortizacion": [
                {
                    "id": cu.id,
                    "prestamo_id": cu.prestamo_id,
                    "numero_cuota": cu.numero_cuota,
                    "fecha_vencimiento": serializar_valor(cu.fecha_vencimiento),
                    "monto_cuota_teorica": cu.monto_cuota_teorica,
                    "monto_capital_teorico": cu.monto_capital_teorico,
                    "monto_interes_teorico": cu.monto_interes_teorico,
                    "saldo_teorico": cu.saldo_teorico,
                    "estado": cu.estado,
                    "fecha_pago_real": serializar_valor(cu.fecha_pago_real),
                    "monto_pagado_real": cu.monto_pagado_real,
                    "metodo_pago": cu.metodo_pago,
                    "referencia": cu.referencia,
                    "notas": cu.notas
                } for cu in cuotas
            ]
        }
    }

    firma = generar_firma_hmac(datos_payload)

    return {
        "version": "1.0",
        "empresa_id": empresa_id,
        "fecha_generacion": datetime.now(TIMEZONE).isoformat(),
        "algoritmo_firma": "HMAC-SHA256",
        "firma_integridad": firma,
        "datos": datos_payload
    }


# ── Endpoints de Importación y Verificación ────────────────────────────────────

class BackupImportPayload(BaseModel):
    version: Optional[str] = "1.0"
    empresa_id: str
    fecha_generacion: Optional[str] = None
    algoritmo_firma: str
    firma_integridad: str
    datos: Dict[str, Any]


@router.post("/import")
@router.post("/import/")
def importar_respaldo(payload: BackupImportPayload, empresa_id: str, db: Session = Depends(get_db)):
    if payload.empresa_id != empresa_id:
        raise HTTPException(
            status_code=400,
            detail=f"El archivo de respaldo pertenece a la empresa '{payload.empresa_id}' y no a la empresa actual '{empresa_id}'."
        )

    # VERIFICACIÓN ESTRICTA DE LA FIRMA DIGITAL HMAC-SHA256
    es_valida = verificar_firma_hmac(payload.datos, payload.firma_integridad)

    if not es_valida:
        raise HTTPException(
            status_code=400,
            detail="⚠️ ERROR DE INTEGRIDAD GRAVE: La firma digital HMAC-SHA256 del archivo no coincide. El archivo ha sido alterado, manipulado intencionalmente o no proviene de un respaldo legítimo del sistema. La restauración fue ABORTADA para proteger la base de datos."
        )

    # Inyección / Restauración de Datos
    tablas = payload.datos.get("tablas", {})
    registros_restaurados = 0

    try:
        # 1. Productos
        for p in tablas.get("productos", []):
            existente = db.query(models.Producto).filter(models.Producto.id_producto == p["id_producto"], models.Producto.empresa_id == empresa_id).first()
            if not existente:
                nuevo_p = models.Producto(
                    id_producto=p["id_producto"], empresa_id=empresa_id, codigo=p["codigo"],
                    nombre=p["nombre"], descripcion=p.get("descripcion"), precio_unitario=p.get("precio_unitario", 0),
                    costo_unitario=p.get("costo_unitario", 0), stock=p.get("stock", 0), categoria=p.get("categoria"), activo=p.get("activo", True)
                )
                db.add(nuevo_p)
                registros_restaurados += 1

        # 2. Clientes
        for c in tablas.get("clientes", []):
            existente = db.query(models.Cliente).filter(models.Cliente.id_cliente == c["id_cliente"], models.Cliente.empresa_id == empresa_id).first()
            if not existente:
                nuevo_c = models.Cliente(
                    id_cliente=c["id_cliente"], empresa_id=empresa_id, nombre=c["nombre"],
                    dui_nit=c.get("dui_nit"), nrc=c.get("nrc"), email=c.get("email"),
                    telefono=c.get("telefono"), direccion=c.get("direccion"), limite_credito=c.get("limite_credito", 0), activo=c.get("activo", True)
                )
                db.add(nuevo_c)
                registros_restaurados += 1

        # 3. Acreedores
        for a in tablas.get("acreedores", []):
            existente = db.query(models.Acreedor).filter(models.Acreedor.id == a["id"], models.Acreedor.empresa_id == empresa_id).first()
            if not existente:
                nuevo_a = models.Acreedor(
                    id=a["id"], empresa_id=empresa_id, nombre=a["nombre"], contacto_telefono=a.get("contacto_telefono"),
                    dui_nit=a.get("dui_nit"), email=a.get("email"), tasa_interes_anual=a.get("tasa_interes_anual", 0),
                    saldo_capital=a.get("saldo_capital", 0), saldo_interes=a.get("saldo_interes", 0), notas=a.get("notas"), activo=a.get("activo", True)
                )
                db.add(nuevo_a)
                registros_restaurados += 1

        # 4. Aportantes
        for ap in tablas.get("aportantes", []):
            existente = db.query(models.Aportante).filter(models.Aportante.id == ap["id"], models.Aportante.empresa_id == empresa_id).first()
            if not existente:
                nuevo_ap = models.Aportante(
                    id=ap["id"], empresa_id=empresa_id, nombre=ap["nombre"], tipo_relacion=ap.get("tipo_relacion", "Socio"),
                    contacto_telefono=ap.get("contacto_telefono"), dui_nit=ap.get("dui_nit"), email=ap.get("email"),
                    total_aportado=ap.get("total_aportado", 0), total_devuelto=ap.get("total_devuelto", 0),
                    saldo_pendiente=ap.get("saldo_pendiente", 0), notas=ap.get("notas"), activo=ap.get("activo", True)
                )
                db.add(nuevo_ap)
                registros_restaurados += 1

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al inyectar los datos en la base de datos: {str(e)}")

    return {
        "status": "success",
        "mensaje": "EXITO: Firma digital verificada con éxito. Respaldo restaurado en el sistema.",
        "firma_valida": True,
        "registros_procesados": registros_restaurados
    }
