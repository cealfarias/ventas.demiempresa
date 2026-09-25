from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List, Optional
from datetime import datetime
import calendar
from database import get_db
from models import Factura, Cliente, OrdenCompra, Proveedor, ItemFactura

router = APIRouter(prefix="/libros-iva", tags=["Libros de IVA (El Salvador)"])


@router.get("/ventas-consumidor-final")
def libro_ventas_consumidor_final(
    empresa_id: str,
    anio: int = Query(..., description="Año a consultar, ej: 2026"),
    mes: int = Query(..., description="Mes a consultar (1-12)"),
    db: Session = Depends(get_db)
):
    """
    Genera el Libro de Ventas a Consumidor Final (Art. 141 C.T. El Salvador).
    Resumen consolidado diario de facturas/tickets de consumidor final.
    """
    # Buscar facturas consumidor final emitidas (no anuladas) en el mes/año
    facturas = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        extract('year', Factura.fecha_emision) == anio,
        extract('month', Factura.fecha_emision) == mes,
        Factura.tipo_doc.in_(["FACTURA", "CONSUMIDOR_FINAL"]),
        Factura.estado != "anulada"
    ).order_by(Factura.fecha_emision.asc(), Factura.id.asc()).all()

    # Agrupar por día
    dias_map = {}
    for f in facturas:
        fecha_str = f.fecha_emision.strftime("%Y-%m-%d")
        if fecha_str not in dias_map:
            dias_map[fecha_str] = {
                "fecha": fecha_str,
                "facturas": [],
                "subtotal_cents": 0,
                "iva_cents": 0,
                "total_cents": 0
            }
        dias_map[fecha_str]["facturas"].append(f)
        dias_map[fecha_str]["subtotal_cents"] += (f.subtotal or 0)
        dias_map[fecha_str]["iva_cents"] += (f.iva or 0)
        dias_map[fecha_str]["total_cents"] += (f.total or 0)

    lineas_libro = []
    num_item = 1

    gran_total_cents = 0
    gran_subtotal_cents = 0
    gran_iva_cents = 0

    for fecha_str, data in sorted(dias_map.items()):
        facs_dia = data["facturas"]
        del_numero = facs_dia[0].numero if facs_dia else "-"
        al_numero = facs_dia[-1].numero if facs_dia else "-"
        cantidad_docs = len(facs_dia)

        total_usd = round(data["total_cents"] / 100.0, 2)
        
        # En Consumidor Final, el precio incluye IVA (13%)
        # Venta Neta = Total / 1.13, Débito Fiscal = Total - Venta Neta
        venta_neta_usd = round(total_usd / 1.13, 2)
        debito_fiscal_usd = round(total_usd - venta_neta_usd, 2)

        gran_total_cents += data["total_cents"]
        gran_subtotal_cents += data["subtotal_cents"]
        gran_iva_cents += data["iva_cents"]

        lineas_libro.append({
            "item": num_item,
            "fecha": fecha_str,
            "del_numero": del_numero,
            "al_numero": al_numero,
            "cantidad_docs": cantidad_docs,
            "ventas_exentas": 0.00,
            "ventas_no_sujetas": 0.00,
            "ventas_gravadas_locales": venta_neta_usd,
            "debito_fiscal": debito_fiscal_usd,
            "exportaciones": 0.00,
            "total_ventas_dia": total_usd
        })
        num_item += 1

    total_general_usd = round(gran_total_cents / 100.0, 2)
    total_ventas_netas_usd = round(total_general_usd / 1.13, 2) if total_general_usd > 0 else 0.00
    total_debito_fiscal_usd = round(total_general_usd - total_ventas_netas_usd, 2) if total_general_usd > 0 else 0.00

    return {
        "empresa_id": empresa_id,
        "tipo_libro": "VENTAS_CONSUMIDOR_FINAL",
        "anio": anio,
        "mes": mes,
        "nombre_mes": calendar.month_name[mes],
        "total_documentos": len(facturas),
        "lineas": lineas_libro,
        "resumen_totales": {
            "total_exentas": 0.00,
            "total_no_sujetas": 0.00,
            "total_ventas_netas": total_ventas_netas_usd,
            "total_debito_fiscal": total_debito_fiscal_usd,
            "total_exportaciones": 0.00,
            "total_general_ventas": total_general_usd
        }
    }


