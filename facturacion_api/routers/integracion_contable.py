import os
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models.integracion_contable import ConfiguracionIntegracionContable, BitacoraPartidaContable
from services.contabilidad_service import (
    obtener_configuracion_integracion,
    enviar_partida_webhook,
    generar_resumen_diario_consumidor_final,
    generar_y_enviar_ccf_individual
)
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import httpx

router = APIRouter(prefix="/integracion-contable", tags=["Integración Contable"])

DEFAULT_CONTA_URL = os.getenv("CONTA_API_URL", "https://conta-demiempresa.onrender.com")


class ConfiguracionContableSchema(BaseModel):
    url_api_contable: Optional[str] = None
    api_key_empresa: Optional[str] = None
    cuenta_caja_general: Optional[str] = "110101"
    cuenta_bancos: Optional[str] = "110201"
    cuenta_iva_debito: Optional[str] = "210201"
    cuenta_iva_credito: Optional[str] = "110601"
    cuenta_cxc_clientes: Optional[str] = "110301"
    cuenta_cxp_proveedores: Optional[str] = "210101"
    cuenta_ventas_cf: Optional[str] = "410101"
    cuenta_ventas_ccf: Optional[str] = "410102"
    cuenta_inventario: Optional[str] = "110501"
    cuenta_costo_ventas: Optional[str] = "510101"

    class Config:
        from_attributes = True


class ResumenDiarioRequest(BaseModel):
    fecha: str # YYYY-MM-DD


@router.get("/configuracion")
def obtener_configuracion(empresa_id: str, db: Session = Depends(get_db)):
    config = db.query(ConfiguracionIntegracionContable).filter(
        ConfiguracionIntegracionContable.empresa_id == empresa_id
    ).first()

    if not config:
        return {
            "empresa_id": empresa_id,
            "url_api_contable": DEFAULT_CONTA_URL,
            "api_key_empresa": f"auto_{empresa_id}",
            "configurado": False,
            "cuenta_caja_general": "110101",
            "cuenta_bancos": "110201",
            "cuenta_iva_debito": "210201",
            "cuenta_iva_credito": "110601",
            "cuenta_cxc_clientes": "110301",
            "cuenta_cxp_proveedores": "210101",
            "cuenta_ventas_cf": "410101",
            "cuenta_ventas_ccf": "410102",
            "cuenta_inventario": "110501",
            "cuenta_costo_ventas": "510101"
        }

    return {
        "empresa_id": config.empresa_id,
        "url_api_contable": config.url_api_contable or DEFAULT_CONTA_URL,
        "api_key_empresa": config.api_key_empresa or f"auto_{empresa_id}",
        "cuenta_caja_general": config.cuenta_caja_general or "110101",
        "cuenta_bancos": config.cuenta_bancos or "110201",
        "cuenta_iva_debito": config.cuenta_iva_debito or "210201",
        "cuenta_iva_credito": config.cuenta_iva_credito or "110601",
        "cuenta_cxc_clientes": config.cuenta_cxc_clientes or "110301",
        "cuenta_cxp_proveedores": config.cuenta_cxp_proveedores or "210101",
        "cuenta_ventas_cf": config.cuenta_ventas_cf or "410101",
        "cuenta_ventas_ccf": config.cuenta_ventas_ccf or "410102",
        "cuenta_inventario": config.cuenta_inventario or "110501",
        "cuenta_costo_ventas": config.cuenta_costo_ventas or "510101",
        "configurado": True
    }


