from datetime import datetime
from models import Factura, ConfiguracionDTE
from dte_service.builders.base import generar_codigo_generacion, remove_nulls

def construir_json_invalidacion(
    factura: Factura, 
    config: ConfiguracionDTE, 
    motivo_anulacion: str = "Rescisión de operación comercial"
) -> tuple[dict, str]:
    """
    Construye el JSON oficial para Evento de Invalidación / Anulación de DTE (Esquema DGII).
    Returns: (invalidacion_json, codigo_generacion_evento)
    """
    codigo_generacion_evento = generar_codigo_generacion()
    fecha_emision_str = factura.fecha_emision.strftime("%Y-%m-%d")
    fecha_anulacion_str = datetime.now().strftime("%Y-%m-%d")
    hora_anulacion_str = datetime.now().strftime("%H:%M:%S")

    tipo_dte_target = "01" if factura.tipo_doc == "FACTURA" else "03"

    identificacion = {
        "version": 2,
        "ambiente": config.ambiente or "00",
        "codigoGeneracion": codigo_generacion_evento,
        "fecAnula": fecha_anulacion_str,
        "horAnula": hora_anulacion_str
    }

    emisor = {
        "nit": config.nit or "00000000000000",
        "nombre": config.nombre_comercial or "Empresa Emisora",
        "tipoEstablecimiento": config.establecimiento_tipo or "02",
        "nomEstablecimiento": config.nombre_comercial or "Sucursal Principal",
        "codEstableMH": config.establecimiento_cod or "0000",
        "codEstable": config.establecimiento_cod or "0000",
        "codPuntoVentaMH": "0000",
        "codPuntoVenta": "0000",
        "telefono": config.telefono or "22000000",
        "correo": config.email or "emisor@empresa.com"
    }

    documento = {
        "tipoDte": tipo_dte_target,
        "codigoGeneracion": factura.codigo_generacion,
        "selloRecibido": factura.sello_recepcion,
        "numeroControl": factura.numero_control,
        "fecEmi": fecha_emision_str,
        "montoIva": round((factura.iva or 0) / 100.0, 2),
        "codigoGeneracionR": None,
        "tipoDocumento": "36" if (factura.cliente and factura.cliente.nit) else "13",
        "numDocumento": (factura.cliente.nit or factura.cliente.dui or "00000000000000") if factura.cliente else "00000000000000",
        "nombre": factura.cliente.nombre if (factura.cliente and factura.cliente.nombre) else "Consumidor Final",
        "telefono": factura.cliente.telefono if factura.cliente else None,
        "correo": factura.cliente.email if factura.cliente else None
    }

    motivo = {
        "tipoAnulacion": 2, # 1: Error en datos, 2: Rescisión, 3: Mora
        "motivoAnulacion": motivo_anulacion or "Rescisión de la transacción",
        "nombreResponsable": "Administrador del Sistema",
        "tipDocResponsable": "13",
        "numDocResponsable": "000000000",
        "nombreSolicita": factura.cliente.nombre if (factura.cliente and factura.cliente.nombre) else "Cliente",
        "tipDocSolicita": "13",
        "numDocSolicita": "000000000"
    }

    invalidacion_dict = {
        "identificacion": identificacion,
        "emisor": emisor,
        "documento": documento,
        "motivo": motivo
    }

    return remove_nulls(invalidacion_dict), codigo_generacion_evento
