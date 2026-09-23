"""
Direcciones de Endpoints Oficiales del Ministerio de Hacienda (DGII) El Salvador.
"""

# Ambiente de Pruebas / Sandbox (00)
URL_AUTH_PRUEBAS = "https://apitest.dtes.mh.gob.sv/seguridad/auth"
URL_RECEPCION_PRUEBAS = "https://apitest.dtes.mh.gob.sv/fesv/recepciondte"
URL_CONTINGENCIA_PRUEBAS = "https://apitest.dtes.mh.gob.sv/fesv/contingencia"
URL_INVALIDACION_PRUEBAS = "https://apitest.dtes.mh.gob.sv/fesv/anulardte"

# Ambiente de Producción (01)
URL_AUTH_PROD = "https://api.dtes.mh.gob.sv/seguridad/auth"
URL_RECEPCION_PROD = "https://api.dtes.mh.gob.sv/fesv/recepciondte"
URL_CONTINGENCIA_PROD = "https://api.dtes.mh.gob.sv/fesv/contingencia"
URL_INVALIDACION_PROD = "https://api.dtes.mh.gob.sv/fesv/anulardte"

def obtener_urls_mh(ambiente: str) -> dict:
    """Retorna las URLs correspondientes según el ambiente configurado ('00' Pruebas vs '01' Producción)."""
    if ambiente == "01":
        return {
            "auth": URL_AUTH_PROD,
            "recepcion": URL_RECEPCION_PROD,
            "contingencia": URL_CONTINGENCIA_PROD,
            "invalidacion": URL_INVALIDACION_PROD
        }
    return {
        "auth": URL_AUTH_PRUEBAS,
        "recepcion": URL_RECEPCION_PRUEBAS,
        "contingencia": URL_CONTINGENCIA_PRUEBAS,
        "invalidacion": URL_INVALIDACION_PRUEBAS
    }
