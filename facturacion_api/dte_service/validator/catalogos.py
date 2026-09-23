"""
Catálogos Oficiales de la Dirección General de Impuestos Internos (DGII) / Ministerio de Hacienda El Salvador.
Versión 1.1 (Actualizado según Manual Oficial MH).
Flujo Geográfico Requerido: 1. Seleccionar Departamento -> 2. Seleccionar Distrito -> 3. Auto-asignar Municipio.
"""

CAT_001_AMBIENTE = {
    "00": "Modo Prueba (Sandbox)",
    "01": "Modo Producción"
}

CAT_002_TIPO_DOCUMENTO = {
    "01": "Factura Electrónica",
    "03": "Comprobante de Crédito Fiscal",
    "04": "Nota de Remisión",
    "05": "Nota de Crédito",
    "06": "Nota de Débito",
    "07": "Comprobante de Retención",
    "08": "Comprobante de Liquidación",
    "09": "Documento Contable de Liquidación",
    "11": "Factura de Exportación",
    "14": "Factura de Sujeto Excluido",
    "15": "Comprobante de Donación",
    "17": "Evento de Operaciones Especiales",
    "18": "Evento de Retorno"
}

CAT_003_MODELO_FACTURACION = {
    1: "Modelo Facturación Previo",
    2: "Modelo Facturación Diferido (Contingencia)"
}

CAT_004_TIPO_TRANSMISION = {
    1: "Transmisión Normal",
    2: "Transmisión por Contingencia"
}

CAT_005_TIPO_CONTINGENCIA = {
    1: "No disponibilidad de sistema del MH",
    2: "No disponibilidad de sistema del emisor",
    3: "Falla en el suministro de servicio de Internet del Emisor",
    4: "Falla en el suministro de servicio de energía eléctrica del emisor",
    5: "Otro (Especificar motivo)"
}

CAT_006_RETENCION_IVA = {
    "22": "Retención IVA 1%",
    "C4": "Retención IVA 13%",
    "C9": "Otras retenciones IVA casos especiales"
}

CAT_007_TIPO_GENERACION = {
    1: "Físico",
    2: "Electrónico"
}

CAT_009_TIPO_ESTABLECIMIENTO = {
    "01": "Sucursal",
    "02": "Casa Matriz",
    "04": "Bodega",
    "07": "Patio"
}

CAT_011_TIPO_ITEM = {
    1: "Bienes",
    2: "Servicios",
    3: "Ambos (Bienes y Servicios)",
    4: "Otros tributos por ítem"
}

