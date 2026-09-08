from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import re

router = APIRouter(prefix="/avatar", tags=["Avatar IA Adaptativo"])

class ChatRequest(BaseModel):
    message: str
    rol: Optional[str] = "admin"
    modulo: Optional[str] = "general"

class ChatResponse(BaseModel):
    response: str
    action_type: Optional[str] = None
    redirect_url: Optional[str] = None
    is_off_topic: bool = False

# Palabras clave del dominio ERP / Sistema de Facturación
ERP_KEYWORDS = [
    "factura", "dte", "caja", "cobro", "pago", "cliente", "proveedor", "bodega",
    "kardex", "existencia", "producto", "stock", "gasto", "orden", "compra",
    "cuenta", "cobrar", "pagar", "usuario", "rol", "sistema", "empresa",
    "hacienda", "emisión", "despacho", "ruta", "inventario", "cierre", "apertura",
    "financiamiento", "préstamo", "aporte", "impuesto", "nit", "nrc", "iva",
    "ayuda", "hola", "buenos dias", "buenas tardes", "buenas noches", "gracias",
    "opciones", "manual", "configuración", "certificación", "token", "sucursal",
    "inicio", "dashboard", "sesión", "turno", "arqueo"
]

MESSAGE_PAID_SERVICE = (
    "Soy tu asistente virtual especializado exclusivamente en el sistema de Facturación e Inventarios. "
    "Para consultas o soporte en temas externos a la plataforma, disponemos de un servicio de asistencia extendida con costo adicional. "
    "¿En qué puedo ayudarte respecto a tus operaciones de ventas, compras o inventario hoy?"
)

def es_consulta_erp(texto: str) -> bool:
    texto_lower = texto.lower()
    for kw in ERP_KEYWORDS:
        if kw in texto_lower:
            return True
    # Si la consulta es corta (saludos o comandos breves de navegación)
    if len(texto_lower.strip().split()) <= 3:
        return True
    return False

@router.post("/chat", response_model=ChatResponse)
@router.post("/chat/", response_model=ChatResponse)
@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
def avatar_chat(req: ChatRequest):
    msg = req.message.strip()
    rol = (req.rol or "usuario").lower()
    mod = (req.modulo or "general").lower()

    if not msg:
        return ChatResponse(response="¿En qué te puedo colaborar en este momento?")

    # Verificar si está fuera de ámbito
    if not es_consulta_erp(msg):
        return ChatResponse(
            response=MESSAGE_PAID_SERVICE,
            is_off_topic=True
        )

    msg_lower = msg.lower()

    # Lógica de respuesta inteligente contextual según rol y mensaje
    if "caja" in msg_lower or "turno" in msg_lower:
        if rol == "cajera":
            ans = "Para registrar tus cobros de hoy, primero valida que el turno de caja esté abierto en el módulo 'Control de Caja'. Si requieres liquidez adicional para gastos o compras, puedes utilizar la función 'Inyectar Capital'."
            return ChatResponse(response=ans, redirect_url="/cajas")
        else:
            ans = "En el módulo 'Control de Caja' puedes auditar el saldo activo, verificar inyecciones de capital, movimientos de compras/ventas y editar o eliminar registros de turno."
            return ChatResponse(response=ans, redirect_url="/cajas")

    elif "factura" in msg_lower or "dte" in msg_lower:
        ans = "Para emitir un Documento Tributario Electrónico (DTE), dirígete a 'Facturación DTE'. Selecciona el cliente, añade los productos del catálogo (se mostrará la existencia actual en bodega) y presiona 'Emitir Factura'."
        return ChatResponse(response=ans, redirect_url="/facturas")

    elif "bodega" in msg_lower or "kardex" in msg_lower or "stock" in msg_lower or "existencia" in msg_lower:
        if rol in ["bodeguero", "admin", "contador"]:
            ans = "Puedes auditar las entradas, salidas y movimientos físicos en el 'Libro Kardex' o consultar la disponibilidad en tiempo real en la sección de 'Existencias'."
            return ChatResponse(response=ans, redirect_url="/existencias")
        else:
            ans = "Puedes consultar las existencias de productos en bodega directamente al seleccionar ítems en la facturación o en el catálogo de productos."
            return ChatResponse(response=ans, redirect_url="/productos")

    elif "usuario" in msg_lower or "rol" in msg_lower or "permiso" in msg_lower:
        if rol == "admin":
            ans = "Como Administrador, puedes registrar nuevos colaboradores y definir sus roles (Contador, Auditor, Bodeguero, Cajera, Compras, Vendedor, Despachador) en la sección 'Gestión de Usuarios'."
            return ChatResponse(response=ans, redirect_url="/usuarios")
        else:
            ans = "La gestión de usuarios y asignación de roles está reservada para el Administrador de la empresa."
            return ChatResponse(response=ans)

    elif "gasto" in msg_lower or "proveedor" in msg_lower or "compra" in msg_lower:
        ans = "Puedes gestionar tus proveedores y crear Órdenes de Compra en el módulo 'Compras'. Los gastos operativos del día se registran en 'Gastos Operativos' dentro de Finanzas."
        return ChatResponse(response=ans, redirect_url="/gastos")

    elif "hola" in msg_lower or "buenos dias" in msg_lower or "buenas tardes" in msg_lower:
        ans = f"¡Hola! Soy tu Avatar Asistente. Tu perfil activo es **{rol.upper()}**. ¿En qué operación del sistema deseas que te guíe?"
        return ChatResponse(response=ans)

    else:
        ans = f"Entendido. Como asistente de tu rol ({rol.upper()}), puedo ayudarte con Facturación DTE, Inventarios, Cajas, Compras y Gestión de Usuarios. ¿Deseas navegar a algún módulo en específico?"
        return ChatResponse(response=ans)
