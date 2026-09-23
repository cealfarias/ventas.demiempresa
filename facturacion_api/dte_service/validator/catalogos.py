"""
Catálogos Oficiales de la Dirección General de Impuestos Internos (DGII) / Ministerio de Hacienda El Salvador.
Manejo desacoplado en memoria.
"""

CAT_002_TIPO_DOCUMENTO = {
    "01": "Factura Electrónica",
    "03": "Comprobante de Crédito Fiscal",
    "05": "Nota de Crédito",
    "06": "Nota de Débito",
    "11": "Factura de Exportación",
    "14": "Factura de Sujeto Excluido"
}

CAT_012_DEPARTAMENTO = {
    "01": "Ahuachapán",
    "02": "Santa Ana",
    "03": "Sonsonate",
    "04": "Chalatenango",
    "05": "La Libertad",
    "06": "San Salvador",
    "07": "Cuscatlán",
    "08": "La Paz",
    "09": "Cabañas",
    "10": "San Vicente",
    "11": "Usulután",
    "12": "San Miguel",
    "13": "Morazán",
    "14": "La Unión"
}

CAT_013_MUNICIPIO = {
    "0614": "San Salvador Centro",
    "0615": "San Salvador Este",
    "0616": "San Salvador Oeste",
    "0617": "San Salvador Sur",
    "0618": "San Salvador Norte",
    # Mapeo retrocompatible simplificado
    "14": "San Salvador Central",
    "01": "San Salvador Norte",
    "02": "San Salvador Sur"
}

CAT_014_UNIDAD_MEDIDA = {
    59: "Unidad",
    99: "Otra",
    1: "Metro",
    2: "Yarda",
    10: "Kilogramo",
    11: "Libra",
    12: "Onza",
    20: "Litro",
    21: "Galón"
}

CAT_015_TIPO_ITEM = {
    1: "Bienes",
    2: "Servicios",
    3: "Ambos (Bienes y Servicios)",
    4: "Otros tributos por ítem"
}

CAT_022_TIPO_DOCUMENTO_RECEPTOR = {
    "13": "DUI (Documento Único de Identidad)",
    "36": "NIT (Número de Identificación Tributaria)",
    "37": "Pasaporte",
    "03": "Carnet de Residente",
    "99": "Otro"
}

CAT_016_CONDICION_OPERACION = {
    1: "Contado",
    2: "Crédito",
    3: "Otro"
}

CAT_017_FORMA_PAGO = {
    "01": "Billetes y monedas",
    "02": "Tarjeta Débito/Crédito",
    "03": "Cheque",
    "04": "Transferencia bancaria / Depósito",
    "05": "Dinero electrónico / Pago digital"
}

def obtener_tipo_documento_receptor(cliente) -> tuple[str, str]:
    """Retorna (tipoDocumento, numDocumento) formateado según norma MH."""
    if cliente.nit and len(cliente.nit.strip().replace("-", "")) == 14:
        return "36", cliente.nit.strip().replace("-", "")
    elif cliente.dui and len(cliente.dui.strip().replace("-", "")) == 9:
        return "13", cliente.dui.strip().replace("-", "")
    elif cliente.nit:
        return "36", cliente.nit.strip().replace("-", "")
    elif cliente.dui:
        return "13", cliente.dui.strip().replace("-", "")
    else:
        # Fallback Consumidor Final genérico sin documento
        return "36", "00000000000000"