@router.get("/ventas-contribuyentes")
def libro_ventas_contribuyentes(
    empresa_id: str,
    anio: int = Query(..., description="Año a consultar, ej: 2026"),
    mes: int = Query(..., description="Mes a consultar (1-12)"),
    db: Session = Depends(get_db)
):
    """
    Genera el Libro de Ventas a Contribuyentes / Crédito Fiscal (CCF).
    Detalla uno a uno los Comprobantes de Crédito Fiscal emitidos en el mes.
    """
    facturas_ccf = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        extract('year', Factura.fecha_emision) == anio,
        extract('month', Factura.fecha_emision) == mes,
        Factura.tipo_doc.in_(["CCF", "EXPORTACION"]),
        Factura.estado != "anulada"
    ).order_by(Factura.fecha_emision.asc(), Factura.id.asc()).all()

    lineas_libro = []
    num_item = 1

    total_gravado_cents = 0
    total_iva_cents = 0
    total_general_cents = 0

    for f in facturas_ccf:
        cliente = db.query(Cliente).filter(Cliente.id_cliente == f.cliente_id).first()
        cliente_nombre = cliente.nombre if cliente else "Cliente General"
        cliente_nit = (cliente.nit or cliente.nrc or "N/A") if cliente else "N/A"
        cliente_nrc = (cliente.nrc or "") if cliente else ""

        # En CCF, subtotal está sin IVA, iva es 13% directo
        subtotal_usd = round((f.subtotal or 0) / 100.0, 2)
        iva_usd = round((f.iva or 0) / 100.0, 2)
        total_usd = round((f.total or 0) / 100.0, 2)

        # Ajuste de redondeo si subtotal + iva != total
        if round(subtotal_usd + iva_usd, 2) != total_usd:
            iva_usd = round(total_usd - subtotal_usd, 2)

        total_gravado_cents += (f.subtotal or 0)
        total_iva_cents += (f.iva or 0)
        total_general_cents += (f.total or 0)

        lineas_libro.append({
            "item": num_item,
            "fecha": f.fecha_emision.strftime("%Y-%m-%d"),
            "numero_doc": f.numero,
            "codigo_generacion": f.codigo_generacion or f.numero,
            "numero_control": f.numero_control or f.numero,
            "cliente_nombre": cliente_nombre,
            "cliente_nit": cliente_nit,
            "cliente_nrc": cliente_nrc,
            "ventas_exentas": 0.00,
            "ventas_no_sujetas": 0.00,
            "ventas_gravadas_locales": subtotal_usd,
            "debito_fiscal": iva_usd,
            "retencion_iva": 0.00,
            "total_venta": total_usd
        })
        num_item += 1

    return {
        "empresa_id": empresa_id,
        "tipo_libro": "VENTAS_CONTRIBUYENTES_CCF",
        "anio": anio,
        "mes": mes,
        "nombre_mes": calendar.month_name[mes],
        "total_documentos": len(facturas_ccf),
        "lineas": lineas_libro,
        "resumen_totales": {
            "total_exentas": 0.00,
            "total_no_sujetas": 0.00,
            "total_ventas_gravadas": round(total_gravado_cents / 100.0, 2),
            "total_debito_fiscal": round(total_iva_cents / 100.0, 2),
            "total_retenciones": 0.00,
            "total_general_ccf": round(total_general_cents / 100.0, 2)
        }
    }


@router.get("/compras")
def libro_compras(
    empresa_id: str,
    anio: int = Query(..., description="Año a consultar, ej: 2026"),
    mes: int = Query(..., description="Mes a consultar (1-12)"),
    db: Session = Depends(get_db)
):
    """
    Genera el Libro de Compras (Art. 141 C.T. El Salvador).
    Detalla los Comprobantes de Crédito Fiscal de Compras recibidos de Proveedores.
    """
    ordenes_compra = db.query(OrdenCompra).filter(
        OrdenCompra.empresa_id == empresa_id,
        extract('year', OrdenCompra.fecha_emision) == anio,
        extract('month', OrdenCompra.fecha_emision) == mes,
        OrdenCompra.estado.in_(["recibida", "recibida_parcial", "enviada", "borrador"])
    ).order_by(OrdenCompra.fecha_emision.asc(), OrdenCompra.id.asc()).all()

    lineas_libro = []
    num_item = 1

    total_gravado_cents = 0
    total_iva_cents = 0
    total_general_cents = 0

    for oc in ordenes_compra:
        proveedor = db.query(Proveedor).filter(Proveedor.id == oc.proveedor_id).first()
        prov_nombre = proveedor.nombre if proveedor else "Proveedor"
        prov_nit = (proveedor.nit or proveedor.nrc or "N/A") if proveedor else "N/A"
        prov_nrc = (proveedor.nrc or "") if proveedor else ""

        subtotal_usd = round((oc.subtotal or 0) / 100.0, 2)
        iva_usd = round((oc.iva or 0) / 100.0, 2)
        total_usd = round((oc.total or 0) / 100.0, 2)

        if round(subtotal_usd + iva_usd, 2) != total_usd:
            iva_usd = round(total_usd - subtotal_usd, 2)

        total_gravado_cents += (oc.subtotal or 0)
        total_iva_cents += (oc.iva or 0)
        total_general_cents += (oc.total or 0)

        num_doc = oc.num_comprobante or oc.numero

        lineas_libro.append({
            "item": num_item,
            "fecha": oc.fecha_emision.strftime("%Y-%m-%d") if oc.fecha_emision else "-",
            "numero_doc": num_doc,
            "codigo_generacion": oc.codigo_generacion_proveedor or num_doc,
            "proveedor_nombre": prov_nombre,
            "proveedor_nit": prov_nit,
            "proveedor_nrc": prov_nrc,
            "compras_exentas_locales": 0.00,
            "compras_exentas_importacion": 0.00,
            "compras_gravadas_locales": subtotal_usd,
            "compras_gravadas_importacion": 0.00,
            "credito_fiscal": iva_usd,
            "retencion_iva": 0.00,
            "total_compra": total_usd
        })
        num_item += 1

    return {
        "empresa_id": empresa_id,
        "tipo_libro": "LIBRO_COMPRAS",
        "anio": anio,
        "mes": mes,
        "nombre_mes": calendar.month_name[mes],
        "total_documentos": len(ordenes_compra),
        "lineas": lineas_libro,
        "resumen_totales": {
            "total_exentas": 0.00,
            "total_compras_gravadas": round(total_gravado_cents / 100.0, 2),
            "total_credito_fiscal": round(total_iva_cents / 100.0, 2),
            "total_retenciones": 0.00,
            "total_general_compras": round(total_general_cents / 100.0, 2)
        }
    }


