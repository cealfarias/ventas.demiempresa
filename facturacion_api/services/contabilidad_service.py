import json
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Factura, ItemFactura, Cliente, Kardex, OrdenCompra
from models.integracion_contable import ConfiguracionIntegracionContable, BitacoraPartidaContable

def obtener_configuracion_integracion(db: Session, empresa_id: str) -> ConfiguracionIntegracionContable:
    return db.query(ConfiguracionIntegracionContable).filter(
        ConfiguracionIntegracionContable.empresa_id == empresa_id,
        ConfiguracionIntegracionContable.activo == True
    ).first()

def enviar_partida_webhook(config: ConfiguracionIntegracionContable, payload: dict) -> tuple[bool, str]:
    """
    Envía el JSON de la partida contable al webhook de contabilidad_api mediante HTTP POST.
    """
    if not config or not config.url_api_contable or not config.api_key_empresa:
        return False, "Configuración de integración contable incompleta o inactiva"

    url = f"{config.url_api_contable.rstrip('/')}/api/v1/integracion/webhook/partida"
    headers = {
        "X-API-Key": config.api_key_empresa,
        "Content-Type": "application/json"
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(url, json=payload, headers=headers)
            if res.status_code in (200, 201):
                return True, res.text
            else:
                return False, f"HTTP {res.status_code}: {res.text}"
    except Exception as e:
        return False, f"Error de conexión con servicio contable: {str(e)}"


def generar_y_enviar_ccf_individual(db: Session, empresa_id: str, factura_id: int) -> dict:
    """
    Genera y envía una partida nominativa individual para un Comprobante de Crédito Fiscal (CCF) o Venta a Crédito.
    """
    config = obtener_configuracion_integracion(db, empresa_id)
    if not config:
        return {"exito": False, "mensaje": "No hay configuración de integración contable para esta empresa."}

    f = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not f:
        return {"exito": False, "mensaje": "Factura no encontrada."}

    cliente = db.query(Cliente).filter(Cliente.id_cliente == f.cliente_id).first()
    cliente_nombre = cliente.nombre if cliente else "Cliente"

    # Conversión de valores (subtotal, iva, total están en centavos si integer)
    subtotal_usd = round(f.subtotal / 100.0, 2)
    iva_usd = round(f.iva / 100.0, 2)
    total_usd = round(f.total / 100.0, 2)

    # Ajuste de redondeo si subtotal + iva != total
    if round(subtotal_usd + iva_usd, 2) != total_usd:
        iva_usd = round(total_usd - subtotal_usd, 2)

    fecha_dt = f.fecha_emision if f.fecha_emision else datetime.now()
    fecha_str = fecha_dt.strftime("%Y-%m-%d")

    # Cuentas contables asignadas o valores por defecto
    cta_debe = (config.cuenta_cxc_clientes if f.condicion_operacion == "CREDITO" else config.cuenta_caja_general) or "110301"
    cta_ventas = config.cuenta_ventas_ccf or "410102"
    cta_iva = config.cuenta_iva_debito or "210201"

    detalles = [
        {
            "cuenta_codigo": cta_debe,
            "debe": total_usd,
            "haber": 0.00,
            "concepto_detalle": f"Cobro/Cargo {f.tipo_doc} {f.numero} - {cliente_nombre}"
        },
        {
            "cuenta_codigo": cta_ventas,
            "debe": 0.00,
            "haber": subtotal_usd,
            "concepto_detalle": f"Ventas Gravadas CCF {f.numero}"
        },
        {
            "cuenta_codigo": cta_iva,
            "debe": 0.00,
            "haber": iva_usd,
            "concepto_detalle": f"Débito Fiscal IVA 13% CCF {f.numero}"
        }
    ]

    payload = {
        "empresa_id": empresa_id,
        "anio": fecha_dt.year,
        "mes": fecha_dt.month,
        "fecha": fecha_str,
        "concepto": f"Venta {f.tipo_doc} {f.numero} - Cliente: {cliente_nombre}",
        "usuario": "Facturacion API",
        "terminal_ip": "127.0.0.1",
        "detalles": detalles
    }

    # Guardar en Bitácora
    bitacora = BitacoraPartidaContable(
        empresa_id=empresa_id,
        tipo_origen="ccf_individual",
        referencia_id=str(f.id),
        fecha_partida=fecha_str,
        concepto=payload["concepto"],
        payload_json=payload,
        estado="pendiente"
    )
    db.add(bitacora)
    db.commit()

    # Transmitir al Webhook
    exito, respuesta = enviar_partida_webhook(config, payload)
    bitacora.estado = "enviado" if exito else "error"
    if exito:
        bitacora.respuesta_contabilidad = respuesta
        bitacora.fecha_envio = datetime.now()
    else:
        bitacora.mensaje_error = respuesta
    db.commit()

    return {"exito": exito, "bitacora_id": bitacora.id, "mensaje": respuesta}


def generar_resumen_diario_consumidor_final(db: Session, empresa_id: str, fecha_str: str) -> dict:
    """
    Agrupa todas las facturas de Consumidor Final de la fecha especificada en 1 sola partida contable resumida.
    Incluye Venta, Débito Fiscal IVA y Costo de Lo Vendido (desde Kardex).
    """
    config = obtener_configuracion_integracion(db, empresa_id)
    if not config:
        return {"exito": False, "mensaje": "No hay configuración de integración contable para esta empresa."}

    # Buscar todas las facturas CF emitidas en esa fecha
    facturas = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        Factura.tipo_doc == "FACTURA",
        Factura.estado != "anulada"
    ).all()

    # Filtrar por fecha YYYY-MM-DD
    facturas_dia = []
    for f in facturas:
        f_fecha = f.fecha_emision.strftime("%Y-%m-%d") if f.fecha_emision else ""
        if f_fecha == fecha_str:
            facturas_dia.append(f)

    if not facturas_dia:
        return {
            "exito": True,
            "mensaje": f"No se encontraron facturas a consumidor final para la fecha {fecha_str}.",
            "facturas_procesadas": 0
        }

    factura_ids = [f.id for f in facturas_dia]
    subtotal_cents = sum(f.subtotal for f in facturas_dia)
    iva_cents = sum(f.iva for f in facturas_dia)
    total_cents = sum(f.total for f in facturas_dia)

    subtotal_usd = round(subtotal_cents / 100.0, 2)
    iva_usd = round(iva_cents / 100.0, 2)
    total_usd = round(total_cents / 100.0, 2)

    if round(subtotal_usd + iva_usd, 2) != total_usd:
        iva_usd = round(total_usd - subtotal_usd, 2)

    # Calcular Costo de lo Vendido acumulado desde Kardex
    kardex_items = db.query(Kardex).filter(
        Kardex.empresa_id == empresa_id,
        Kardex.referencia_tipo == "factura",
        Kardex.referencia_id.in_(factura_ids)
    ).all()

    costo_total_usd = round(sum(k.costo_total for k in kardex_items), 2)

    fecha_dt = datetime.strptime(fecha_str, "%Y-%m-%d")
    cta_caja = config.cuenta_caja_general or "110101"
    cta_ventas_cf = config.cuenta_ventas_cf or "410101"
    cta_iva = config.cuenta_iva_debito or "210201"
    cta_costo = config.cuenta_costo_ventas or "510101"
    cta_inv = config.cuenta_inventario or "110501"

    detalles = [
        {
            "cuenta_codigo": cta_caja,
            "debe": total_usd,
            "haber": 0.00,
            "concepto_detalle": f"Ingreso Total Ventas CF {fecha_str} ({len(facturas_dia)} facturas)"
        },
        {
            "cuenta_codigo": cta_ventas_cf,
            "debe": 0.00,
            "haber": subtotal_usd,
            "concepto_detalle": f"Ventas Gravadas Consumidor Final {fecha_str}"
        },
        {
            "cuenta_codigo": cta_iva,
            "debe": 0.00,
            "haber": iva_usd,
            "concepto_detalle": f"Débito Fiscal IVA 13% Consumidor Final {fecha_str}"
        }
    ]

    if costo_total_usd > 0:
        detalles.append({
            "cuenta_codigo": cta_costo,
            "debe": costo_total_usd,
            "haber": 0.00,
            "concepto_detalle": f"Costo de lo Vendido Consumidor Final {fecha_str}"
        })
        detalles.append({
            "cuenta_codigo": cta_inv,
            "debe": 0.00,
            "haber": costo_total_usd,
            "concepto_detalle": f"Descargo Inventario de Mercaderías {fecha_str}"
        })

    payload = {
        "empresa_id": empresa_id,
        "anio": fecha_dt.year,
        "mes": fecha_dt.month,
        "fecha": fecha_str,
        "concepto": f"Resumen Diario de Ventas Consumidor Final - {fecha_str} ({len(facturas_dia)} facturas)",
        "usuario": "Facturacion System",
        "terminal_ip": "127.0.0.1",
        "detalles": detalles
    }

    bitacora = BitacoraPartidaContable(
        empresa_id=empresa_id,
        tipo_origen="resumen_diario_cf",
        referencia_id=fecha_str,
        fecha_partida=fecha_str,
        concepto=payload["concepto"],
        payload_json=payload,
        estado="pendiente"
    )
    db.add(bitacora)
    db.commit()

    exito, respuesta = enviar_partida_webhook(config, payload)
    bitacora.estado = "enviado" if exito else "error"
    if exito:
        bitacora.respuesta_contabilidad = respuesta
        bitacora.fecha_envio = datetime.now()
    else:
        bitacora.mensaje_error = respuesta
    db.commit()

    return {
        "exito": exito,
        "facturas_procesadas": len(facturas_dia),
        "total_ventas": total_usd,
        "costo_total": costo_total_usd,
        "bitacora_id": bitacora.id,
        "mensaje": respuesta
    }
