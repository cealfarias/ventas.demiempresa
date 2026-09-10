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
    try:
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
                        "codigo": getattr(p, "codigo", ""),
                        "nombre": getattr(p, "nombre", ""),
                        "descripcion": getattr(p, "descripcion", ""),
                        "precio_venta": getattr(p, "precio_venta", 0.0),
                        "precio_unitario": getattr(p, "precio_venta", 0.0),
                        "costo_promedio": getattr(p, "costo_promedio", 0.0),
                        "costo_unitario": getattr(p, "costo_promedio", 0.0),
                        "stock": getattr(p, "stock", 0.0),
                        "activo": getattr(p, "activo", True)
                    } for p in productos
                ],
                "clientes": [
                    {
                        "id_cliente": c.id_cliente,
                        "codigo": getattr(c, "codigo", ""),
                        "nombre": getattr(c, "nombre", ""),
                        "nombre_comercial": getattr(c, "nombre_comercial", ""),
                        "dui": getattr(c, "dui", ""),
                        "nit": getattr(c, "nit", ""),
                        "dui_nit": getattr(c, "dui", getattr(c, "nit", "")),
                        "nrc": getattr(c, "nrc", ""),
                        "email": getattr(c, "email", ""),
                        "telefono": getattr(c, "telefono", ""),
                        "direccion": getattr(c, "direccion", ""),
                        "limite_credito": getattr(c, "limite_credito", 0),
                        "activo": getattr(c, "activo", True)
                    } for c in clientes
                ],
                "proveedores": [
                    {
                        "id": pr.id,
                        "codigo": getattr(pr, "codigo", ""),
                        "nombre": getattr(pr, "nombre", ""),
                        "nombre_comercial": getattr(pr, "nombre_comercial", ""),
                        "nit": getattr(pr, "nit", ""),
                        "nrc": getattr(pr, "nrc", ""),
                        "email": getattr(pr, "email", ""),
                        "telefono": getattr(pr, "telefono", ""),
                        "direccion": getattr(pr, "direccion", ""),
                        "contacto_nombre": getattr(pr, "contacto_nombre", ""),
                        "contacto_telefono": getattr(pr, "contacto_telefono", ""),
                        "limite_credito": getattr(pr, "limite_credito", 0),
                        "activo": getattr(pr, "activo", True)
                    } for pr in proveedores
                ],
                "bodegas": [
                    {
                        "id": b.id,
                        "codigo": getattr(b, "codigo", ""),
                        "nombre": getattr(b, "nombre", ""),
                        "ubicacion": getattr(b, "ubicacion", ""),
                        "es_principal": getattr(b, "es_principal", False),
                        "activa": getattr(b, "activa", True)
                    } for b in bodegas
                ],
                "cajas": [
                    {
                        "id": cj.id,
                        "bodega_id": getattr(cj, "bodega_id", None),
                        "nombre": getattr(cj, "nombre", ""),
                        "activa": getattr(cj, "activa", True)
                    } for cj in cajas
                ],
                "gastos_categorias": [
                    {
                        "id": gc.id,
                        "nombre": getattr(gc, "nombre", ""),
                        "descripcion": getattr(gc, "descripcion", "")
                    } for gc in gastos_cats
                ],
                "gastos": [
                    {
                        "id": g.id,
                        "categoria_id": getattr(g, "categoria_id", None),
                        "monto": getattr(g, "monto", 0),
                        "fecha": serializar_valor(getattr(g, "fecha", None)),
                        "descripcion": getattr(g, "descripcion", ""),
                        "metodo_pago": getattr(g, "metodo_pago", "efectivo")
                    } for g in gastos
                ],
                "acreedores": [
                    {
                        "id": a.id,
                        "nombre": getattr(a, "nombre", ""),
                        "contacto_telefono": getattr(a, "contacto_telefono", ""),
                        "dui_nit": getattr(a, "dui_nit", ""),
                        "email": getattr(a, "email", ""),
                        "tasa_interes_anual": getattr(a, "tasa_interes_anual", 0.0),
                        "saldo_capital": getattr(a, "saldo_capital", 0),
                        "saldo_interes": getattr(a, "saldo_interes", 0),
                        "notas": getattr(a, "notas", ""),
                        "activo": getattr(a, "activo", True)
                    } for a in acreedores
                ],
                "movimientos_acreedores": [
                    {
                        "id": ma.id,
                        "acreedor_id": getattr(ma, "acreedor_id", None),
                        "tipo": getattr(ma, "tipo", ""),
                        "monto_capital": getattr(ma, "monto_capital", 0),
                        "monto_interes": getattr(ma, "monto_interes", 0),
                        "monto_total": getattr(ma, "monto_total", 0),
                        "metodo_pago": getattr(ma, "metodo_pago", "efectivo"),
                        "referencia": getattr(ma, "referencia", ""),
                        "notas": getattr(ma, "notas", ""),
                        "fecha": serializar_valor(getattr(ma, "fecha", None))
                    } for ma in movs_acreedores
                ],
                "aportantes": [
                    {
                        "id": ap.id,
                        "nombre": getattr(ap, "nombre", ""),
                        "tipo_relacion": getattr(ap, "tipo_relacion", "Socio"),
                        "contacto_telefono": getattr(ap, "contacto_telefono", ""),
                        "dui_nit": getattr(ap, "dui_nit", ""),
                        "email": getattr(ap, "email", ""),
                        "total_aportado": getattr(ap, "total_aportado", 0),
                        "total_devuelto": getattr(ap, "total_devuelto", 0),
                        "saldo_pendiente": getattr(ap, "saldo_pendiente", 0),
                        "notas": getattr(ap, "notas", ""),
                        "activo": getattr(ap, "activo", True)
                    } for ap in aportantes
                ],
                "movimientos_aportantes": [
                    {
                        "id": map.id,
                        "aportante_id": getattr(map, "aportante_id", None),
                        "tipo": getattr(map, "tipo", ""),
                        "monto": getattr(map, "monto", 0),
                        "metodo_pago": getattr(map, "metodo_pago", "efectivo"),
                        "referencia": getattr(map, "referencia", ""),
                        "notas": getattr(map, "notas", ""),
                        "fecha": serializar_valor(getattr(map, "fecha", None))
                    } for map in movs_aportantes
                ],
                "prestamos_acreedores": [
                    {
                        "id": p.id,
                        "acreedor_id": getattr(p, "acreedor_id", None),
                        "monto_prestamo": getattr(p, "monto_prestamo", 0),
                        "tasa_interes_anual": getattr(p, "tasa_interes_anual", 0.0),
                        "plazo_meses": getattr(p, "plazo_meses", 0),
                        "tipo_amortizacion": getattr(p, "tipo_amortizacion", ""),
                        "fecha_desembolso": serializar_valor(getattr(p, "fecha_desembolso", None)),
                        "monto_cuota_mensual": getattr(p, "monto_cuota_mensual", 0),
                        "saldo_pendiente": getattr(p, "saldo_pendiente", 0),
                        "estado": getattr(p, "estado", "activo"),
                        "notas": getattr(p, "notas", "")
                    } for p in prestamos
                ],
                "cuotas_amortizacion": [
                    {
                        "id": cu.id,
                        "prestamo_id": getattr(cu, "prestamo_id", None),
                        "numero_cuota": getattr(cu, "numero_cuota", 0),
                        "fecha_vencimiento": serializar_valor(getattr(cu, "fecha_vencimiento", None)),
                        "monto_cuota_teorica": getattr(cu, "monto_cuota_teorica", 0),
                        "monto_capital_teorico": getattr(cu, "monto_capital_teorico", 0),
                        "monto_interes_teorico": getattr(cu, "monto_interes_teorico", 0),
                        "saldo_teorico": getattr(cu, "saldo_teorico", 0),
                        "estado": getattr(cu, "estado", "pendiente"),
                        "fecha_pago_real": serializar_valor(getattr(cu, "fecha_pago_real", None)),
                        "monto_pagado_real": getattr(cu, "monto_pagado_real", 0),
                        "metodo_pago": getattr(cu, "metodo_pago", ""),
                        "referencia": getattr(cu, "referencia", ""),
                        "notas": getattr(cu, "notas", "")
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando el respaldo de seguridad: {str(e)}")


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
            precio = p.get("precio_venta", p.get("precio_unitario", 0.0))
            costo = p.get("costo_promedio", p.get("costo_unitario", 0.0))
            if not existente:
                nuevo_p = models.Producto(
                    id_producto=p["id_producto"], empresa_id=empresa_id, codigo=p.get("codigo", ""),
                    nombre=p.get("nombre", ""), descripcion=p.get("descripcion"), precio_venta=precio,
                    costo_promedio=costo, stock=p.get("stock", 0.0), activo=p.get("activo", True)
                )
                db.add(nuevo_p)
                registros_restaurados += 1

        # 2. Clientes
        for c in tablas.get("clientes", []):
            existente = db.query(models.Cliente).filter(models.Cliente.id_cliente == c["id_cliente"], models.Cliente.empresa_id == empresa_id).first()
            if not existente:
                nuevo_c = models.Cliente(
                    id_cliente=c["id_cliente"], empresa_id=empresa_id, nombre=c.get("nombre", ""),
                    codigo=c.get("codigo"), nombre_comercial=c.get("nombre_comercial"),
                    dui=c.get("dui", c.get("dui_nit")), nit=c.get("nit"), nrc=c.get("nrc"),
                    email=c.get("email"), telefono=c.get("telefono"), direccion=c.get("direccion"),
                    limite_credito=c.get("limite_credito", 0), activo=c.get("activo", True)
                )
                db.add(nuevo_c)
                registros_restaurados += 1

        # 3. Proveedores
        for pr in tablas.get("proveedores", []):
            existente = db.query(models.Proveedor).filter(models.Proveedor.id == pr["id"], models.Proveedor.empresa_id == empresa_id).first()
            if not existente:
                nuevo_pr = models.Proveedor(
                    id=pr["id"], empresa_id=empresa_id, codigo=pr.get("codigo"), nombre=pr.get("nombre", ""),
                    nombre_comercial=pr.get("nombre_comercial"), nit=pr.get("nit"), nrc=pr.get("nrc"),
                    email=pr.get("email"), telefono=pr.get("telefono"), direccion=pr.get("direccion"),
                    contacto_nombre=pr.get("contacto_nombre"), contacto_telefono=pr.get("contacto_telefono"),
                    limite_credito=pr.get("limite_credito", 0), activo=pr.get("activo", True)
                )
                db.add(nuevo_pr)
                registros_restaurados += 1

        # 4. Bodegas
        for b in tablas.get("bodegas", []):
            existente = db.query(models.Bodega).filter(models.Bodega.id == b["id"], models.Bodega.empresa_id == empresa_id).first()
            if not existente:
                nuevo_b = models.Bodega(
                    id=b["id"], empresa_id=empresa_id, codigo=b.get("codigo", ""),
                    nombre=b.get("nombre", ""), ubicacion=b.get("ubicacion"),
                    es_principal=b.get("es_principal", False), activa=b.get("activa", True)
                )
                db.add(nuevo_b)
                registros_restaurados += 1

        # 5. Cajas
        for cj in tablas.get("cajas", []):
            existente = db.query(models.Caja).filter(models.Caja.id == cj["id"], models.Caja.empresa_id == empresa_id).first()
            if not existente:
                nuevo_cj = models.Caja(
                    id=cj["id"], empresa_id=empresa_id, bodega_id=cj.get("bodega_id"),
                    nombre=cj.get("nombre", ""), activa=cj.get("activa", True)
                )
                db.add(nuevo_cj)
                registros_restaurados += 1

        # 6. Acreedores
        for a in tablas.get("acreedores", []):
            existente = db.query(models.Acreedor).filter(models.Acreedor.id == a["id"], models.Acreedor.empresa_id == empresa_id).first()
            if not existente:
                nuevo_a = models.Acreedor(
                    id=a["id"], empresa_id=empresa_id, nombre=a.get("nombre", ""), contacto_telefono=a.get("contacto_telefono"),
                    dui_nit=a.get("dui_nit"), email=a.get("email"), tasa_interes_anual=a.get("tasa_interes_anual", 0.0),
                    saldo_capital=a.get("saldo_capital", 0), saldo_interes=a.get("saldo_interes", 0), notas=a.get("notas"), activo=a.get("activo", True)
                )
                db.add(nuevo_a)
                registros_restaurados += 1

        # 7. Aportantes
        for ap in tablas.get("aportantes", []):
            existente = db.query(models.Aportante).filter(models.Aportante.id == ap["id"], models.Aportante.empresa_id == empresa_id).first()
            if not existente:
                nuevo_ap = models.Aportante(
                    id=ap["id"], empresa_id=empresa_id, nombre=ap.get("nombre", ""), tipo_relacion=ap.get("tipo_relacion", "Socio"),
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
