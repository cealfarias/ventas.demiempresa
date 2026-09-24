import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
from models import Factura, ConfiguracionDTE
from pydantic import BaseModel

from dte_service.builders.fse_01 import construir_json_dte_01
from dte_service.builders.ccf_03 import construir_json_dte_03
from dte_service.builders.invalidacion import construir_json_invalidacion
from dte_service.validator.schema_validator import validar_json_contra_esquema_oficial_mh
from dte_service.signer.jws_signer import firmar_json_dte_jws
from dte_service.transmission.client import mh_client
from dte_service.persistence.audit_service import registrar_auditoria_legal_10_anios
from dte_service.pdf.pdf_builder import generar_pdf_representacion_grafica
from dte_service.notifications.email_sender import enviar_correo_dte_asincrono
from dte_service.certificacion.test_runner import ejecutar_matriz_pruebas_mh

router = APIRouter(prefix="/dte", tags=["Transmisión y Gestión DTE"])

class TransmisionResponse(BaseModel):
    estado: str
    mensaje: str
    sello_recepcion: str = None
    codigo_generacion: str = None
    numero_control: str = None

class InvalidacionRequest(BaseModel):
    motivo: str = "Rescisión de operación comercial"

@router.post("/transmitir/{factura_id}", response_model=TransmisionResponse)
def transmitir_factura_mh(
    factura_id: int, 
    empresa_id: str, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    factura = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if factura.estado_dte == "procesado":
        return TransmisionResponse(
            estado="EXITO",
            mensaje="DTE ya fue transmitido y aprobado previamente",
            sello_recepcion=factura.sello_recepcion,
            codigo_generacion=factura.codigo_generacion,
            numero_control=factura.numero_control
        )
        
    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    if not config or not config.nit:
        raise HTTPException(status_code=400, detail="Debe configurar los datos del emisor y API en Configuración DTE")

    # 1. Construir JSON según Tipo DTE (01 = Factura, 03 = CCF)
    punto_venta_cod = "0000"
    if factura.tipo_doc == "FACTURA":
        dte_json, codigo_generacion, numero_control = construir_json_dte_01(factura, config, punto_venta_cod)
        tipo_dte = "01"
    else:
        dte_json, codigo_generacion, numero_control = construir_json_dte_03(factura, config, punto_venta_cod)
        tipo_dte = "03"

    factura.codigo_generacion = codigo_generacion
    factura.numero_control = numero_control

    # 1.5 Validar sintácticamente contra los JSON Schemas oficiales del MH (svfe-json-schemas)
    valido_schema, msg_schema = validar_json_contra_esquema_oficial_mh(dte_json, tipo_dte)
    if not valido_schema:
        print(f"[SCHEMA VALIDATION WARNING] {msg_schema}")

    # 2. Firmar JSON (JWS RS256)
    jws_firmado = firmar_json_dte_jws(
        dte_json, 
        config.certificado_p12_base64, 
        config.certificado_pwd
    )
    factura.json_firmado = jws_firmado

    # 3. Transmitir al Ministerio de Hacienda
    resultado = mh_client.transmitir_dte(
        config=config,
        factura_id=factura.id,
        tipo_dte=tipo_dte,
        codigo_generacion=codigo_generacion,
        jws_firmado=jws_firmado
    )

    status_code = resultado.get("status_code", 500)
    data = resultado.get("data", {})

    if status_code == 200 and (data.get("estado") == "PROCESADO" or data.get("selloRecibido")):
        sello = data.get("selloRecibido") or "SELLO_RECIBIDO_MH_OK"
        factura.estado_dte = "procesado"
        factura.sello_recepcion = sello
        db.commit()

        # 4. Registrar Auditoría Legal (Retención 10 Años DGII)
        try:
            registrar_auditoria_legal_10_anios(db, factura, dte_json, jws_firmado, data, sello)
        except Exception as e:
            print(f"[AUDIT WARN] Error guardando bitácora legal: {e}")

        # 5. Generar PDF y enviar correo asíncrono al cliente si tiene email
        if factura.cliente and factura.cliente.email:
            try:
                pdf_bytes = generar_pdf_representacion_grafica(factura, config)
                json_bytes = json.dumps(dte_json, ensure_ascii=False, indent=2).encode("utf-8")
                
                asunto = f"Comprobante Electrónico DTE - {factura.numero_control}"
                cuerpo = f"""
                <h3>Estimado(a) {factura.cliente.nombre},</h3>
                <p>Le adjuntamos la Representación Gráfica PDF y el archivo JSON firmado correspondiente a su comprobante de pago electrónico.</p>
                <p><b>Número de Control:</b> {factura.numero_control}<br/>
                <b>Código de Generación:</b> {factura.codigo_generacion}<br/>
                <b>Sello de Recepción MH:</b> {sello}</p>
                <br/>
                <p>Atentamente,<br/><b>{config.nombre_comercial}</b></p>
                """

                background_tasks.add_task(
                    enviar_correo_dte_asincrono,
                    config=config,
                    email_destinatario=factura.cliente.email,
                    asunto=asunto,
                    cuerpo_texto=cuerpo,
                    pdf_bytes=pdf_bytes,
                    nombre_pdf=f"{factura.numero_control}.pdf",
                    json_bytes=json_bytes,
                    nombre_json=f"{factura.codigo_generacion}.json"
                )
            except Exception as ex:
                print(f"[MAIL WARN] Error preparando correo: {ex}")

        return TransmisionResponse(
            estado="EXITO",
            mensaje="DTE Aprobado por el Ministerio de Hacienda",
            sello_recepcion=factura.sello_recepcion,
            codigo_generacion=factura.codigo_generacion,
            numero_control=factura.numero_control
        )
    else:
        # Contingencia o Rechazo
        observaciones = data.get("observaciones") or [data.get("mensaje") or "Sin respuesta del MH"]
        
        # Si fue por timeout/error 5xx, marcamos contingencia
        if status_code in (500, 502, 503, 504):
            factura.estado_dte = "pendiente_contingencia"
            db.commit()
            return TransmisionResponse(
                estado="CONTINGENCIA",
                mensaje=f"Emitido en modo contingencia (Hacienda no disponible): {observaciones}",
                codigo_generacion=factura.codigo_generacion,
                numero_control=factura.numero_control
            )
        else:
            factura.estado_dte = "rechazado"
            db.commit()
            return TransmisionResponse(
                estado="ERROR",
                mensaje=f"MH Rechazó la transmisión: {observaciones}",
                codigo_generacion=factura.codigo_generacion,
                numero_control=factura.numero_control
            )

@router.post("/invalidar/{factura_id}", response_model=TransmisionResponse)
def invalidar_factura_mh(
    factura_id: int, 
    empresa_id: str, 
    payload: InvalidacionRequest,
    db: Session = Depends(get_db)
):
    factura = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if factura.estado_dte != "procesado":
        raise HTTPException(status_code=400, detail="Solo se pueden invalidar facturas previamente procesadas por el MH")

    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    
    invalidacion_json, codigo_gen_evento = construir_json_invalidacion(factura, config, payload.motivo)
    jws_invalidacion = firmar_json_dte_jws(invalidacion_json, config.certificado_p12_base64, config.certificado_pwd)

    resultado = mh_client.invalidar_dte(config, codigo_gen_evento, jws_invalidacion)
    
    if resultado.get("status_code") == 200:
        factura.estado_dte = "invalidado"
        factura.estado = "anulada"
        db.commit()
        return TransmisionResponse(
            estado="EXITO",
            mensaje="DTE Invalidado con éxito ante el Ministerio de Hacienda",
            codigo_generacion=codigo_gen_evento
        )
    else:
        raise HTTPException(status_code=400, detail=f"Hacienda no aceptó la invalidación: {resultado.get('data')}")

@router.get("/pdf/{factura_id}")
def descargar_pdf_dte(factura_id: int, empresa_id: str, db: Session = Depends(get_db)):
    """Genera y descarga la Representación Gráfica PDF del DTE con código QR."""
    factura = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    pdf_bytes = generar_pdf_representacion_grafica(factura, config)
    
    nombre_archivo = f"{factura.numero_control or 'DTE-FACTURA'}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nombre_archivo}"}
    )

@router.post("/certificacion/ejecutar-matriz")
def ejecutar_matriz_acreditacion(empresa_id: str, db: Session = Depends(get_db)):
    """Ejecuta la matriz de pruebas automatizada para la acreditación de emisor ante el MH."""
    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    if not config:
        raise HTTPException(status_code=400, detail="Debe configurar los datos de la empresa primero")

    resultados = ejecutar_matriz_pruebas_mh(db, config)
    return {"status": "OK", "total_escenarios": len(resultados), "detalles": resultados}
