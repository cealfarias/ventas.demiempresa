import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from models import ConfiguracionDTE
from dte_service.security.crypto_vault import descifrar_texto

def auto_detectar_smtp_config(email_direccion: str) -> dict:
    """
    Auto-detecta el servidor SMTP, puerto e instrucciones visuales según el dominio del correo.
    """
    if not email_direccion or "@" not in email_direccion:
        return {
            "smtp_host": "",
            "smtp_port": 587,
            "smtp_use_tls": True,
            "instrucciones": "Ingrese su dirección de correo electrónico."
        }

    dominio = email_direccion.split("@")[1].lower().strip()

    if dominio in ["gmail.com", "googlemail.com"]:
        return {
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_use_tls": True,
            "proveedor": "Google Gmail / Workspace",
            "instrucciones": (
                "Para Gmail: 1) Activa la 'Verificación en 2 pasos' en la seguridad de tu cuenta de Google. "
                "2) Genera una 'Contraseña de Aplicación' de 16 caracteres en myaccount.google.com/security "
                "y pégala en la casilla de contraseña a continuación."
            )
        }
    elif dominio in ["outlook.com", "hotmail.com", "live.com", "office365.com"]:
        return {
            "smtp_host": "smtp.office365.com",
            "smtp_port": 587,
            "smtp_use_tls": True,
            "proveedor": "Microsoft Outlook / Office 365",
            "instrucciones": (
                "Para Microsoft Outlook / Office 365: Ingresa tu contraseña habitual o tu "
                "Contraseña de Aplicación si tu cuenta tiene 2FA habilitado."
            )
        }
    elif dominio in ["yahoo.com", "ymail.com"]:
        return {
            "smtp_host": "smtp.mail.yahoo.com",
            "smtp_port": 587,
            "smtp_use_tls": True,
            "proveedor": "Yahoo Mail",
            "instrucciones": (
                "Para Yahoo: Genera una 'Contraseña de Aplicación' desde el menú de Seguridad "
                "de la Cuenta Yahoo y pégala a continuación."
            )
        }
    else:
        return {
            "smtp_host": f"mail.{dominio}",
            "smtp_port": 587,
            "smtp_use_tls": True,
            "proveedor": "Servidor Personalizado / Corporativo",
            "instrucciones": "Dominio personalizado. Verifique el Host SMTP y Puerto con su proveedor de hosting/correo."
        }

def probar_conexion_smtp(config_data: dict) -> tuple[bool, str]:
    """
    Realiza una prueba de conexión en tiempo real contra el servidor SMTP.
    """
    host = config_data.get("smtp_host")
    port = int(config_data.get("smtp_port") or 587)
    username = config_data.get("smtp_username")
    password = config_data.get("smtp_password")

    if not host or not username or not password:
        return False, "Debe ingresar Host SMTP, Usuario y Contraseña para la prueba"

    try:
        server = smtplib.SMTP(host, port, timeout=10)
        server.ehlo()
        if config_data.get("smtp_use_tls", True):
            server.starttls()
            server.ehlo()
        
        server.login(username, password)

        # Enviar correo de prueba
        from_email = config_data.get("smtp_from_email") or username
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = username
        msg['Subject'] = "Prueba de Conexión Exitosa - Facturación DTE El Salvador"

        body = (
            "¡Hola!\n\nEste es un correo de prueba enviado desde tu sistema de Facturación SaaS.\n"
            "La configuración de correo saliente SMTP se ha realizado con éxito.\n\n"
            "A partir de este momento, tus clientes recibirán los comprobantes DTE (PDF y JSON) automáticamente por este medio."
        )
        msg.attach(MIMEText(body, 'plain'))
        server.sendmail(from_email, [username], msg.as_string())
        server.quit()

        return True, f"¡Conexión exitosa! Se envió un correo de prueba a {username}"
    except Exception as e:
        return False, f"Fallo al conectar con el servidor SMTP ({host}:{port}): {str(e)}"

def enviar_correo_dte_asincrono(
    config: ConfiguracionDTE,
    email_destinatario: str,
    asunto: str,
    cuerpo_texto: str,
    pdf_bytes: bytes = None,
    nombre_pdf: str = "comprobante.pdf",
    json_bytes: bytes = None,
    nombre_json: str = "comprobante.json"
):
    """
    Envía un correo electrónico con los adjuntos DTE (PDF y JSON) al cliente de forma asíncrona.
    """
    if not config.smtp_host or not config.smtp_username or not config.smtp_password_encrypted:
        print("[SMTP WARN] No se ha configurado el servidor SMTP de correo saliente en la empresa")
        return

    password = descifrar_texto(config.smtp_password_encrypted)
    from_email = config.smtp_from_email or config.smtp_username

    try:
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = email_destinatario
        msg['Subject'] = asunto

        msg.attach(MIMEText(cuerpo_texto, 'html'))

        if pdf_bytes:
            adjunto_pdf = MIMEApplication(pdf_bytes, _subtype="pdf")
            adjunto_pdf.add_header('Content-Disposition', 'attachment', filename=nombre_pdf)
            msg.attach(adjunto_pdf)

        if json_bytes:
            adjunto_json = MIMEApplication(json_bytes, _subtype="json")
            adjunto_json.add_header('Content-Disposition', 'attachment', filename=nombre_json)
            msg.attach(adjunto_json)

        server = smtplib.SMTP(config.smtp_host, config.smtp_port or 587, timeout=15)
        server.ehlo()
        if config.smtp_use_tls:
            server.starttls()
            server.ehlo()

        server.login(config.smtp_username, password)
        server.sendmail(from_email, [email_destinatario], msg.as_string())
        server.quit()
        print(f"[SMTP OK] Correo DTE enviado exitosamente a {email_destinatario}")
    except Exception as e:
        print(f"[SMTP ERROR] Error enviando correo DTE a {email_destinatario}: {str(e)}")