# ── 12. DEPARTAMENTOS (CAT-012) ─────────────────────────────────────────────
CAT_012_DEPARTAMENTO = {
    "00": "Otro (Para extranjeros)",
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

# ── ESTRUCTURA MAPEO: DEPARTAMENTO -> DISTRITOS -> AUTO MUNICIPIO (CAT-008 & CAT-013) ──
ESTRUCTURA_GEOGRAFICA_MH = {
    "01": { # Ahuachapán
        "nombre": "Ahuachapán",
        "distritos": {
            "01": {"nombre": "Ahuachapán", "municipio_cod": "14", "municipio_nombre": "AHUACHAPÁN CENTRO"},
            "02": {"nombre": "Apaneca", "municipio_cod": "14", "municipio_nombre": "AHUACHAPÁN CENTRO"},
            "03": {"nombre": "Atiquizaya", "municipio_cod": "13", "municipio_nombre": "AHUACHAPÁN NORTE"},
            "04": {"nombre": "Concepción de Ataco", "municipio_cod": "14", "municipio_nombre": "AHUACHAPÁN CENTRO"},
            "05": {"nombre": "El Refugio", "municipio_cod": "13", "municipio_nombre": "AHUACHAPÁN NORTE"},
            "06": {"nombre": "Guaymango", "municipio_cod": "15", "municipio_nombre": "AHUACHAPÁN SUR"},
            "07": {"nombre": "Jujutla", "municipio_cod": "15", "municipio_nombre": "AHUACHAPÁN SUR"},
            "08": {"nombre": "San Francisco Menéndez", "municipio_cod": "15", "municipio_nombre": "AHUACHAPÁN SUR"},
            "09": {"nombre": "San Lorenzo", "municipio_cod": "13", "municipio_nombre": "AHUACHAPÁN NORTE"},
            "10": {"nombre": "San Pedro Puxtla", "municipio_cod": "15", "municipio_nombre": "AHUACHAPÁN SUR"},
            "11": {"nombre": "Tacuba", "municipio_cod": "14", "municipio_nombre": "AHUACHAPÁN CENTRO"},
            "12": {"nombre": "Turín", "municipio_cod": "13", "municipio_nombre": "AHUACHAPÁN NORTE"}
        }
    },
    "02": { # Santa Ana
        "nombre": "Santa Ana",
        "distritos": {
            "01": {"nombre": "Candelaria de la Frontera", "municipio_cod": "17", "municipio_nombre": "SANTA ANA OESTE"},
            "02": {"nombre": "Coatepeque", "municipio_cod": "16", "municipio_nombre": "SANTA ANA ESTE"},
            "03": {"nombre": "Chalchuapa", "municipio_cod": "17", "municipio_nombre": "SANTA ANA OESTE"},
            "04": {"nombre": "El Congo", "municipio_cod": "16", "municipio_nombre": "SANTA ANA ESTE"},
            "05": {"nombre": "El Porvenir", "municipio_cod": "17", "municipio_nombre": "SANTA ANA OESTE"},
            "06": {"nombre": "Masahuat", "municipio_cod": "14", "municipio_nombre": "SANTA ANA NORTE"},
            "07": {"nombre": "Metapán", "municipio_cod": "14", "municipio_nombre": "SANTA ANA NORTE"},
            "08": {"nombre": "San Antonio Pajonal", "municipio_cod": "14", "municipio_nombre": "SANTA ANA NORTE"},
            "09": {"nombre": "San Sebastián Salitrillo", "municipio_cod": "17", "municipio_nombre": "SANTA ANA OESTE"},
            "10": {"nombre": "Santa Ana", "municipio_cod": "15", "municipio_nombre": "SANTA ANA CENTRO"},
            "11": {"nombre": "Santa Rosa Guachipilín", "municipio_cod": "14", "municipio_nombre": "SANTA ANA NORTE"},
            "12": {"nombre": "Santiago de la Frontera", "municipio_cod": "17", "municipio_nombre": "SANTA ANA OESTE"},
            "13": {"nombre": "Texistepeque", "municipio_cod": "17", "municipio_nombre": "SANTA ANA OESTE"}
        }
    },
    "03": { # Sonsonate
        "nombre": "Sonsonate",
        "distritos": {
            "01": {"nombre": "Acajutla", "municipio_cod": "20", "municipio_nombre": "SONSONATE OESTE"},
            "02": {"nombre": "Armenia", "municipio_cod": "19", "municipio_nombre": "SONSONATE ESTE"},
            "03": {"nombre": "Caluco", "municipio_cod": "19", "municipio_nombre": "SONSONATE ESTE"},
            "04": {"nombre": "Cuisnahuat", "municipio_cod": "19", "municipio_nombre": "SONSONATE ESTE"},
            "05": {"nombre": "Santa Isabel Ishuatán", "municipio_cod": "19", "municipio_nombre": "SONSONATE ESTE"},
            "06": {"nombre": "Izalco", "municipio_cod": "19", "municipio_nombre": "SONSONATE ESTE"},
            "07": {"nombre": "Juayúa", "municipio_cod": "17", "municipio_nombre": "SONSONATE NORTE"},
            "08": {"nombre": "Nahuizalco", "municipio_cod": "17", "municipio_nombre": "SONSONATE NORTE"},
            "09": {"nombre": "Nahulingo", "municipio_cod": "18", "municipio_nombre": "SONSONATE CENTRO"},
            "10": {"nombre": "Salcoatitán", "municipio_cod": "17", "municipio_nombre": "SONSONATE NORTE"},
            "11": {"nombre": "San Antonio del Monte", "municipio_cod": "18", "municipio_nombre": "SONSONATE CENTRO"},
            "12": {"nombre": "San Julián", "municipio_cod": "19", "municipio_nombre": "SONSONATE ESTE"},
            "13": {"nombre": "Santa Catarina Masahuat", "municipio_cod": "17", "municipio_nombre": "SONSONATE NORTE"},
            "14": {"nombre": "Santo Domingo Guzmán", "municipio_cod": "18", "municipio_nombre": "SONSONATE CENTRO"},
            "15": {"nombre": "Sonsonate", "municipio_cod": "18", "municipio_nombre": "SONSONATE CENTRO"},
            "16": {"nombre": "Sonzacate", "municipio_cod": "18", "municipio_nombre": "SONSONATE CENTRO"}
        }
    },
    "04": { # Chalatenango
        "nombre": "Chalatenango",
        "distritos": {
            "01": {"nombre": "Agua Caliente", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "02": {"nombre": "Arcatao", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "03": {"nombre": "Azacualpa", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "04": {"nombre": "Citalá", "municipio_cod": "34", "municipio_nombre": "CHALATENANGO NORTE"},
            "05": {"nombre": "Comalapa", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "06": {"nombre": "Concepción Quezaltepeque", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "07": {"nombre": "Chalatenango", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "08": {"nombre": "Dulce Nombre de María", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "09": {"nombre": "El Carrizal", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "10": {"nombre": "El Paraíso", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "11": {"nombre": "La Laguna", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "12": {"nombre": "La Palma", "municipio_cod": "34", "municipio_nombre": "CHALATENANGO NORTE"},
            "13": {"nombre": "La Reina", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "14": {"nombre": "Las Vueltas", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "15": {"nombre": "Nombre de Jesús", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "16": {"nombre": "Nueva Concepción", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "17": {"nombre": "Nueva Trinidad", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "18": {"nombre": "Ojos de Agua", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "19": {"nombre": "Potonico", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "20": {"nombre": "San Antonio de la Cruz", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "21": {"nombre": "San Antonio Los Ranchos", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "22": {"nombre": "San Fernando", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "23": {"nombre": "San Francisco Lempa", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "24": {"nombre": "San Francisco Morazán", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "25": {"nombre": "San Ignacio", "municipio_cod": "34", "municipio_nombre": "CHALATENANGO NORTE"},
            "26": {"nombre": "San Isidro Labrador", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "27": {"nombre": "San José Cancasque", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "28": {"nombre": "San José Flores", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "29": {"nombre": "San Luis del Carmen", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "30": {"nombre": "San Miguel de Mercedes", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"},
            "31": {"nombre": "San Rafael", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "32": {"nombre": "Santa Rita", "municipio_cod": "35", "municipio_nombre": "CHALATENANGO CENTRO"},
            "33": {"nombre": "Tejutla", "municipio_cod": "36", "municipio_nombre": "CHALATENANGO SUR"}
        }
    },
    "05": { # La Libertad
        "nombre": "La Libertad",
        "distritos": {
            "01": {"nombre": "Antiguo Cuscatlán", "municipio_cod": "26", "municipio_nombre": "LA LIBERTAD ESTE"},
            "02": {"nombre": "Ciudad Arce", "municipio_cod": "24", "municipio_nombre": "LA LIBERTAD CENTRO"},
            "03": {"nombre": "Colón", "municipio_cod": "25", "municipio_nombre": "LA LIBERTAD OESTE"},
            "04": {"nombre": "Comasagua", "municipio_cod": "28", "municipio_nombre": "LA LIBERTAD SUR"},
            "05": {"nombre": "Chiltiupán", "municipio_cod": "27", "municipio_nombre": "LA LIBERTAD COSTA"},
            "06": {"nombre": "Huizúcar", "municipio_cod": "26", "municipio_nombre": "LA LIBERTAD ESTE"},
            "07": {"nombre": "Jayaque", "municipio_cod": "25", "municipio_nombre": "LA LIBERTAD OESTE"},
            "08": {"nombre": "Jicalapa", "municipio_cod": "27", "municipio_nombre": "LA LIBERTAD COSTA"},
            "09": {"nombre": "La Libertad", "municipio_cod": "27", "municipio_nombre": "LA LIBERTAD COSTA"},
            "10": {"nombre": "Nuevo Cuscatlán", "municipio_cod": "26", "municipio_nombre": "LA LIBERTAD ESTE"},
            "11": {"nombre": "Santa Tecla", "municipio_cod": "26", "municipio_nombre": "LA LIBERTAD ESTE"},
            "12": {"nombre": "Quezaltepeque", "municipio_cod": "23", "municipio_nombre": "LA LIBERTAD NORTE"},
            "13": {"nombre": "Sacacoyo", "municipio_cod": "25", "municipio_nombre": "LA LIBERTAD OESTE"},
            "14": {"nombre": "San José Villanueva", "municipio_cod": "28", "municipio_nombre": "LA LIBERTAD SUR"},
            "15": {"nombre": "San Juan Opico", "municipio_cod": "24", "municipio_nombre": "LA LIBERTAD CENTRO"},
            "16": {"nombre": "San Matías", "municipio_cod": "23", "municipio_nombre": "LA LIBERTAD NORTE"},
            "17": {"nombre": "San Pablo Tacachico", "municipio_cod": "23", "municipio_nombre": "LA LIBERTAD NORTE"},
            "18": {"nombre": "Tamanique", "municipio_cod": "27", "municipio_nombre": "LA LIBERTAD COSTA"},
            "19": {"nombre": "Talnique", "municipio_cod": "25", "municipio_nombre": "LA LIBERTAD OESTE"},
            "20": {"nombre": "Teotepeque", "municipio_cod": "27", "municipio_nombre": "LA LIBERTAD COSTA"},
            "21": {"nombre": "Tepecoyo", "municipio_cod": "25", "municipio_nombre": "LA LIBERTAD OESTE"},
            "22": {"nombre": "Zaragoza", "municipio_cod": "26", "municipio_nombre": "LA LIBERTAD ESTE"}
        }
    },
    "06": { # San Salvador
        "nombre": "San Salvador",
        "distritos": {
            "01": {"nombre": "Aguilares", "municipio_cod": "20", "municipio_nombre": "SAN SALVADOR NORTE"},
            "02": {"nombre": "Apopa", "municipio_cod": "21", "municipio_nombre": "SAN SALVADOR OESTE"},
            "03": {"nombre": "Ayutuxtepeque", "municipio_cod": "23", "municipio_nombre": "SAN SALVADOR CENTRO"},
            "04": {"nombre": "Cuscatancingo", "municipio_cod": "23", "municipio_nombre": "SAN SALVADOR CENTRO"},
            "05": {"nombre": "El Paisnal", "municipio_cod": "20", "municipio_nombre": "SAN SALVADOR NORTE"},
            "06": {"nombre": "Guazapa", "municipio_cod": "20", "municipio_nombre": "SAN SALVADOR NORTE"},
            "07": {"nombre": "Ilopango", "municipio_cod": "22", "municipio_nombre": "SAN SALVADOR ESTE"},
            "08": {"nombre": "Mejicanos", "municipio_cod": "23", "municipio_nombre": "SAN SALVADOR CENTRO"},
            "09": {"nombre": "Nejapa", "municipio_cod": "21", "municipio_nombre": "SAN SALVADOR OESTE"},
            "10": {"nombre": "Panchimalco", "municipio_cod": "24", "municipio_nombre": "SAN SALVADOR SUR"},
            "11": {"nombre": "Rosario de Mora", "municipio_cod": "24", "municipio_nombre": "SAN SALVADOR SUR"},
            "12": {"nombre": "San Marcos", "municipio_cod": "24", "municipio_nombre": "SAN SALVADOR SUR"},
            "13": {"nombre": "San Martín", "municipio_cod": "22", "municipio_nombre": "SAN SALVADOR ESTE"},
            "14": {"nombre": "San Salvador", "municipio_cod": "23", "municipio_nombre": "SAN SALVADOR CENTRO"},
            "15": {"nombre": "Santiago Texacuangos", "municipio_cod": "24", "municipio_nombre": "SAN SALVADOR SUR"},
            "16": {"nombre": "Santo Tomás", "municipio_cod": "24", "municipio_nombre": "SAN SALVADOR SUR"},
            "17": {"nombre": "Soyapango", "municipio_cod": "22", "municipio_nombre": "SAN SALVADOR ESTE"},
            "18": {"nombre": "Tonacatepeque", "municipio_cod": "22", "municipio_nombre": "SAN SALVADOR ESTE"},
            "19": {"nombre": "Ciudad Delgado", "municipio_cod": "23", "municipio_nombre": "SAN SALVADOR CENTRO"}
        }
    },
    "07": { # Cuscatlán
        "nombre": "Cuscatlán",
        "distritos": {
            "01": {"nombre": "Candelaria", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "02": {"nombre": "Cojutepeque", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "03": {"nombre": "El Carmen", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "04": {"nombre": "El Rosario", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "05": {"nombre": "Monte San Juan", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "06": {"nombre": "Oratorio de Concepción", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "07": {"nombre": "San Bartolomé Perulapía", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "08": {"nombre": "San Cristóbal", "municipio_cod": "17", "municipio_nombre": "CUSCATLÁN NORTE"},
            "09": {"nombre": "San José Guayabal", "municipio_cod": "17", "municipio_nombre": "CUSCATLÁN NORTE"},
            "10": {"nombre": "San Pedro Perulapán", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "11": {"nombre": "San Rafael Cedros", "municipio_cod": "17", "municipio_nombre": "CUSCATLÁN NORTE"},
            "12": {"nombre": "San Ramón", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "13": {"nombre": "Santa Cruz Analquito", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "14": {"nombre": "Santa Cruz Michapa", "municipio_cod": "18", "municipio_nombre": "CUSCATLÁN SUR"},
            "15": {"nombre": "Suchitoto", "municipio_cod": "17", "municipio_nombre": "CUSCATLÁN NORTE"},
            "16": {"nombre": "Tenancingo", "municipio_cod": "17", "municipio_nombre": "CUSCATLÁN NORTE"}
        }
    },
    "08": { # La Paz
        "nombre": "La Paz",
        "distritos": {
            "01": {"nombre": "Cuyultitán", "municipio_cod": "23", "municipio_nombre": "LA PAZ OESTE"},
            "02": {"nombre": "El Rosario", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "03": {"nombre": "Jerusalén", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "04": {"nombre": "Merced La Ceiba", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "05": {"nombre": "Olocuilta", "municipio_cod": "23", "municipio_nombre": "LA PAZ OESTE"},
            "06": {"nombre": "Paraíso Osorio", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "07": {"nombre": "San Antonio Masahuat", "municipio_cod": "23", "municipio_nombre": "LA PAZ OESTE"},
            "08": {"nombre": "San Emigdio", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "09": {"nombre": "San Francisco Chinameca", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "10": {"nombre": "San Juan Nonualco", "municipio_cod": "25", "municipio_nombre": "LA PAZ ESTE"},
            "11": {"nombre": "San Juan Talpa", "municipio_cod": "23", "municipio_nombre": "LA PAZ OESTE"},
            "12": {"nombre": "San Juan Tepezontes", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "13": {"nombre": "San Luis Talpa", "municipio_cod": "23", "municipio_nombre": "LA PAZ OESTE"},
            "14": {"nombre": "San Miguel Tepezontes", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "15": {"nombre": "San Pedro Masahuat", "municipio_cod": "23", "municipio_nombre": "LA PAZ OESTE"},
            "16": {"nombre": "San Pedro Nonualco", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "17": {"nombre": "San Rafael Obrajuelo", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "18": {"nombre": "Santa María Ostuma", "municipio_cod": "24", "municipio_nombre": "LA PAZ CENTRO"},
            "19": {"nombre": "Santiago Nonualco", "municipio_cod": "25", "municipio_nombre": "LA PAZ ESTE"},
            "20": {"nombre": "Tapalhuaca", "municipio_cod": "23", "municipio_nombre": "LA PAZ OESTE"},
            "21": {"nombre": "Zacatecoluca", "municipio_cod": "25", "municipio_nombre": "LA PAZ ESTE"},
            "22": {"nombre": "San Luis La Herradura", "municipio_cod": "25", "municipio_nombre": "LA PAZ ESTE"}
        }
    },
    "09": { # Cabañas
        "nombre": "Cabañas",
        "distritos": {
            "01": {"nombre": "Cinquera", "municipio_cod": "11", "municipio_nombre": "CABAÑAS OESTE"},
            "02": {"nombre": "Guacotecti", "municipio_cod": "11", "municipio_nombre": "CABAÑAS OESTE"},
            "03": {"nombre": "Ilobasco", "municipio_cod": "11", "municipio_nombre": "CABAÑAS OESTE"},
            "04": {"nombre": "Jutiapa", "municipio_cod": "10", "municipio_nombre": "CABAÑAS ESTE"},
            "05": {"nombre": "San Isidro", "municipio_cod": "11", "municipio_nombre": "CABAÑAS OESTE"},
            "06": {"nombre": "Sensuntepeque", "municipio_cod": "10", "municipio_nombre": "CABAÑAS ESTE"},
            "07": {"nombre": "Tejutepeque", "municipio_cod": "10", "municipio_nombre": "CABAÑAS ESTE"},
            "08": {"nombre": "Victoria", "municipio_cod": "10", "municipio_nombre": "CABAÑAS ESTE"},
            "09": {"nombre": "Dolores", "municipio_cod": "10", "municipio_nombre": "CABAÑAS ESTE"}
        }
    },
    "10": { # San Vicente
        "nombre": "San Vicente",
        "distritos": {
            "01": {"nombre": "Apastepeque", "municipio_cod": "14", "municipio_nombre": "SAN VICENTE NORTE"},
            "02": {"nombre": "Guadalupe", "municipio_cod": "15", "municipio_nombre": "SAN VICENTE SUR"},
            "03": {"nombre": "San Cayetano Istepeque", "municipio_cod": "15", "municipio_nombre": "SAN VICENTE SUR"},
            "04": {"nombre": "Santa Clara", "municipio_cod": "14", "municipio_nombre": "SAN VICENTE NORTE"},
            "05": {"nombre": "Santo Domingo", "municipio_cod": "14", "municipio_nombre": "SAN VICENTE NORTE"},
            "06": {"nombre": "San Esteban Catarina", "municipio_cod": "14", "municipio_nombre": "SAN VICENTE NORTE"},
            "07": {"nombre": "San Ildefonso", "municipio_cod": "14", "municipio_nombre": "SAN VICENTE NORTE"},
            "08": {"nombre": "San Lorenzo", "municipio_cod": "14", "municipio_nombre": "SAN VICENTE NORTE"},
            "09": {"nombre": "San Sebastián", "municipio_cod": "14", "municipio_nombre": "SAN VICENTE NORTE"},
            "10": {"nombre": "San Vicente", "municipio_cod": "15", "municipio_nombre": "SAN VICENTE SUR"},
            "11": {"nombre": "Tecoluca", "municipio_cod": "15", "municipio_nombre": "SAN VICENTE SUR"},
            "12": {"nombre": "Tepetitán", "municipio_cod": "15", "municipio_nombre": "SAN VICENTE SUR"},
            "13": {"nombre": "Verapaz", "municipio_cod": "15", "municipio_nombre": "SAN VICENTE SUR"}
        }
    },
    "11": { # Usulután
        "nombre": "Usulután",
        "distritos": {
            "01": {"nombre": "Alegría", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "02": {"nombre": "Berlín", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "03": {"nombre": "California", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "04": {"nombre": "Concepción Batres", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "05": {"nombre": "El Triunfo", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "06": {"nombre": "Ereguayquín", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "07": {"nombre": "Estanzuelas", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "08": {"nombre": "Jiquilisco", "municipio_cod": "26", "municipio_nombre": "USULUTÁN OESTE"},
            "09": {"nombre": "Jucuapa", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "10": {"nombre": "Jucuarán", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "11": {"nombre": "Mercedes Umaña", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "12": {"nombre": "Nueva Granada", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "13": {"nombre": "Ozatlán", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "14": {"nombre": "Puerto El Triunfo", "municipio_cod": "26", "municipio_nombre": "USULUTÁN OESTE"},
            "15": {"nombre": "San Agustín", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "16": {"nombre": "San Buenaventura", "municipio_cod": "26", "municipio_nombre": "USULUTÁN OESTE"},
            "17": {"nombre": "San Dionisio", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "18": {"nombre": "Santa Elena", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "19": {"nombre": "San Francisco Javier", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "20": {"nombre": "Santa María", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "21": {"nombre": "Santiago de María", "municipio_cod": "24", "municipio_nombre": "USULUTÁN NORTE"},
            "22": {"nombre": "Tecapán", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"},
            "23": {"nombre": "Usulután", "municipio_cod": "25", "municipio_nombre": "USULUTÁN ESTE"}
        }
    },
    "12": { # San Miguel
        "nombre": "San Miguel",
        "distritos": {
            "01": {"nombre": "Carolina", "municipio_cod": "21", "municipio_nombre": "SAN MIGUEL NORTE"},
            "02": {"nombre": "Ciudad Barrios", "municipio_cod": "21", "municipio_nombre": "SAN MIGUEL NORTE"},
            "03": {"nombre": "Comacarán", "municipio_cod": "22", "municipio_nombre": "SAN MIGUEL CENTRO"},
            "04": {"nombre": "Chapeltique", "municipio_cod": "21", "municipio_nombre": "SAN MIGUEL NORTE"},
            "05": {"nombre": "Chinameca", "municipio_cod": "22", "municipio_nombre": "SAN MIGUEL CENTRO"},
            "06": {"nombre": "Chirilagua", "municipio_cod": "22", "municipio_nombre": "SAN MIGUEL CENTRO"},
            "07": {"nombre": "El Tránsito", "municipio_cod": "22", "municipio_nombre": "SAN MIGUEL CENTRO"},
            "08": {"nombre": "Lolotique", "municipio_cod": "23", "municipio_nombre": "SAN MIGUEL OESTE"},
            "09": {"nombre": "Moncagua", "municipio_cod": "22", "municipio_nombre": "SAN MIGUEL CENTRO"},
            "10": {"nombre": "Nueva Guadalupe", "municipio_cod": "23", "municipio_nombre": "SAN MIGUEL OESTE"},
            "11": {"nombre": "Nuevo Edén de San Juan", "municipio_cod": "21", "municipio_nombre": "SAN MIGUEL NORTE"},
            "12": {"nombre": "Quelepa", "municipio_cod": "22", "municipio_nombre": "SAN MIGUEL CENTRO"},
            "13": {"nombre": "San Antonio del Mosco", "municipio_cod": "23", "municipio_nombre": "SAN MIGUEL OESTE"},
            "14": {"nombre": "San Gerardo", "municipio_cod": "21", "municipio_nombre": "SAN MIGUEL NORTE"},
            "15": {"nombre": "San Jorge", "municipio_cod": "23", "municipio_nombre": "SAN MIGUEL OESTE"},
            "16": {"nombre": "San Luis de la Reina", "municipio_cod": "21", "municipio_nombre": "SAN MIGUEL NORTE"},
            "17": {"nombre": "San Miguel", "municipio_cod": "22", "municipio_nombre": "SAN MIGUEL CENTRO"},
            "18": {"nombre": "San Rafael Oriente", "municipio_cod": "23", "municipio_nombre": "SAN MIGUEL OESTE"},
            "19": {"nombre": "Sesori", "municipio_cod": "21", "municipio_nombre": "SAN MIGUEL NORTE"},
            "20": {"nombre": "Uluazapa", "municipio_cod": "23", "municipio_nombre": "SAN MIGUEL OESTE"}
        }
    },
    "13": { # Morazán
        "nombre": "Morazán",
        "distritos": {
            "01": {"nombre": "Arambala", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "02": {"nombre": "Cacaopera", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "03": {"nombre": "Corinto", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "04": {"nombre": "Chilanga", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "05": {"nombre": "Delicias de Concepción", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "06": {"nombre": "El Divisadero", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "07": {"nombre": "El Rosario", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "08": {"nombre": "Gualococti", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "09": {"nombre": "Guatajiagua", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "10": {"nombre": "Joateca", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "11": {"nombre": "Jocoaitique", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "12": {"nombre": "Jocoro", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "13": {"nombre": "Lolotiquillo", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "14": {"nombre": "Meanguera", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "15": {"nombre": "Osicala", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "16": {"nombre": "Perquín", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "17": {"nombre": "San Carlos", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "18": {"nombre": "San Fernando", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "19": {"nombre": "San Francisco Gotera", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "20": {"nombre": "San Isidro", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "21": {"nombre": "San Simón", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "22": {"nombre": "Sensembra", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "23": {"nombre": "Sociedad", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "24": {"nombre": "Torola", "municipio_cod": "27", "municipio_nombre": "MORAZÁN NORTE"},
            "25": {"nombre": "Yamabal", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"},
            "26": {"nombre": "Yoloaiquín", "municipio_cod": "28", "municipio_nombre": "MORAZÁN SUR"}
        }
    },
    "14": { # La Unión
        "nombre": "La Unión",
        "distritos": {
            "01": {"nombre": "Anamorós", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "02": {"nombre": "Bolívar", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "03": {"nombre": "Concepción de Oriente", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "04": {"nombre": "Conchagua", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "05": {"nombre": "El Carmen", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "06": {"nombre": "El Sauce", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "07": {"nombre": "Intipucá", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "08": {"nombre": "La Unión", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "09": {"nombre": "Lislique", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "10": {"nombre": "Meanguera del Golfo", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "11": {"nombre": "Nueva Esparta", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "12": {"nombre": "Pasaquina", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "13": {"nombre": "Polorós", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "14": {"nombre": "San Alejo", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "15": {"nombre": "San José", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "16": {"nombre": "Santa Rosa de Lima", "municipio_cod": "19", "municipio_nombre": "LA UNIÓN NORTE"},
            "17": {"nombre": "Yayantique", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"},
            "18": {"nombre": "Yucuaiquín", "municipio_cod": "20", "municipio_nombre": "LA UNIÓN SUR"}
        }
    }
}

CAT_014_UNIDAD_MEDIDA = {
    59: "Unidad",
    99: "Otra",
    1: "Metro",
    2: "Yarda",
    6: "Milímetro",
    9: "Kilómetro cuadrado",
    10: "Hectárea",
    13: "Metro cuadrado",
    15: "Vara cuadrada",
    18: "Metro cúbico",
    20: "Barril",
    22: "Galón",
    23: "Litro",
    24: "Botella",
    26: "Mililitro",
    30: "Tonelada",
    32: "Quintal (100 lb)",
    33: "Arroba (25 lb)",
    34: "Kilogramo",
    36: "Libra",
    37: "Onza troy",
    38: "Onza",
    39: "Gramo",
    40: "Miligramo",
    42: "Megawatt",
    43: "Kilowatt",
    44: "Watt",
    45: "Megavoltio-amperio",
    46: "Kilovoltio-amperio",
    47: "Voltio-amperio",
    49: "Gigawatt-hora",
    50: "Megawatt-hora",
    51: "Kilowatt-hora",
    52: "Watt-hora",
    53: "Kilovoltio",
    54: "Voltio",
    55: "Millar",
    56: "Medio millar",
    57: "Ciento",
    58: "Docena"
}

CAT_015_TRIBUTOS = {
    "20": "Impuesto al Valor Agregado 13%",
    "C3": "Impuesto al Valor Agregado (exportaciones) 0%",
    "59": "Turismo: por alojamiento (5%)",
    "71": "Turismo: salida del país por vía aérea $7.00",
    "D1": "FOVIAL ($0.20 Ctvs. por galón)",
    "C8": "COTRANS ($0.10 Ctvs. por galón)",
    "D5": "Otras tasas casos especiales",
    "D4": "Otros impuestos casos especiales"
}

CAT_016_CONDICION_OPERACION = {
    1: "Contado",
    2: "A crédito",
    3: "Otro"
}

CAT_017_FORMA_PAGO = {
    "01": "Billetes y monedas",
    "02": "Tarjeta Débito",
    "03": "Tarjeta Crédito",
    "04": "Cheque",
    "05": "Transferencia-Depósito Bancario",
    "08": "Dinero electrónico",
    "09": "Monedero electrónico",
    "11": "Bitcoin",
    "12": "Otras Criptomonedas",
    "13": "Cuentas por pagar del receptor",
    "14": "Giro bancario",
    "99": "Otros"
}

CAT_018_PLAZO = {
    "01": "Días",
    "02": "Meses",
    "03": "Años"
}

CAT_022_TIPO_DOCUMENTO_RECEPTOR = {
    "13": "DUI (Documento Único de Identidad)",
    "36": "NIT (Número de Identificación Tributaria)",
    "37": "Otro",
    "03": "Pasaporte",
    "02": "Carnet de Residente"
}

CAT_024_MOTIVO_EVENTO = {
    1: "Error en la Información del Documento Tributario Electrónico a invalidar",
    2: "Rescindir de la operación realizada",
    3: "Otro"
}

CAT_029_TIPO_PERSONA = {
    1: "Persona Natural",
    2: "Persona Jurídica"
}

CAT_030_TRANSPORTE = {
    1: "TERRESTRE",
    2: "AÉREO",
    3: "MARÍTIMO",
    4: "FERREO",
    5: "MULTIMODAL",
    6: "CORREO"
}

CAT_032_DOMICILIO_FISCAL = {
    1: "Domiciliado",
    2: "No Domiciliado"
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
        return "36", "00000000000000"

def obtener_geografia_exacta() -> dict:
    """
    Retorna la estructura jerárquica exacta requerida:
    1. Seleccionar Departamento -> 2. Filtrar Distritos -> 3. Auto-asignar Municipio.
    """
    departamentos = []
    for depto_id, depto_info in ESTRUCTURA_GEOGRAFICA_MH.items():
        distritos = []
        for dist_id, dist_info in depto_info["distritos"].items():
            distritos.append({
                "codigo_distrito": dist_id,
                "nombre_distrito": dist_info["nombre"],
                "municipio_cod": dist_info["municipio_cod"],
                "municipio_nombre": dist_info["municipio_nombre"]
            })
        departamentos.append({
            "codigo_departamento": depto_id,
            "nombre_departamento": depto_info["nombre"],
            "distritos": distritos
        })
    return {"departamentos": departamentos}
