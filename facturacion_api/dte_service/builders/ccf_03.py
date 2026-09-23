from models import Factura, ConfiguracionDTE
from dte_service.builders.base import (
    generar_codigo_generacion, 
    generar_numero_control, 
    remove_nulls, 
    numero_a_letras
)
from dte_service.validator.catalogos import obtener_tipo_documento_receptor

def construir_json_dte_03(
    factura: Factura, 
    config: ConfiguracionDTE, 
    punto_venta_cod: str = "0000"
) -> tuple[dict, str, str]:
    """
    Construye el JSON oficial para Comprobante de Crédito Fiscal (DTE-03) según manual DGII / MH El Salvador.
    Returns: (dte_json, codigo_generacion, numero_control)
    """
    config.correlativo_ccf = (config.correlativo_ccf or 0) + 1
    codigo_generacion = generar_codigo_generacion()
    numero_control = generar_numero_control("03", config.establecimiento_cod, punto_venta_cod, config.correlativo_ccf)

    fecha_emi = factura.fecha_emision.strftime("%Y-%m-%d")
    hora_emi = factura.fecha_emision.strftime("%H:%M:%S")

    # 1. Identificación
    identificacion = {
        "version": 3,
        "ambiente": config.ambiente or "00",
        "tipoDte": "03",
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

    # 3. Receptor (Gran Contribuyente o Contribuyente con NIT/NRC)
    cliente = factura.cliente
    tipo_doc_rec, num_doc_rec = obtener_tipo_documento_receptor(cliente)

    receptor = {
        "tipoDocumento": tipo_doc_rec,
        "numDocumento": num_doc_rec,
        "nrc": cliente.nrc if cliente.nrc else "000000",
        "nombre": cliente.nombre if cliente.nombre else "Cliente Contribuyente",
        "codActividad": cliente.actividad_economica_cod or "10005",
        "descActividad": "Actividad Comercial",
        "direccion": {
            "departamento": "06",
            "municipio": "14",
            "complemento": cliente.direccion or "El Salvador"
        },
        "telefono": cliente.telefono,
        "correo": cliente.email
    }

    # 4. Cuerpo de Ítems (En CCF los precios vienen netos de IVA)
    cuerpo = []
    num_item = 1
    total_gravada = 0.0

    for item in factura.items:
        # Si el precio incluye IVA, en CCF se desglosa dividiendo entre 1.13
        subtotal_con_iva = (item.subtotal or 0) / 100.0
        subtotal_neto = round(subtotal_con_iva / 1.13, 2)
        precio_unitario_neto = round(subtotal_neto / float(item.cantidad or 1), 4)
        iva_item = round(subtotal_neto * 0.13, 2)

        total_gravada += subtotal_neto

        cuerpo.append({
            "numItem": num_item,
            "tipoItem": 1,
            "numeroDocumento": None,
            "cantidad": float(item.cantidad or 1),
            "codigo": item.producto.codigo if (item.producto and item.producto.codigo) else f"PROD-{item.id}",
            "uniMedida": 59,
            "descripcion": item.producto.nombre if item.producto else "Producto / Servicio",
            "precioUni": precio_unitario_neto,
            "montoDescu": 0.0,
            "ventaNoSuj": 0.0,
            "ventaExenta": 0.0,
            "ventaGravada": subtotal_neto,
            "tributos": ["20"], # "20" = IVA 13% en CCF
            "psv": 0.0,
            "noGravado": 0.0,
            "ivaItem": iva_item
        })
        num_item += 1

    total_iva = round(total_gravada * 0.13, 2)
    total_operacion = round(total_gravada + total_iva, 2)

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
        "tributos": [
            {
                "codigo": "20",
                "descripcion": "Impuesto al Valor Agregado 13%",
                "valor": total_iva
            }
        ],
        "subTotal": total_gravada,
        "ivaRete1": 0.0,
        "reteRenta": 0.0,
        "montoTotalOperacion": total_operacion,
        "totalNoGravado": 0.0,
        "totalLetras": numero_a_letras(total_operacion),
        "totalIva": total_iva,
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
