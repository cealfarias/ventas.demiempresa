"""
Catálogos Oficiales de la Dirección General de Impuestos Internos (DGII) / Ministerio de Hacienda El Salvador.
Versión 1.1 (Actualizado según Manual Oficial MH).
Incluye Jerarquía completa: Departamentos (CAT-012) -> Municipios (CAT-013) -> Distritos (CAT-008).
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

# ── 13. MUNICIPIOS POR DEPARTAMENTO (CAT-013 V1.1 Reestructuración) ──────────
DEPARTAMENTOS_MUNICIPIOS_DISTRITOS = {
    "01": { # Ahuachapán
        "nombre": "Ahuachapán",
        "municipios": {
            "13": {
                "nombre": "AHUACHAPÁN NORTE",
                "distritos": {
                    "03": "Atiquizaya",
                    "05": "El Refugio",
                    "09": "San Lorenzo",
                    "12": "Turín"
                }
            },
            "14": {
                "nombre": "AHUACHAPÁN CENTRO",
                "distritos": {
                    "01": "Ahuachapán",
                    "02": "Apaneca",
                    "04": "Concepción de Ataco",
                    "11": "Tacuba"
                }
            },
            "15": {
                "nombre": "AHUACHAPÁN SUR",
                "distritos": {
                    "06": "Guaymango",
                    "07": "Jujutla",
                    "08": "San Francisco Menéndez",
                    "10": "San Pedro Puxtla"
                }
            }
        }
    },
    "02": { # Santa Ana
        "nombre": "Santa Ana",
        "municipios": {
            "14": {
                "nombre": "SANTA ANA NORTE",
                "distritos": {
                    "06": "Masahuat",
                    "07": "Metapán",
                    "08": "San Antonio Pajonal",
                    "11": "Santa Rosa Guachipilín"
                }
            },
            "15": {
                "nombre": "SANTA ANA CENTRO",
                "distritos": {
                    "10": "Santa Ana"
                }
            },
            "16": {
                "nombre": "SANTA ANA ESTE",
                "distritos": {
                    "02": "Coatepeque",
                    "04": "El Congo"
                }
            },
            "17": {
                "nombre": "SANTA ANA OESTE",
                "distritos": {
                    "01": "Candelaria de la Frontera",
                    "03": "Chalchuapa",
                    "05": "El Porvenir",
                    "09": "San Sebastián Salitrillo",
                    "12": "Santiago de la Frontera",
                    "13": "Texistepeque"
                }
            }
        }
    },
    "03": { # Sonsonate
        "nombre": "Sonsonate",
        "municipios": {
            "17": {
                "nombre": "SONSONATE NORTE",
                "distritos": {
                    "07": "Juayúa",
                    "08": "Nahuizalco",
                    "10": "Salcoatitán",
                    "14": "Santa Catarina Masahuat"
                }
            },
            "18": {
                "nombre": "SONSONATE CENTRO",
                "distritos": {
                    "15": "Sonsonate",
                    "16": "Sonzacate",
                    "09": "Nahulingo",
                    "11": "San Antonio del Monte",
                    "13": "Santo Domingo Guzmán"
                }
            },
            "19": {
                "nombre": "SONSONATE ESTE",
                "distritos": {
                    "02": "Armenia",
                    "03": "Caluco",
                    "04": "Cuisnahuat",
                    "05": "Santa Isabel Ishuatán",
                    "06": "Izalco",
                    "12": "San Julián"
                }
            },
            "20": {
                "nombre": "SONSONATE OESTE",
                "distritos": {
                    "01": "Acajutla"
                }
            }
        }
    },
    "04": { # Chalatenango
        "nombre": "Chalatenango",
        "municipios": {
            "34": {
                "nombre": "CHALATENANGO NORTE",
                "distritos": {
                    "04": "Citalá",
                    "12": "La Palma",
                    "25": "San Ignacio"
                }
            },
            "35": {
                "nombre": "CHALATENANGO CENTRO",
                "distritos": {
                    "01": "Agua Caliente",
                    "06": "Concepción Quezaltepeque",
                    "07": "Chalatenango",
                    "08": "Dulce Nombre de María",
                    "09": "El Carrizal",
                    "10": "El Paraíso",
                    "11": "La Laguna",
                    "13": "La Reina",
                    "14": "Las Vueltas",
                    "28": "San José Cancasque",
                    "31": "San Rafael",
                    "32": "Santa Rita"
                }
            },
            "36": {
                "nombre": "CHALATENANGO SUR",
                "distritos": {
                    "02": "Arcatao",
                    "03": "Azacualpa",
                    "05": "Comalapa",
                    "15": "Nombre de Jesús",
                    "16": "Nueva Concepción",
                    "17": "Nueva Trinidad",
                    "18": "Ojos de Agua",
                    "19": "Potonico",
                    "20": "San Antonio de la Cruz",
                    "21": "San Antonio Los Ranchos",
                    "22": "San Fernando",
                    "23": "San Francisco Lempa",
                    "24": "San Francisco Morazán",
                    "26": "San Isidro Labrador",
                    "27": "San José Flores",
                    "29": "San Luis del Carmen",
                    "30": "San Miguel de Mercedes",
                    "33": "Tejutla"
                }
            }
        }
    },
    "05": { # La Libertad
        "nombre": "La Libertad",
        "municipios": {
            "23": {
                "nombre": "LA LIBERTAD NORTE",
                "distritos": {
                    "12": "Quezaltepeque",
                    "16": "San Matías",
                    "17": "San Pablo Tacachico"
                }
            },
            "24": {
                "nombre": "LA LIBERTAD CENTRO",
                "distritos": {
                    "02": "Ciudad Arce",
                    "15": "San Juan Opico"
                }
            },
            "25": {
                "nombre": "LA LIBERTAD OESTE",
                "distritos": {
                    "03": "Colón",
                    "07": "Jayaque",
                    "13": "Sacacoyo",
                    "19": "Talnique",
                    "21": "Tepecoyo"
                }
            },
            "26": {
                "nombre": "LA LIBERTAD ESTE",
                "distritos": {
                    "01": "Antiguo Cuscatlán",
                    "06": "Huizúcar",
                    "10": "Nuevo Cuscatlán",
                    "11": "Santa Tecla",
                    "22": "Zaragoza"
                }
            },
            "27": {
                "nombre": "LA LIBERTAD COSTA",
                "distritos": {
                    "05": "Chiltiupán",
                    "08": "Jicalapa",
                    "09": "La Libertad",
                    "18": "Tamanique",
                    "20": "Teotepeque"
                }
            },
            "28": {
                "nombre": "LA LIBERTAD SUR",
                "distritos": {
                    "04": "Comasagua",
                    "14": "San José Villanueva"
                }
            }
        }
    },
    "06": { # San Salvador
        "nombre": "San Salvador",
        "municipios": {
            "20": {
                "nombre": "SAN SALVADOR NORTE",
                "distritos": {
                    "01": "Aguilares",
                    "05": "El Paisnal",
                    "06": "Guazapa"
                }
            },
            "21": {
                "nombre": "SAN SALVADOR OESTE",
                "distritos": {
                    "02": "Apopa",
                    "09": "Nejapa"
                }
            },
            "22": {
                "nombre": "SAN SALVADOR ESTE",
                "distritos": {
                    "07": "Ilopango",
                    "13": "San Martín",
                    "17": "Soyapango",
                    "18": "Tonacatepeque"
                }
            },
            "23": {
                "nombre": "SAN SALVADOR CENTRO",
                "distritos": {
                    "03": "Ayutuxtepeque",
                    "04": "Cuscatancingo",
                    "08": "Mejicanos",
                    "14": "San Salvador",
                    "19": "Ciudad Delgado"
                }
            },
            "24": {
                "nombre": "SAN SALVADOR SUR",
                "distritos": {
                    "10": "Panchimalco",
                    "11": "Rosario de Mora",
                    "12": "San Marcos",
                    "15": "Santiago Texacuangos",
                    "16": "Santo Tomás"
                }
            }
        }
    },
    "07": { # Cuscatlán
        "nombre": "Cuscatlán",
        "municipios": {
            "17": {
                "nombre": "CUSCATLÁN NORTE",
                "distritos": {
                    "15": "Suchitoto",
                    "09": "San José Guayabal",
                    "08": "San Cristóbal",
                    "11": "San Rafael Cedros",
                    "16": "Tenancingo"
                }
            },
            "18": {
                "nombre": "CUSCATLÁN SUR",
                "distritos": {
                    "02": "Cojutepeque",
                    "01": "Candelaria",
                    "03": "El Carmen",
                    "04": "El Rosario",
                    "05": "Monte San Juan",
                    "06": "Oratorio de Concepción",
                    "07": "San Bartolomé Perulapía",
                    "10": "San Pedro Perulapán",
                    "12": "San Ramón",
                    "13": "Santa Cruz Analquito",
                    "14": "Santa Cruz Michapa"
                }
            }
        }
    },
    "08": { # La Paz
        "nombre": "La Paz",
        "municipios": {
            "23": {
                "nombre": "LA PAZ OESTE",
                "distritos": {
                    "01": "Cuyultitán",
                    "05": "Olocuilta",
                    "07": "San Juan Talpa",
                    "11": "San Luis Talpa",
                    "13": "San Pedro Masahuat",
                    "19": "Tapalhuaca",
                    "20": "San Antonio Masahuat"
                }
            },
            "24": {
                "nombre": "LA PAZ CENTRO",
                "distritos": {
                    "02": "El Rosario",
                    "03": "Jerusalén",
                    "04": "Merced La Ceiba",
                    "06": "Paraíso Osorio",
                    "08": "San Emigdio",
                    "09": "San Francisco Chinameca",
                    "12": "San Juan Tepezontes",
                    "14": "San Miguel Tepezontes",
                    "16": "San Pedro Nonualco",
                    "17": "San Rafael Obrajuelo",
                    "18": "Santa María Ostuma"
                }
            },
            "25": {
                "nombre": "LA PAZ ESTE",
                "distritos": {
                    "10": "San Juan Nonualco",
                    "15": "Santiago Nonualco",
                    "21": "Zacatecoluca",
                    "22": "San Luis La Herradura"
                }
            }
        }
    },
    "09": { # Cabañas
        "nombre": "Cabañas",
        "municipios": {
            "10": {
                "nombre": "CABAÑAS ESTE",
                "distritos": {
                    "06": "Sensuntepeque",
                    "08": "Victoria",
                    "09": "Dolores",
                    "04": "Jutiapa",
                    "07": "Tejutepeque"
                }
            },
            "11": {
                "nombre": "CABAÑAS OESTE",
                "distritos": {
                    "03": "Ilobasco",
                    "01": "Cinquera",
                    "02": "Guacotecti",
                    "05": "San Isidro"
                }
            }
        }
    },
    "10": { # San Vicente
        "nombre": "San Vicente",
        "municipios": {
            "14": {
                "nombre": "SAN VICENTE NORTE",
                "distritos": {
                    "01": "Apastepeque",
                    "04": "Santa Clara",
                    "05": "Santo Domingo",
                    "06": "San Esteban Catarina",
                    "07": "San Ildefonso",
                    "08": "San Lorenzo",
                    "09": "San Sebastián"
                }
            },
            "15": {
                "nombre": "SAN VICENTE SUR",
                "distritos": {
                    "10": "San Vicente",
                    "02": "Guadalupe",
                    "03": "San Cayetano Istepeque",
                    "11": "Tecoluca",
                    "12": "Tepetitán",
                    "13": "Verapaz"
                }
            }
        }
    },
    "11": { # Usulután
        "nombre": "Usulután",
        "municipios": {
            "24": {
                "nombre": "USULUTÁN NORTE",
                "distritos": {
                    "01": "Alegría",
                    "02": "Berlín",
                    "03": "California",
                    "05": "El Triunfo",
                    "07": "Estanzuelas",
                    "09": "Jucuapa",
                    "11": "Mercedes Umaña",
                    "12": "Nueva Granada",
                    "21": "Santiago de María"
                }
            },
            "25": {
                "nombre": "USULUTÁN ESTE",
                "distritos": {
                    "23": "Usulután",
                    "04": "Concepción Batres",
                    "06": "Ereguayquín",
                    "10": "Jucuarán",
                    "13": "Ozatlán",
                    "15": "San Agustín",
                    "17": "San Dionisio",
                    "18": "Santa Elena",
                    "19": "San Francisco Javier",
                    "20": "Santa María",
                    "22": "Tecapán"
                }
            },
            "26": {
                "nombre": "USULUTÁN OESTE",
                "distritos": {
                    "08": "Jiquilisco",
                    "14": "Puerto El Triunfo",
                    "16": "San Buenaventura"
                }
            }
        }
    },
    "12": { # San Miguel
        "nombre": "San Miguel",
        "municipios": {
            "21": {
                "nombre": "SAN MIGUEL NORTE",
                "distritos": {
                    "01": "Carolina",
                    "02": "Ciudad Barrios",
                    "04": "Chapeltique",
                    "11": "Nuevo Edén de San Juan",
                    "14": "San Gerardo",
                    "16": "San Luis de la Reina",
                    "19": "Sesori"
                }
            },
            "22": {
                "nombre": "SAN MIGUEL CENTRO",
                "distritos": {
                    "17": "San Miguel",
                    "03": "Comacarán",
                    "05": "Chinameca",
                    "07": "El Tránsito",
                    "09": "Moncagua",
                    "12": "Quelepa"
                }
            },
            "23": {
                "nombre": "SAN MIGUEL OESTE",
                "distritos": {
                    "08": "Lolotique",
                    "10": "Nueva Guadalupe",
                    "13": "San Antonio del Mosco",
                    "15": "San Jorge",
                    "18": "San Rafael Oriente",
                    "20": "Uluazapa"
                }
            }
        }
    },
    "13": { # Morazán
        "nombre": "Morazán",
        "municipios": {
            "27": {
                "nombre": "MORAZÁN NORTE",
                "distritos": {
                    "01": "Arambala",
                    "03": "Corinto",
                    "05": "Delicias de Concepción",
                    "07": "El Rosario",
                    "10": "Joateca",
                    "11": "Jocoaitique",
                    "14": "Meanguera",
                    "16": "Perquín",
                    "18": "San Fernando",
                    "21": "San Simón",
                    "24": "Torola"
                }
            },
            "28": {
                "nombre": "MORAZÁN SUR",
                "distritos": {
                    "19": "San Francisco Gotera",
                    "02": "Cacaopera",
                    "04": "Chilanga",
                    "06": "El Divisadero",
                    "08": "Gualococti",
                    "09": "Guatajiagua",
                    "12": "Jocoro",
                    "13": "Lolotiquillo",
                    "15": "Osicala",
                    "17": "San Carlos",
                    "20": "San Isidro",
                    "22": "Sensembra",
                    "23": "Sociedad",
                    "25": "Yamabal",
                    "26": "Yoloaiquín"
                }
            }
        }
    },
    "14": { # La Unión
        "nombre": "La Unión",
        "municipios": {
            "19": {
                "nombre": "LA UNIÓN NORTE",
                "distritos": {
                    "01": "Anamorós",
                    "02": "Bolívar",
                    "03": "Concepción de Oriente",
                    "06": "El Sauce",
                    "09": "Lislique",
                    "11": "Nueva Esparta",
                    "12": "Pasaquina",
                    "13": "Polorós",
                    "16": "Santa Rosa de Lima"
                }
            },
            "20": {
                "nombre": "LA UNIÓN SUR",
                "distritos": {
                    "08": "La Unión",
                    "04": "Conchagua",
                    "05": "El Carmen",
                    "07": "Intipucá",
                    "10": "Meanguera del Golfo",
                    "14": "San Alejo",
                    "15": "San José",
                    "17": "Yayantique",
                    "18": "Yucuaiquín"
                }
            }
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

def obtener_geografia_cascada() -> dict:
    """
    Retorna la estructura jerárquica para selectores desplegables en cascada:
    Departamento -> Municipio -> Distritos
    """
    resultado = {}
    for depto_id, depto_info in DEPARTAMENTOS_MUNICIPIOS_DISTRITOS.items():
        resultado[depto_id] = {
            "nombre": depto_info["nombre"],
            "municipios": {}
        }
        for mun_id, mun_info in depto_info["municipios"].items():
            resultado[depto_id]["municipios"][mun_id] = {
                "nombre": mun_info["nombre"],
                "distritos": [
                    {"codigo": dist_id, "nombre": dist_nombre}
                    for dist_id, dist_nombre in mun_info["distritos"].items()
                ]
            }
    return resultado
