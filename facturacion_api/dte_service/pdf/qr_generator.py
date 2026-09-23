import io
import base64
import qrcode

def generar_qr_base64(codigo_generacion: str, fecha_emision: str) -> str:
    """
    Genera el código QR oficial en formato Base64 según la URL de consulta pública de la DGII / MH.
    URL: https://consultadte.mh.gob.sv/consultaPublica?codigoGeneracion=UUID&fechaEmi=YYYY-MM-DD
    """
    url_consulta = f"https://consultadte.mh.gob.sv/consultaPublica?codigoGeneracion={codigo_generacion}&fechaEmi={fecha_emision}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=2,
    )
    qr.add_data(url_consulta)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{qr_b64}"

def generar_qr_bytes(codigo_generacion: str, fecha_emision: str) -> bytes:
    """Genera bytes de la imagen PNG del código QR."""
    url_consulta = f"https://consultadte.mh.gob.sv/consultaPublica?codigoGeneracion={codigo_generacion}&fechaEmi={fecha_emision}"
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(url_consulta)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
