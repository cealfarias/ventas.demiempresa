import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Factura, ConfiguracionDTE
from pydantic import BaseModel
import uuid
from datetime import datetime

router = APIRouter(prefix="/dte", tags=["Transmisión DTE"])

# Endpoints oficiales MH
URL_AUTH_PRUEBAS = "https://apitest.dtes.mh.gob.sv/seguridad/auth"
URL_RECEPCION_PRUEBAS = "https://apitest.dtes.mh.gob.sv/fesv/recepciondte"
URL_AUTH_PROD = "https://api.dtes.mh.gob.sv/seguridad/auth"
URL_RECEPCION_PROD = "https://api.dtes.mh.gob.sv/fesv/recepciondte"

class TransmisionResponse(BaseModel):
    estado: str
    mensaje: str
    sello_recepcion: str = None
    codigo_generacion: str = None

def _obtener_token_mh(config: ConfiguracionDTE) -> str:
    url = URL_AUTH_PROD if config.ambiente == "01" else URL_AUTH_PRUEBAS
    headers = {
        "User-Agent": "ServicioFacturaElectronica",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "user": config.nit,
        "pwd": config.api_pwd
    }
    
    try:
        res = httpx.post(url, headers=headers, data=data, timeout=10.0)
        res.raise_for_status()
        body = res.json()
        if body.get("status") == "OK":
            return body.get("body", {}).get("token")
        else:
            raise Exception("Credenciales MH inválidas")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error autenticando con MH: {str(e)}")

def _generar_json_dte(factura: Factura, config: ConfiguracionDTE) -> dict:
    """Construye la estructura oficial JSON DTE según manual del MH"""
    
    # Generar UUID (código de generación)
    codigo_generacion = str(uuid.uuid4()).upper()
    
    # Incrementar correlativo
    numero_control = ""
    if factura.tipo_doc == "FACTURA":
        config.correlativo_factura += 1
        numero_control = f"DTE-01-{config.establecimiento_cod}-0000-{str(config.correlativo_factura).zfill(15)}"
        tipo_dte = "01"
    else:
        config.correlativo_ccf += 1
        numero_control = f"DTE-03-{config.establecimiento_cod}-0000-{str(config.correlativo_ccf).zfill(15)}"
        tipo_dte = "03"
    
    fecha_emision = factura.fecha_emision.strftime("%Y-%m-%d")
    hora_emision = factura.fecha_emision.strftime("%H:%M:%S")
    
    # ── 1. Identificación ──
    identificacion = {
        "version": 1,
        "ambiente": config.ambiente,
        "tipoDte": tipo_dte,
        "numeroControl": numero_control,
        "codigoGeneracion": codigo_generacion,
        "tipoModelo": 1,
        "tipoOperacion": 1,
        "tipoContingencia": None,
        "motivoContin": None,
        "fechaEmi": fecha_emision,
        "horaEmi": hora_emision,
        "tipoMoneda": "USD"
    }
    
    # ── 2. Emisor ──
    emisor = {
        "nit": config.nit,
        "nrc": config.nrc,
        "nombre": config.nombre_comercial,
        "codActividad": config.actividad_economica_cod,
        "descActividad": config.desc_actividad_economica,
        "direccion": {
            "departamento": config.direccion_departamento,
            "municipio": config.direccion_municipio,
            "complemento": config.direccion_complemento
        },
        "telefono": config.telefono,
        "correo": config.email,
        "codEstableMH": config.establecimiento_cod,
        "codEstable": config.establecimiento_cod,
        "codPuntoVentaMH": "0000",
        "codPuntoVenta": "0000"
    }
    
    # ── 3. Receptor (Cliente) ──
    cliente = factura.cliente
    receptor = {
        "tipoDocumento": "36" if cliente.nit else ("13" if cliente.dui else "37"),
        "numDocumento": cliente.nit or cliente.dui or "00000000000000",
        "nrc": cliente.nrc,
        "nombre": cliente.nombre,
        "codActividad": cliente.actividad_economica_cod or "10005",
        "descActividad": "Consumidor Final",
        "direccion": {
            "departamento": "06", # Default San Salvador por simplificación
            "municipio": "14",
            "complemento": cliente.direccion or "El Salvador"
        },
        "telefono": cliente.telefono,
        "correo": cliente.email
    }
    
    # ── 4. Cuerpo (Items) ──
    cuerpo = []
    num_item = 1
    for d in factura.items:
        precio_unitario = d.precio_unitario / 100.0
        subtotal = d.subtotal / 100.0
        iva_item = subtotal * 0.13 if tipo_dte == "03" else 0
        
        cuerpo.append({
            "numItem": num_item,
            "tipoItem": 1, # Bienes
            "numeroDocumento": None,
            "cantidad": d.cantidad,
            "codigo": d.producto.codigo if d.producto else "000",
            "uniMedida": 59, # Unidad
            "descripcion": d.producto.nombre if d.producto else "Producto",
            "precioUni": precio_unitario,
            "montoDescu": 0.0,
            "ventaNoSuj": 0.0,
            "ventaExenta": 0.0,
            "ventaGravada": subtotal,
            "tributos": ["20"] if tipo_dte == "03" else None, # 20 = IVA 13%
            "psv": 0.0,
            "noGravado": 0.0,
            "ivaItem": iva_item
        })
        num_item += 1

    # ── 5. Resumen ──
    total_gravada = factura.subtotal / 100.0
    total_iva = factura.iva / 100.0
    total_operacion = factura.total / 100.0

    resumen = {
        "totalNoSuj": 0.0,
        "totalExenta": 0.0,
        "totalGravada": total_gravada,
        "subTotalVentas": total_gravada,
        "descuNoSuj": 0.0,
        "descuExenta": 0.0,
        "descuGravada": 0.0,
        "porcentajeDescuento": 0.0,
        "totalDescu": 0.0,
        "tributos": [{"codigo": "20", "descripcion": "IVA", "valor": total_iva}] if total_iva > 0 else None,
        "subTotal": total_gravada,
        "ivaRete1": 0.0,
        "reteRenta": 0.0,
        "montoTotalOperacion": total_operacion,
        "totalNoGravado": 0.0,
        "totalLetras": "TOTAL LETRAS", # Requiere función convertidora (simplificado)
        "totalIva": total_iva,
        "saldoFavor": 0.0,
        "condicionOperacion": 1 if factura.condicion_operacion == "CONTADO" else 2,
        "pagos": [{"codigo": "01", "montoPago": total_operacion, "referencia": None, "plazo": None, "periodo": None}]
    }

    dte = {
        "identificacion": identificacion,
        "documentoRelacionado": None,
        "emisor": emisor,
        "receptor": receptor,
        "otrosDocumentos": None,
        "ventaTercero": None,
        "cuerpo": cuerpo,
        "resumen": resumen,
        "extension": None,
        "apendice": None
    }
    
    # Quitar nulos (MH lo exige así)
    def remove_nulls(d):
        if isinstance(d, dict):
            return {k: remove_nulls(v) for k, v in d.items() if v is not None}
        elif isinstance(d, list):
            return [remove_nulls(i) for i in d if i is not None]
        return d

    return remove_nulls(dte), codigo_generacion, numero_control