@router.post("/configuracion")
def guardar_configuracion(empresa_id: str, data: ConfiguracionContableSchema, db: Session = Depends(get_db)):
    config = db.query(ConfiguracionIntegracionContable).filter(
        ConfiguracionIntegracionContable.empresa_id == empresa_id
    ).first()

    if not config:
        config = ConfiguracionIntegracionContable(empresa_id=empresa_id)
        db.add(config)

    config.url_api_contable = data.url_api_contable or config.url_api_contable or DEFAULT_CONTA_URL
    config.api_key_empresa = data.api_key_empresa or config.api_key_empresa or f"auto_{empresa_id}"
    config.cuenta_caja_general = data.cuenta_caja_general
    config.cuenta_bancos = data.cuenta_bancos
    config.cuenta_iva_debito = data.cuenta_iva_debito
    config.cuenta_iva_credito = data.cuenta_iva_credito
    config.cuenta_cxc_clientes = data.cuenta_cxc_clientes
    config.cuenta_cxp_proveedores = data.cuenta_cxp_proveedores
    config.cuenta_ventas_cf = data.cuenta_ventas_cf
    config.cuenta_ventas_ccf = data.cuenta_ventas_ccf
    config.cuenta_inventario = data.cuenta_inventario
    config.cuenta_costo_ventas = data.cuenta_costo_ventas
    config.activo = True

    db.commit()
    db.refresh(config)
    return {"exito": True, "mensaje": "Configuración contable guardada correctamente"}


@router.post("/generar-resumen-diario")
def endpoint_generar_resumen_diario(empresa_id: str, payload: ResumenDiarioRequest, db: Session = Depends(get_db)):
    return generar_resumen_diario_consumidor_final(db, empresa_id, payload.fecha)


@router.get("/bitacora")
def listar_bitacora(empresa_id: str, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    registros = db.query(BitacoraPartidaContable).filter(
        BitacoraPartidaContable.empresa_id == empresa_id
    ).order_by(BitacoraPartidaContable.id.desc()).limit(limit).all()

    return [
        {
            "id": r.id,
            "tipo_origen": r.tipo_origen,
            "referencia_id": r.referencia_id,
            "fecha_partida": r.fecha_partida,
            "concepto": r.concepto,
            "estado": r.estado,
            "mensaje_error": r.mensaje_error,
            "respuesta_contabilidad": r.respuesta_contabilidad,
            "fecha_creacion": r.fecha_creacion,
            "fecha_envio": r.fecha_envio
        }
        for r in registros
    ]


@router.post("/reintentar/{bitacora_id}")
def reintentar_envio_partida(bitacora_id: int, empresa_id: str, db: Session = Depends(get_db)):
    registro = db.query(BitacoraPartidaContable).filter(
        BitacoraPartidaContable.id == bitacora_id,
        BitacoraPartidaContable.empresa_id == empresa_id
    ).first()

    if not registro:
        raise HTTPException(status_code=404, detail="Registro de bitacora no encontrado")

    config = obtener_configuracion_integracion(db, empresa_id)
    if not config:
        raise HTTPException(status_code=400, detail="Configuración contable no encontrada")

    exito, respuesta = enviar_partida_webhook(config, registro.payload_json)
    registro.estado = "enviado" if exito else "error"
    if exito:
        registro.respuesta_contabilidad = respuesta
        registro.fecha_envio = datetime.now()
        registro.mensaje_error = None
    else:
        registro.mensaje_error = respuesta
    db.commit()

    return {"exito": exito, "mensaje": respuesta}


@router.get("/catalogo-remoto")
def obtener_catalogo_cuentas_remoto(empresa_id: str, db: Session = Depends(get_db)):
    config = obtener_configuracion_integracion(db, empresa_id)
    url_base = (config.url_api_contable if config and config.url_api_contable else DEFAULT_CONTA_URL).rstrip('/')
    api_key = (config.api_key_empresa if config and config.api_key_empresa else f"auto_{empresa_id}")

    url = f"{url_base}/api/v1/integracion/catalogo-cuentas"
    headers = {"X-API-Key": api_key}

    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(url, headers=headers)
            if res.status_code == 200:
                return res.json()
            else:
                raise HTTPException(status_code=res.status_code, detail=f"Error en servidor contable: {res.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo conectar con el servidor contable: {str(e)}")
