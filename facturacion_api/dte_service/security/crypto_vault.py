import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Obtenemos o derivamos una clave Fernet determinista basada en SECRET_KEY del entorno
def _obtener_fernet_key() -> bytes:
    master_key = os.getenv("DTE_ENCRYPTION_KEY") or os.getenv("SECRET_KEY") or "FACTURACION_LLAVE_MAESTRA_PARA_DTE_ES"
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"dte_salvador_salt_2026",
        iterations=100_000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
    return key

def cifrar_texto(texto: str) -> str:
    """Cifra un texto plano a formato base64 con AES-256 (Fernet)."""
    if not texto:
        return ""
    fernet = Fernet(_obtener_fernet_key())
    return fernet.encrypt(texto.encode("utf-8")).decode("utf-8")

def descifrar_texto(texto_cifrado: str) -> str:
    """Descifra un texto cifrado en base64."""
    if not texto_cifrado:
        return ""
    try:
        fernet = Fernet(_obtener_fernet_key())
        return fernet.decrypt(texto_cifrado.encode("utf-8")).decode("utf-8")
    except Exception:
        # Fallback en caso de que viniera en texto plano originalmente
        return texto_cifrado

def cifrar_bytes(datos_bytes: bytes) -> str:
    """Cifra bytes planos (ej. archivo .p12) y devuelve string base64."""
    if not datos_bytes:
        return ""
    fernet = Fernet(_obtener_fernet_key())
    return fernet.encrypt(datos_bytes).decode("utf-8")

def descifrar_bytes(cadena_cifrada: str) -> bytes:
    """Descifra un string cifrado y devuelve bytes originales."""
    if not cadena_cifrada:
        return b""
    try:
        fernet = Fernet(_obtener_fernet_key())
        return fernet.decrypt(cadena_cifrada.encode("utf-8"))
    except Exception:
        # Fallback si era base64 estándar no cifrado
        try:
            return base64.b64decode(cadena_cifrada)
        except Exception:
            return b""
