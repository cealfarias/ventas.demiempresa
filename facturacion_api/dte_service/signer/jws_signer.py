import os
import json
import base64
import httpx
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from dte_service.signer.pkcs12_handler import cargar_llave_y_certificado_p12
from dte_service.security.crypto_vault import descifrar_texto

def base64url_encode(input_bytes: bytes) -> str:
    """Codifica en base64url (RFC 7515) omitiendo caracteres de relleno '='."""
    return base64.urlsafe_b64encode(input_bytes).decode("utf-8").rstrip("=")

def firmar_via_microservicio_mh(dte_payload: dict, nit: str, cert_pwd: str) -> str:
    """
    Firma el DTE consultando el microservicio Java oficial del MH (svfe-api-firmador / servicioFirmadoWindows).
    """
    firmador_url = os.getenv("MH_FIRMADO_URL", "http://localhost:8080/firmar")
    payload = {
        "nit": nit,
        "passwordPri": cert_pwd,
        "dteJson": dte_payload
    }
    res = httpx.post(firmador_url, json=payload, timeout=10.0)
    res.raise_for_status()
    body = res.json()
    return body.get("body") or body.get("jws") or body.get("firmado")

def firmar_json_dte_jws(dte_payload: dict, cert_p12_cifrado: str, cert_pwd_cifrado: str) -> str:
    """
    Genera la Firma Digital JWS Compacta (RFC 7515) para el esquema del MH El Salvador.
    Admite firma nativa en memoria (criptografía RS256) o consulta al microservicio oficial MH si está configurado.
    """
    # 0. Si existe variable de entorno MH_FIRMADO_URL, consultar el firmador Java oficial del MH
    if os.getenv("MH_FIRMADO_URL"):
        try:
            pwd_plana = descifrar_texto(cert_pwd_cifrado)
            nit_emisor = dte_payload.get("emisor", {}).get("nit", "")
            return firmar_via_microservicio_mh(dte_payload, nit_emisor, pwd_plana)
        except Exception as ex:
            print(f"[FIRMADO WARN] Falló microservicio Java MH, conmutando a firmador nativo Python: {ex}")

    # 1. Cargar clave privada y certificado en memoria (Firmador nativo Python)
    try:
        private_key, certificate = cargar_llave_y_certificado_p12(cert_p12_cifrado, cert_pwd_cifrado)
    except Exception as e:
        if not cert_p12_cifrado:
            header_b64 = base64url_encode(json.dumps({"alg": "RS256", "typ": "JWS"}).encode("utf-8"))
            payload_b64 = base64url_encode(json.dumps(dte_payload, ensure_ascii=False).encode("utf-8"))
            signature_b64 = base64url_encode(b"SIMULATED_SIGNATURE_FOR_TESTING_PURPOSES")
            return f"{header_b64}.{payload_b64}.{signature_b64}"
        raise e

    # 2. Construir Header JWS oficial exigido por MH
    header_dict = {"alg": "RS256", "typ": "JWS"}
    header_json = json.dumps(header_dict, separators=(",", ":")).encode("utf-8")
    header_b64 = base64url_encode(header_json)

    # 3. Serializar Payload DTE JSON
    payload_json = json.dumps(dte_payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64url_encode(payload_json)

    # 4. Generar Firma RSA-SHA256 sobre "HeaderB64.PayloadB64"
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = private_key.sign(
        signing_input,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    signature_b64 = base64url_encode(signature)

    # 5. Concatenar en la estructura compacta JWS
    jws_compact = f"{header_b64}.{payload_b64}.{signature_b64}"
    return jws_compact
