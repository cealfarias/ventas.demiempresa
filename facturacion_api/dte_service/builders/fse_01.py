from models import Factura, ConfiguracionDTE
from dte_service.builders.base import (
    generar_codigo_generacion, 
    generar_numero_control, 
    remove_nulls, 
    numero_a_letras
)
from dte_service.validator.catalogos import obtener_tipo_documento_receptor

def construir_json_dte_01(
    factura: Factura, 
    config: ConfiguracionDTE, 
    punto_venta_cod: str = "0000"
) -> tuple[dict, str, str]:
    """
    Construye el JSON oficial para Factura Electrónica (DTE-01) según manual DGII / MH El Salvador.
    Returns: (dte_json, codigo_generacion, numero_control)
    """
    config.correlativo_factura = (config.correlativo_factura or 0) + 1
    codigo_generacion = generar_codigo_generacion()
    numero_control = generar_numero_control("01", config.establecimiento_cod, punto_venta_cod, config.correlativo_factura)

    fecha_emi = factura.fecha_emision.strftime("%Y-%m-%d")
    hora_emi = factura.fecha_emision.strftime("%H:%M:%S")

    # 1. Identificación
    identificacion = {
        "version": 1,
        "ambiente": config.ambiente or "00",
        "tipoDte": "01",
        "numeroControl": numero_control,
        "codigoGeneracion": codigo_generacion,
        "tipoModelo": 1,
        "tipoOperacion": 1,
        "tipoContingencia": None,
        "motivoContin": None,
        "fechaEmi": fecha_emi,
        "horaEmi": hora_emi,
        "tipoMoneda": "USD"
    }

    # 2. Emisor
    emisor = {
        "nit": config.nit or "00000000000000",
        "nrc": config.nrc or "000000",
        "nombre": config.nombre_comercial or "Empresa Emisora",
        "codActividad": config.actividad_economica_cod or "62010",
        "descActividad": config.desc_actividad_economica or "Servicios Informáticos",
        "direccion": {
            "departamento": config.direccion_departamento or "06",
            "municipio": config.direccion_municipio or "14",
            "complemento": config.direccion_complemento or "San Salvador"
        },
        "telefono": config.telefono or "22000000",
        "correo": config.email or "emisor@empresa.com",
        "codEstableMH": config.establecimiento_cod or "0000",
        "codEstable": config.establecimiento_cod or "0000",
        "codPuntoVentaMH": punto_venta_cod or "0000",
        "codPuntoVenta": punto_venta_cod or "0000"
    }

    # 3. Receptor
    cliente = factura.cliente
    tipo_doc_rec, num_doc_rec = obtener_tipo_documento_receptor(cliente)

    receptor = {
        "tipoDocumento": tipo_doc_rec,
        "numDocumento": num_doc_rec,
        "nrc": cliente.nrc if cliente.nrc else None,
        "nombre": cliente.nombre if cliente.nombre else "Consumidor Final",
        "codActividad": cliente.actividad_economica_cod or "10005",
        "descActividad": "Consumidor Final",
        "direccion": {
            "departamento": "06",
            "municipio": "14",
            "complemento": cliente.direccion or "El Salvador"
        },
        "telefono": cliente.telefono,
        "correo": cliente.email
    }

    # 4. Cuerpo de Ítems
    cuerpo = []
    num_item = 1
    total_gravada = 0.0

    for item in factura.items:
        precio_unitario = round((item.precio_unitario or 0) / 100.0, 4)
        subtotal_item = round((item.subtotal or 0) / 100.0, 2)
        total_gravada += subtotal_item

        cuerpo.append({
            "numItem": num_item,
            "tipoItem": 1,
            "numeroDocumento": None,
            "cantidad": float(item.cantidad or 1),
            "codigo": item.producto.codigo if (item.producto and item.producto.codigo) else f"PROD-{item.id}",
            "uniMedida": 59,
            "descripcion": item.producto.nombre if item.producto else "Producto / Servicio",
            "precioUni": precio_unitario,
            "montoDescu": 0.0,
            "ventaNoSuj": 0.0,
            "ventaExenta": 0.0,
            "ventaGravada": subtotal_item,
            "tributos": None,
            "psv": 0.0,
            "noGravado": 0.0,
            "ivaItem": round(subtotal_item * 0.13, 2) # En Factura 01 el precio incluye IVA
        })
        num_item += 1

    total_operacion = round((factura.total or 0) / 100.0, 2)

    # 5. Resumen
    resumen = {
        "totalNoSuj": 0.0,
        "totalExenta": 0.0,
        "totalGravada": total_gravada,
        "subTotalVentas": total_gravada,
        "descuNoSuj": 0.0,
        "descuExenta": 0.0,
        "descuGravada": 0.0,
        "porcentajeDescuento": 0.0,
        "totalDescu": 0.0,
        "tributos": None,
        "subTotal": total_gravada,
        "ivaRete1": 0.0,
        "reteRenta": 0.0,
        "montoTotalOperacion": total_operacion,
        "totalNoGravado": 0.0,
        "totalLetras": numero_a_letras(total_operacion),
        "totalIva": round(total_gravada - (total_gravada / 1.13), 2),
        "saldoFavor": 0.0,
        "condicionOperacion": 1 if factura.condicion_operacion == "CONTADO" else 2,
        "pagos": [
            {
                "codigo": "01",
                "montoPago": total_operacion,
                "referencia": None,
                "plazo": None,
                "periodo": None
            }
        ]
    }

    dte_dict = {
        "identificacion": identificacion,
        "documentoRelacionado": None,
        "emisor": emisor,
        "receptor": receptor,
        "otrosDocumentos": None,
        "ventaTercero": None,
        "cuerpo": cuerpo,
        "resumen": resumen,
        "extension": None,
        "apendice": None
    }

    return remove_nulls(dte_dict), codigo_generacion, numero_control
