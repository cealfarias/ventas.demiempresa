from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

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

# Mapa de conocimiento detallado por módulo / página
MODULOS_KNOWLEDGE = {
    "/dashboard": {
        "titulo": "📊 Dashboard de Control General",
        "guia": "1. Revisa las tarjetas de KPIs principales (Ventas totales, saldos).\n2. Observa la gráfica de ventas para tendencias temporales.\n3. Consulta el Top de Productos más vendidos.",
        "faqs": "P: ¿Cada cuánto se actualiza?\nR: En tiempo real al registrar facturas o gastos."
    },
    "/facturas": {
        "titulo": "🧾 Facturación DTE (Hacienda)",
        "guia": "1. Valida tener un turno de caja abierto.\n2. Selecciona el cliente.\n3. Añade productos revisando la existencia en bodega predeterminada.\n4. Selecciona el Tipo de DTE y presiona 'Emitir Factura'.",
        "faqs": "P: ¿Cómo anulo una factura?\nR: Presiona 'Anular' en el historial indicando el motivo."
    },
    "/cajas": {
        "titulo": "💼 Control de Caja & Financiamientos",
        "guia": "1. Presiona 'Aperturar Turno' con el saldo inicial.\n2. Para inyectar liquidez sin o con interés, usa 'Inyectar Capital'.\n3. Usa los botones de Editar o Eliminar para corregir movimientos.",
        "faqs": "P: ¿Qué es la inyección de capital?\nR: Aportes o préstamos para compras y gastos sin alterar ventas."
    },
    "/clientes": {
        "titulo": "👥 Gestión de Clientes",
        "guia": "1. Haz clic en 'Nuevo Cliente'.\n2. Completa NIT/NRC/DUI y actividad económica (CAT-019).\n3. Define el límite de crédito si aplican ventas a plazo.",
        "faqs": "P: ¿Quién es el cliente predeterminado?\nR: El cliente de venta rápida a consumidor final."
    },
    "/cuentas-cobrar": {
        "titulo": "💳 Cuentas por Cobrar",
        "guia": "1. Revisa los saldos pendientes por cliente.\n2. Presiona 'Registrar Cobro' para abonar o liquidar.\n3. El cobro recibido incrementa la disponibilidad de la caja activa.",
        "faqs": "P: ¿Cómo veo el historial de abonos?\nR: En la ficha de detalle de cada cliente."
    },
    "/gastos": {
        "titulo": "💸 Gastos Operativos",
        "guia": "1. Selecciona la categoría del gasto.\n2. Ingresa monto y concepto.\n3. Selecciona salida por Efectivo o Transferencia y guarda.",
        "faqs": "P: ¿Se descuenta del turno de caja?\nR: Sí, si se selecciona pago en Efectivo de Caja."
    },
    "/proveedores": {
        "titulo": "🚚 Gestión de Proveedores",
        "guia": "1. Registra distribuidores y casas comerciales.\n2. Ingresa su NIT/NRC para sustentar Crédito Fiscal en compras.",
        "faqs": "P: ¿Es necesario para órdenes de compra?\nR: Sí, las órdenes requieren seleccionar un proveedor."
    },
    "/ordenes-compra": {
        "titulo": "🛒 Órdenes de Compra & Recepción",
        "guia": "1. Crea la orden especificando proveedor e ítems.\n2. Al recibir los productos, marca el estado como 'Recibida'.\n3. El stock ingresará automáticamente a la bodega.",
        "faqs": "P: ¿Actualiza el costo promedio?\nR: Sí, recalcula el valor según el costo unitario de compra."
    },
    "/cuentas-pagar": {
        "titulo": "📄 Cuentas por Pagar",
        "guia": "1. Consulta los compromisos financieros con proveedores.\n2. Registra abonos parciales o pagos totales.",
        "faqs": "P: ¿Cómo registro el egreso?\nR: Selecciona si el pago sale de caja o banco."
    },
    "/bodegas": {
        "titulo": "🏬 Administración de Bodegas",
        "guia": "1. Registra las sucursales o almacenes de la empresa.\n2. Define la bodega 'Predeterminada' para venta rápida.",
        "faqs": "P: ¿Puedo tener varias bodegas?\nR: Sí, ilimitadas bodegas por empresa."
    },
    "/existencias": {
        "titulo": "📦 Existencias en Tiempo Real",
        "guia": "1. Consulta las unidades almacenadas por cada bodega.\n2. Filtra productos con alerta de stock mínimo.",
        "faqs": "P: ¿Cómo veo el valor del inventario?\nR: Multiplica las unidades por el costo promedio ponderado."
    },
    "/kardex": {
        "titulo": "📋 Libro Kardex (Trazabilidad)",
        "guia": "1. Selecciona un producto para auditar su historial.\n2. Analiza las entradas, salidas y saldo valorizado.",
        "faqs": "P: ¿Qué método fiscal utiliza?\nR: Costo Promedio Ponderado."
    },
    "/productos": {
        "titulo": "📦 Catálogo de Productos y Servicios",
        "guia": "1. Crea ítems ingresando código, precio y costo.\n2. Asigna imagen URL para visualización en facturación.",
        "faqs": "P: ¿Un servicio maneja stock?\nR: No, los servicios no descuentan unidades físicas."
    },
    "/despachos": {
        "titulo": "🚚 Logística y Rutas de Entrega",
        "guia": "1. Agrupa facturas emitidas por ruta de entrega.\n2. Actualiza los estados: Pendiente -> En Ruta -> Entregado.",
        "faqs": "P: ¿Se genera Guía DTE?\nR: Sí, se enlaza al documento de transporte de Hacienda."
    },
    "/configuracion-dte": {
        "titulo": "⚙️ Configuración DTE (Hacienda)",
        "guia": "1. Carga tu archivo .p12 y contraseña de certificado.\n2. Ingresa la clave API otorgada por el Ministerio de Hacienda.\n3. Selecciona el Entorno (Pruebas / Producción).",
        "faqs": "P: ¿Qué hago si da error de firma?\nR: Revisa que la clave del .p12 coincida exactamente."
    },
    "/usuarios": {
        "titulo": "👥 Gestión de Usuarios y Roles (RBAC)",
        "guia": "1. Registra colaboradores con su username y correo.\n2. Asigna uno de los 8 roles predefinidos.\n3. Modifica estados o restablece contraseñas.",
        "faqs": "P: ¿Quién puede gestionar usuarios?\nR: Exclusivamente el usuario con rol 'admin'."
    }
}

