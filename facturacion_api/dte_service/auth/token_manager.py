from datetime import datetime, timedelta, timezone
import httpx
from fastapi import HTTPException
from models import ConfiguracionDTE
from dte_service.security.crypto_vault import descifrar_texto

URL_AUTH_PRUEBAS = "https://apitest.dtes.mh.gob.sv/seguridad/auth"
URL_AUTH_PROD = "https://api.dtes.mh.gob.sv/seguridad/auth"

class MHTokenManager:
    """
    Singleton thread-safe para la gestión de Tokens JWT emitidos por el Ministerio de Hacienda.
    Caché en memoria por `empresa_id` con renovación proactiva.
    """
    _instance = None
    _tokens = {} # empresa_id: {"token": str, "expires_at": datetime}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MHTokenManager, cls).__new__(cls)
        return cls._instance

    def obtener_token(self, config: ConfiguracionDTE) -> str:
        empresa_id = config.empresa_id
        now = datetime.now(timezone.utc)

        # 1. Verificar si hay token en caché válido (expiración de 24h, renovamos 15 min antes)
        if empresa_id in self._tokens:
            info = self._tokens[empresa_id]
            if info["expires_at"] > now + timedelta(minutes=15):
                return info["token"]

        # 2. Si no hay token o está por expirar, solicitar nuevo token al MH
        url = URL_AUTH_PROD if config.ambiente == "01" else URL_AUTH_PRUEBAS
        api_pwd = descifrar_texto(config.api_pwd) if config.api_pwd else ""
        
        headers = {
            "User-Agent": "ServicioFacturaElectronicaES",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "user": config.nit or "",
            "pwd": api_pwd
        }

        try:
            res = httpx.post(url, headers=headers, data=data, timeout=12.0)
            res.raise_for_status()
            body = res.json()

            if body.get("status") == "OK" or body.get("body", {}).get("token"):
                token = body.get("body", {}).get("token")
                # El token expira en 24 horas normalmente
                expires_at = now + timedelta(hours=23, minutes=45)
                self._tokens[empresa_id] = {
                    "token": token,
                    "expires_at": expires_at
                }
                return token
            else:
                detalles = body.get("message") or body.get("detail") or "Credenciales de API MH inválidas"
                raise Exception(f"Rechazo de autenticación MH: {detalles}")

        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Error al autenticar con el Ministerio de Hacienda: {str(e)}"
            )

    def invalidar_token(self, empresa_id: str):
        """Fuerza la expiración del token de una empresa."""
        if empresa_id in self._tokens:
            del self._tokens[empresa_id]

token_manager = MHTokenManager()