def _firmar_dte(dte_json: dict, config: ConfiguracionDTE) -> str:
    """
    Simulación o mock de la firma del JSON.
    En la vida real, requiere generar un JWT (JWS - JSON Web Signature)
    usando la clave privada extraída del archivo .p12 con la contraseña 'config.certificado_pwd'.
    """
    # Como el usuario dijo "construyamos el andamiaje", implementamos el flujo
    # pero mockeamos la criptografía compleja de JWS para efectos del ERP local.
    import base64
    header = base64.b64encode(b'{"alg":"RS256","typ":"JWT"}').decode()
    payload = base64.b64encode(json.dumps(dte_json).encode()).decode()
    signature = "simulated_signature_from_p12"
    return f"{header}.{payload}.{signature}"

@router.post("/transmitir/{factura_id}", response_model=TransmisionResponse)
def transmitir_factura_mh(factura_id: int, empresa_id: str, db: Session = Depends(get_db)):
    factura = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if factura.estado_dte == "procesado":
        raise HTTPException(status_code=400, detail="Esta factura ya fue transmitida y aprobada")
        
    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    if not config or not config.nit or not config.api_pwd:
        raise HTTPException(status_code=400, detail="Debe configurar el API del MH primero en Configuración DTE")
        
    # 1. Obtener Token
    token = _obtener_token_mh(config)
    
    # 2. Generar JSON DTE Oficial
    dte_json, codigo_generacion, numero_control = _generar_json_dte(factura, config)
    
    factura.codigo_generacion = codigo_generacion
    factura.numero_control = numero_control
    
    # 3. Firmar JSON (JWS)
    jws_firmado = _firmar_dte(dte_json, config)
    factura.json_firmado = json.dumps(dte_json)
    
    # 4. Transmitir al MH
    url = URL_RECEPCION_PROD if config.ambiente == "01" else URL_RECEPCION_PRUEBAS
    headers = {
        "Authorization": token,
        "Content-Type": "application/json",
        "User-Agent": "ServicioFacturaElectronica"
    }
    payload_recepcion = {
        "ambiente": config.ambiente,
        "idEnvio": factura.id,
        "version": 1,
        "tipoDte": "01" if factura.tipo_doc == "FACTURA" else "03",
        "documento": jws_firmado,
        "codigoGeneracion": codigo_generacion
    }

    try:
        res = httpx.post(url, headers=headers, json=payload_recepcion, timeout=15.0)
        cuerpo_respuesta = res.json()
        
        if res.status_code == 200 and cuerpo_respuesta.get("estado") == "PROCESADO":
            factura.estado_dte = "procesado"
            factura.sello_recepcion = cuerpo_respuesta.get("selloRecibido")
            db.commit()
            return TransmisionResponse(
                estado="EXITO", 
                mensaje="DTE Aprobado por MH", 
                sello_recepcion=factura.sello_recepcion, 
                codigo_generacion=factura.codigo_generacion
            )
        else:
            # Fallo o rechazo por el MH
            factura.estado_dte = "rechazado"
            db.commit()
            errores = cuerpo_respuesta.get("observaciones", ["Rechazo desconocido"])
            return TransmisionResponse(estado="ERROR", mensaje=f"MH Rechazó: {errores}")

    except Exception as e:
        db.commit() # Guardar correlativo
        raise HTTPException(status_code=500, detail=f"Error conectando al MH: {str(e)}")