@router.get("/resumen-f07")
def resumen_declaracion_f07(
    empresa_id: str,
    anio: int = Query(..., description="Año a consultar, ej: 2026"),
    mes: int = Query(..., description="Mes a consultar (1-12)"),
    db: Session = Depends(get_db)
):
    """
    Genera el Cuadro Resumen Estimado para la Declaración Mensual de IVA F-07 (Ministerio de Hacienda).
    Calcula Débito Fiscal Total vs Crédito Fiscal Total, Impuesto Neto a Pagar / Crédito a Favor y Pago a Cuenta (1.75%).
    """
    cf_data = libro_ventas_consumidor_final(empresa_id, anio, mes, db)
    ccf_data = libro_ventas_contribuyentes(empresa_id, anio, mes, db)
    compras_data = libro_compras(empresa_id, anio, mes, db)

    debito_cf = cf_data["resumen_totales"]["total_debito_fiscal"]
    debito_ccf = ccf_data["resumen_totales"]["total_debito_fiscal"]
    total_debito_fiscal = round(debito_cf + debito_ccf, 2)

    credito_compras = compras_data["resumen_totales"]["total_credito_fiscal"]

    diferencia_iva = round(total_debito_fiscal - credito_compras, 2)
    impuesto_a_pagar = diferencia_iva if diferencia_iva > 0 else 0.00
    saldo_a_favor = abs(diferencia_iva) if diferencia_iva < 0 else 0.00

    ventas_netas_cf = cf_data["resumen_totales"]["total_ventas_netas"]
    ventas_netas_ccf = ccf_data["resumen_totales"]["total_ventas_gravadas"]
    total_ventas_netas = round(ventas_netas_cf + ventas_netas_ccf, 2)

    # Tasa legal estándar de Pago a Cuenta en El Salvador: 1.75% sobre ingresos netos
    pago_a_cuenta_estimado = round(total_ventas_netas * 0.0175, 2)

    total_impuestos_a_pagar_f07 = round(impuesto_a_pagar + pago_a_cuenta_estimado, 2)

    return {
        "empresa_id": empresa_id,
        "anio": anio,
        "mes": mes,
        "nombre_mes": calendar.month_name[mes],
        "debito_fiscal": {
            "ventas_consumidor_final": debito_cf,
            "ventas_credito_fiscal_ccf": debito_ccf,
            "total_debito_fiscal": total_debito_fiscal
        },
        "credito_fiscal": {
            "compras_locales": credito_compras,
            "total_credito_fiscal": credito_compras
        },
        "liquidacion_iva": {
            "diferencia_bruta": diferencia_iva,
            "impuesto_iva_a_pagar": impuesto_a_pagar,
            "saldo_a_favor_remisibles": saldo_a_favor
        },
        "pago_a_cuenta": {
            "base_imponible_ventas_netas": total_ventas_netas,
            "tasa_pago_a_cuenta": "1.75%",
            "monto_pago_a_cuenta": pago_a_cuenta_estimado
        },
        "total_estimado_declaracion_f07": total_impuestos_a_pagar_f07
    }
