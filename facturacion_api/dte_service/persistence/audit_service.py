import hashlib
import json
from sqlalchemy.orm import Session
from models import DTEArchivoLegal, Factura

def registrar_auditoria_legal_10_anios(
    db: Session,
    factura: Factura,
    dte_json: dict,
    jws_firmado: str,
    respuesta_mh: dict,
    sello_recepcion: str
):
    """
    Guarda el registro inalterable para cumplimiento de la retención legal de 10 años exigida por la DGII.
    Calcula el hash SHA-256 de integridad sobre la firma JWS y respuesta de Hacienda.
    """
    json_original_str = json.dumps(dte_json, ensure_ascii=False)
    respuesta_mh_str = json.dumps(respuesta_mh, ensure_ascii=False) if respuesta_mh else ""

    # Hash de Integridad SHA-256
    hash_raw = f"{factura.codigo_generacion}:{jws_firmado}:{sello_recepcion}".encode("utf-8")
    hash_sha256 = hashlib.sha256(hash_raw).hexdigest()

    registro_legal = DTEArchivoLegal(
        empresa_id=factura.empresa_id,
        factura_id=factura.id,
        tipo_dte="01" if factura.tipo_doc == "FACTURA" else "03",
        codigo_generacion=factura.codigo_generacion,
        numero_control=factura.numero_control,
        json_original=json_original_str,
        jws_firmado=jws_firmado,
        respuesta_mh=respuesta_mh_str,
        sello_recepcion=sello_recepcion,
        fecha_emision=factura.fecha_emision,
        hash_integridad=hash_sha256
    )

    db.add(registro_legal)
    db.commit()
    return registro_legal
