import httpx
from models import ConfiguracionDTE
from dte_service.auth.token_manager import token_manager
from dte_service.transmission.endpoints import obtener_urls_mh

class MHClient:
    """
    Cliente HTTP encargado de la transmisión síncrona y asíncrona hacia los servicios del MH.
    """

    def transmitir_dte(
        self, 
        config: ConfiguracionDTE, 
        factura_id: int, 
        tipo_dte: str, 
        codigo_generacion: str, 
        jws_firmado: str
    ) -> dict:
        urls = obtener_urls_mh(config.ambiente)
        token = token_manager.obtener_token(config)

        headers = {
            "Authorization": token,
            "Content-Type": "application/json",
            "User-Agent": "ServicioFacturaElectronicaES"
        }

        payload = {
            "ambiente": config.ambiente or "00",
            "idEnvio": factura_id,
            "version": 1,
            "tipoDte": tipo_dte,
            "documento": jws_firmado,
            "codigoGeneracion": codigo_generacion
        }

        try:
            res = httpx.post(urls["recepcion"], headers=headers, json=payload, timeout=15.0)
            return {
                "status_code": res.status_code,
                "data": res.json() if res.headers.get("content-type", "").startswith("application/json") else {"mensaje": res.text}
            }
        except httpx.TimeoutException:
            return {
                "status_code": 504,
                "data": {"estado": "RECHAZADO", "observaciones": ["Tiempo de espera agotado al conectar con el servidor de Hacienda"]}
            }
        except Exception as e:
            return {
                "status_code": 500,
                "data": {"estado": "RECHAZADO", "observaciones": [f"Falla de red/servidor: {str(e)}"]}
            }

    def invalidar_dte(
        self, 
        config: ConfiguracionDTE, 
        codigo_generacion_evento: str, 
        jws_invalidacion_firmado: str
    ) -> dict:
        urls = obtener_urls_mh(config.ambiente)
        token = token_manager.obtener_token(config)

        headers = {
            "Authorization": token,
            "Content-Type": "application/json",
            "User-Agent": "ServicioFacturaElectronicaES"
        }

        payload = {
            "ambiente": config.ambiente or "00",
            "idEnvio": 1,
            "version": 2,
            "documento": jws_invalidacion_firmado,
            "codigoGeneracion": codigo_generacion_evento
        }

        try:
            res = httpx.post(urls["invalidacion"], headers=headers, json=payload, timeout=15.0)
            return {
                "status_code": res.status_code,
                "data": res.json() if res.headers.get("content-type", "").startswith("application/json") else {"mensaje": res.text}
            }
        except Exception as e:
            return {
                "status_code": 500,
                "data": {"estado": "RECHAZADO", "observaciones": [f"Error al conectar con endpoint de anulación: {str(e)}"]}
            }

mh_client = MHClient()