ERP_KEYWORDS = [
    "factura", "dte", "caja", "cobro", "pago", "cliente", "proveedor", "bodega",
    "kardex", "existencia", "producto", "stock", "gasto", "orden", "compra",
    "cuenta", "cobrar", "pagar", "usuario", "rol", "sistema", "empresa",
    "hacienda", "emisión", "despacho", "ruta", "inventario", "cierre", "apertura",
    "financiamiento", "préstamo", "aporte", "impuesto", "nit", "nrc", "iva",
    "ayuda", "hola", "buenos dias", "buenas tardes", "buenas noches", "gracias",
    "opciones", "manual", "configuración", "certificación", "token", "sucursal",
    "inicio", "dashboard", "sesión", "turno", "arqueo", "guia", "como", "usar"
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
    mod = (req.modulo or "/").lower().rstrip("/")
    if not mod:
        mod = "/dashboard"

    if not msg:
        return ChatResponse(response="¿En qué te puedo colaborar en este momento?")

    msg_lower = msg.lower()

    # Frase personalizada para Mario y Janeth
    if "mario" in msg_lower or "janeth" in msg_lower or "abrazando" in msg_lower:
        ans = "Hola Mario, hoy no andas abrazando a nadie, mejor tráeme a la Janeth 😄"
        return ChatResponse(response=ans)

    # Verificar si está fuera de ámbito
    if not es_consulta_erp(msg):
        return ChatResponse(
            response=MESSAGE_PAID_SERVICE,
            is_off_topic=True
        )

    # Si pregunta qué puede hacer / funciones del avatar
    if "qué puedes hacer" in msg_lower or "que puedes hacer" in msg_lower or "qué haces" in msg_lower or "que haces" in msg_lower or "funciones" in msg_lower or "sirves" in msg_lower:
        ans = (
            "🤖 **Funciones de tu Avatar Asistente:**\n\n"
            "🧭 **Guía por Página**: Te explico paso a paso cómo operar cada uno de los 16 módulos del ERP mediante el botón 'Guíame en esta página'.\n"
            "🎙️ **Voz Bidireccional**: Escucho tus consultas por micrófono y respondo en voz alta en español.\n"
            "🔒 **Perfiles por Rol**: Adapto respuestas y atajos a tu rol (Admin, Cajera, Bodeguero, Contador, etc.).\n"
            "🔇 **Controles de Audio**: Dispones de 'Silencio Total' (Mute), 'Repetir Instrucción' e 'Iniciar desde 0'.\n"
            "🧾 **Soporte ERP**: Te guío en Facturación DTE, Cajas, Inyección de Capital, Kardex, Existencias, Gastos y Usuarios.\n"
            "💡 **Enfoque ERP**: Atiendo consultas del sistema (asistencia externa aplica costo adicional)."
        )
        return ChatResponse(response=ans)

    # Si solicita guía explícita del módulo actual
    if "guia" in msg_lower or "cómo usar" in msg_lower or "esta página" in msg_lower or "esta pantalla" in msg_lower or "ayuda" in msg_lower:
        info_mod = MODULOS_KNOWLEDGE.get(mod, MODULOS_KNOWLEDGE.get("/dashboard"))
        ans = f"🧭 **Guía de Uso: {info_mod['titulo']}**\n\n{info_mod['guia']}\n\n💡 **Frecuentes:** {info_mod['faqs']}"
        return ChatResponse(response=ans)

    # Coincidencias por módulos específicos
    if "caja" in msg_lower or "turno" in msg_lower:
        info = MODULOS_KNOWLEDGE["/cajas"]
        ans = f"💼 **Control de Caja:** {info['guia']}"
        return ChatResponse(response=ans, redirect_url="/cajas")

    elif "factura" in msg_lower or "dte" in msg_lower:
        info = MODULOS_KNOWLEDGE["/facturas"]
        ans = f"🧾 **Facturación DTE:** {info['guia']}"
        return ChatResponse(response=ans, redirect_url="/facturas")

    elif "bodega" in msg_lower or "kardex" in msg_lower or "stock" in msg_lower or "existencia" in msg_lower:
        info = MODULOS_KNOWLEDGE["/existencias"]
        ans = f"📦 **Inventarios:** {info['guia']}"
        return ChatResponse(response=ans, redirect_url="/existencias")

    elif "usuario" in msg_lower or "rol" in msg_lower or "permiso" in msg_lower:
        info = MODULOS_KNOWLEDGE["/usuarios"]
        ans = f"👥 **Usuarios y Roles:** {info['guia']}"
        return ChatResponse(response=ans, redirect_url="/usuarios")

    elif "gasto" in msg_lower:
        info = MODULOS_KNOWLEDGE["/gastos"]
        ans = f"💸 **Gastos Operativos:** {info['guia']}"
        return ChatResponse(response=ans, redirect_url="/gastos")

    elif "compra" in msg_lower or "proveedor" in msg_lower:
        info = MODULOS_KNOWLEDGE["/ordenes-compra"]
        ans = f"🛒 **Compras:** {info['guia']}"
        return ChatResponse(response=ans, redirect_url="/ordenes-compra")

    elif "hola" in msg_lower or "buenos dias" in msg_lower or "buenas tardes" in msg_lower or "buenas noches" in msg_lower:
        info_current = MODULOS_KNOWLEDGE.get(mod, MODULOS_KNOWLEDGE.get("/dashboard"))
        ans = f"¡Hola! Soy tu Avatar Asistente. Tu perfil activo es **{rol.upper()}**.\nActualmente te encuentras en **{info_current['titulo']}**.\n\nPresiona el botón **'🧭 Guíame en esta página'** para un recorrido paso a paso."
        return ChatResponse(response=ans)

    else:
        info_mod = MODULOS_KNOWLEDGE.get(mod, MODULOS_KNOWLEDGE.get("/dashboard"))
        ans = f"Entendido. Te encuentras en **{info_mod['titulo']}**.\n{info_mod['guia']}"
        return ChatResponse(response=ans)
