import base64
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization
from dte_service.security.crypto_vault import descifrar_bytes, descifrar_texto

def cargar_llave_y_certificado_p12(cert_p12_cifrado: str, cert_pwd_cifrado: str):
    """
    Descifra el certificado PKCS#12 en memoria y extrae la clave privada RSA y el certificado X.509.
    No escribe archivos temporales en disco.
    """
    if not cert_p12_cifrado:
        raise ValueError("No se ha configurado el certificado digital (.p12) en la empresa")

    p12_bytes = descifrar_bytes(cert_p12_cifrado)
    password = descifrar_texto(cert_pwd_cifrado).encode("utf-8") if cert_pwd_cifrado else b""

    try:
        private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
            p12_bytes, 
            password
        )
        if private_key is None or certificate is None:
            raise ValueError("El archivo PKCS#12 no contiene una clave privada o certificado válido")
        
        return private_key, certificate
    except Exception as e:
        raise ValueError(f"Error al cargar el certificado digital .p12: {str(e)}")
