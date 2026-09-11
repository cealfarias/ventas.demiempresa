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

# ==============================================================================
# BASE DE CONOCIMIENTO EXTENDIDA DEL SISTEMA ERP & FACTURACIÓN DTE
# ==============================================================================

MODULOS_KNOWLEDGE = {
    "/dashboard": {
        "titulo": "📊 Dashboard de Control General",
        "guia": "1. Revisa los indicadores clave (KPIs) de ventas, cobros y compras del día.\n2. Examina la gráfica de flujo financiero y tendencias.\n3. Consulta el listado de productos con bajo stock y accesos rápidos.",
        "faqs": "P: ¿Los datos son en vivo?\nR: Sí, se actualizan automáticamente tras cada transacción."
    },
    "/facturas": {
        "titulo": "🧾 Facturación DTE (Ministerio de Hacienda)",
        "guia": "1. Verifica tener una caja abierta (el indicador del encabezado debe estar en verde).\n2. Selecciona o busca el Cliente.\n3. Agrega los productos desde el catálogo verificando precios y existencias.\n4. Selecciona el Tipo de Documento (Factura, Crédito Fiscal, Consumidor Final) y Método de Pago (Efectivo/Transferencia/Tarjeta).\n5. Presiona 'Emitir Factura' y luego 'Transmitir DTE' para enviar al Ministerio de Hacienda.",
        "faqs": "P: ¿Qué hago si me dice 'No tiene caja abierta'?\nR: Presiona el botón '[Abrir]' en el encabezado o ve a Control de Caja e ingresa el monto inicial."
    },
    "/cajas": {
        "titulo": "💼 Control de Caja, Turnos y Movimientos",
        "guia": "1. **Apertura:** Presiona 'Aperturar Turno' e ingresa el fondo de caja inicial.\n2. **Operaciones:** Toda venta, cobro CxC, pago a proveedor o gasto en efectivo afectará este turno automáticamente.\n3. **Inyección de Capital:** Usa 'Inyectar Capital' para registrar aportes de socios (0% interés) o préstamos.\n4. **Cierre de Caja:** Al terminar la jornada, presiona 'Cerrar Turno', realiza el conteo físico de billetes y monedas (arqueo) y confirma.",
        "faqs": "P: ¿Qué es una Caja Trasnochada?\nR: Es un turno que quedó abierto de un día anterior. El sistema te exigirá cerrarlo antes de abrir la jornada de hoy."
    },
    "/clientes": {
        "titulo": "👥 Gestión de Clientes",
        "guia": "1. Presiona 'Nuevo Cliente'.\n2. Ingresa Nombre, NIT/NRC/DUI, Dirección y Teléfono.\n3. Define el Límite de Crédito si el cliente realizará compras a plazo.\n4. Guarda los cambios.",
        "faqs": "P: ¿Puedo vender a un cliente genérico?\nR: Sí, el sistema incluye 'Cliente Consumidor Final' para ventas rápidas."
    },
    "/cuentas-cobrar": {
        "titulo": "💳 Cuentas por Cobrar (CxC)",
        "guia": "1. Revisa los saldos pendientes agrupados por cliente.\n2. Haz clic en 'Registrar Cobro' en la fila del cliente o factura.\n3. Ingresa el monto a abonar, método de pago y número de comprobante.\n4. Si cobras en efectivo, el dinero ingresará a tu caja activa en vivo.",
        "faqs": "P: ¿Puedo imprimir estado de cuenta?\nR: Sí, usa el botón 'Imprimir Estado de Cuenta' en la ficha del cliente."
    },
    "/gastos": {
        "titulo": "💸 Gastos Operativos (Caja Chica / Banco)",
        "guia": "1. Selecciona la categoría del gasto (Servicios, Mantenimiento, Viáticos, etc.).\n2. Ingresa el monto y la descripción del egreso.\n3. Selecciona si el pago sale de 'Efectivo de Caja' (requiere caja abierta) o 'Transferencia Bancaria'.\n4. Presiona 'Registrar Gasto'.",
        "faqs": "P: ¿Puedo crear categorías nuevas?\nR: Sí, presiona el botón '+' al lado del selector de categorías."
    },
    "/proveedores": {
        "titulo": "🚚 Gestión de Proveedores",
        "guia": "1. Presiona 'Nuevo Proveedor'.\n2. Completa Razón Social, NIT/NRC, Contacto y Teléfono.\n3. Este registro es indispensable para procesar Órdenes de Compra y Crédito Fiscal.",
        "faqs": "P: ¿Se refleja la deuda automáticamente?\nR: Sí, al recibir compras a crédito en Órdenes de Compra."
    },
    "/ordenes-compra": {
        "titulo": "🛒 Órdenes de Compra & Recepción de Inventario",
        "guia": "1. Presiona 'Nueva Orden de Compra' y selecciona el proveedor.\n2. Añade los productos indicando cantidades y costos de adquisición.\n3. Al llegar la mercadería, abre la orden y cambia su estado a 'Recibida'.\n4. El inventario se sumará a la bodega elegida y recalculará el Costo Promedio Ponderado.",
        "faqs": "P: ¿Qué pasa si la compra es al contado en efectivo?\nR: Al recibirla, desmarca 'Crear Cuenta por Pagar' y el egreso se descontará de la caja activa."
    },
    "/cuentas-pagar": {
        "titulo": "📄 Cuentas por Pagar (CxP)",
        "guia": "1. Examina las facturas y compras pendientes de pago a proveedores.\n2. Haz clic en 'Registrar Pago'.\n3. Ingresa el valor abonado y la forma de pago (Efectivo o Banco).\n4. Si pagas en efectivo, se registrará el egreso correspondiente en tu turno de caja.",
        "faqs": "P: ¿Permite abonos parciales?\nR: Sí, la cuenta se mantendrá en estado 'Parcial' hasta saldar el total."
    },
    "/bodegas": {
        "titulo": "🏬 Administración de Bodegas y Sucursales",
        "guia": "1. Registra tus almacenes físicos o sucursales.\n2. Define la bodega 'Predeterminada' desde la cual el punto de venta descontará producto por defecto.",
        "faqs": "P: ¿Puedo transferir productos entre bodegas?\nR: Sí, desde la pantalla de Kardex / Existencias."
    },
    "/existencias": {
        "titulo": "📦 Existencias en Tiempo Real",
        "guia": "1. Filtra los productos por bodega para consultar el stock disponible.\n2. Observa las alertas en rojo de ítems con existencias por debajo del stock mínimo.",
        "faqs": "P: ¿Cómo se valora el inventario?\nR: Multiplicando las unidades físicas por su costo promedio vigente."
    },
    "/kardex": {
        "titulo": "📋 Libro Kardex (Trazabilidad Físico-Valorada)",
        "guia": "1. Selecciona un producto del buscador para auditar su historia completa.\n2. Revisa las Entradas (compras), Salidas (ventas/gastos) y Saldos.\n3. Verifica el Costo Promedio Ponderado por transacción.",
        "faqs": "P: ¿Es conforme al Código de Comercio y Hacienda?\nR: Sí, cumple 100% con la normativa NIIF para Pymes."
    },
    "/productos": {
        "titulo": "📦 Catálogo de Productos y Servicios",
        "guia": "1. Haz clic en 'Nuevo Producto'.\n2. Elige si es 'Producto Físico' (descuenta inventario) o 'Servicio'.\n3. Ingresa Código, Nombre, Precio de Venta, Costo Inicial y Categoría.\n4. Opcionalmente asigna una imagen URL.",
        "faqs": "P: ¿Los servicios manejan stock?\nR: No, los servicios se facturan sin restar inventario físico."
    },
    "/despachos": {
        "titulo": "🚚 Rutas y Entregas (Logística)",
        "guia": "1. Asigna facturas pendientes de entrega a una Ruta de Despacho.\n2. Asigna un motorista/repartidor.\n3. Actualiza el estado a 'En Ruta' y finalmente 'Entregado' al confirmar la recepción.",
        "faqs": "P: ¿Genera guía de transporte?\nR: Sí, enlaza directamente al DTE de transporte."
    },
    "/vendedores": {
        "titulo": "👤 Vendedores y Comisiones",
        "guia": "1. Administra tu fuerza de ventas.\n2. Asigna porcentajes de comisión sobre ventas realizadas.",
        "faqs": "P: ¿Dónde se selecciona el vendedor?\nR: En el formulario de emisión de factura DTE."
    },
    "/configuracion-dte": {
        "titulo": "⚙️ Configuración DTE (Hacienda El Salvador)",
        "guia": "1. Carga tu archivo de certificado digital `.p12` y su contraseña.\n2. Completa la clave API de recepción otorgada por el Ministerio de Hacienda.\n3. Selecciona el Entorno (Pruebas / Producción).\n4. Guarda y realiza una prueba de firma.",
        "faqs": "P: ¿Qué hago si falla la firma?\nR: Verifica que la clave del certificado .p12 y la clave API de Hacienda sean idénticas a las registradas en el portal MH."
    },
    "/usuarios": {
        "titulo": "👥 Gestión de Usuarios y Roles (RBAC)",
        "guia": "1. Crea usuarios asignando Username, Correo y Contraseña.\n2. Asigna uno de los roles: Admin, Cajera, Bodeguero, Vendedor, Contador, Auditor, etc.\n3. Controla estados activo/inactivo o resetea credenciales.",
        "faqs": "P: ¿Quién puede crear usuarios?\nR: Exclusivamente los usuarios con rol de Administrador."
    },
    "/acreedores": {
        "titulo": "🏦 Acreedores y Préstamos Bancarios",
        "guia": "1. Registra instituciones financieras o acreedores privados.\n2. Ingresa los préstamos obtenidos especificando monto, tasa de interés y plazo.\n3. El capital ingresará al flujo financiero.",
        "faqs": "P: ¿Genera amortización?\nR: Sí, calcula automáticamente las cuotas de capital e interés."
    },
    "/pago-prestamos": {
        "titulo": "🧮 Pago de Préstamos",
        "guia": "1. Selecciona el préstamo a abonar.\n2. Revisa la cuota correspondiente a la fecha.\n3. Selecciona si el pago se realiza en Efectivo de Caja (requiere turno abierto) o Banco.\n4. Procesa el pago para actualizar el saldo del pasivo.",
        "faqs": "P: ¿Afecta caja?\nR: Si seleccionas Efectivo, generará el egreso correspondiente en tu caja activa."
    },
    "/aportantes": {
        "titulo": "👥 Aportantes de Capital (Sin Interés)",
        "guia": "1. Registra los socios o inversionistas de la empresa.\n2. Registra aportes de capital adicionales o retiros de socios.",
        "faqs": "P: ¿Genera egreso/ingreso en caja?\nR: Sí, si se selecciona método en Efectivo."
    },
    "/backup-recovery": {
        "titulo": "🛡️ Copia de Seguridad y Restauración",
        "guia": "1. **Exportar:** Presiona 'Exportar Backup' para descargar un archivo JSON firmado digitalmente con clave criptográfica HMAC-SHA256.\n2. **Restaurar:** Carga el archivo `.json` de respaldo y presiona 'Verificar y Restaurar'. El sistema validará la firma para asegurar que no fue alterado.",
        "faqs": "P: ¿Es seguro?\nR: 100% seguro. Cualquier modificación manual en el archivo invalidará la firma y rechazará la restauración."
    }
}

# Base de Preguntas Frecuentes / Intenciones Específicas
PROCEDIMIENTOS_KNOWLEDGE = [
    {
        "intent": "caja_cerrada",
        "keywords": ["caja cerrada", "abrir caja", "aperturar turno", "sin caja", "no me deja facturar", "no puedo cobrar en efectivo", "no tiene caja abierta"],
        "respuesta": "🔑 **¿Cómo abrir la Caja / Resolver 'Caja Cerrada'?**\n\n1. **Opción Rápida:** Haz clic en el botón **'[Abrir]'** en el indicador de caja ubicado en la barra superior (Header).\n2. **Opción Completa:** Ve al menú **Finanzas -> Control de Caja** (`/cajas`) y presiona 'Aperturar Turno'.\n3. Selecciona la caja física y digita tu **Saldo Inicial** (fondo de caja físico).\n4. Al confirmar, tu caja quedará **ABIERTA** (en verde) y podrás facturar, cobrar CxC y pagar gastos en efectivo sin inconvenientes.",
        "redirect": "/cajas"
    },
    {
        "intent": "caja_trasnochada",
        "keywords": ["trasnochada", "dia anterior", "caja anterior", "cierre z", "cerrar caja ayer"],
        "respuesta": "⚠️ **Caja Trasnochada (Abierta en día anterior)**\n\nCuando dejaste un turno abierto de una fecha previa, el sistema te solicitará realizar el Cierre Z antes de abrir hoy:\n\n1. Ve a **Control de Caja** (`/cajas`).\n2. Presiona **'Cerrar Turno'**.\n3. Realiza el **Arqueo Físico** (ingresa la cantidad de billetes y monedas que tienes en la gaveta).\n4. Confirma el cierre. Si hay sobrante o faltante, el sistema lo registrará en el acta de cierre.\n5. Inmediatamente después, presiona **'Aperturar Turno'** con el nuevo fondo para el día de hoy.",
        "redirect": "/cajas"
    },
    {
        "intent": "cierre_caja",
        "keywords": ["cerrar caja", "arqueo", "cierre z", "cuadrar caja", "cerrar turno"],
        "respuesta": "📊 **¿Cómo hacer el Cierre y Arqueo de Caja?**\n\n1. Dirígete a **Finanzas -> Control de Caja** (`/cajas`).\n2. Presiona el botón **'Cerrar Turno'**.\n3. Se abrirá la calculadora de **Arqueo de Billetes y Monedas**.\n4. Cuenta tu efectivo físico y digita las cantidades ($100, $50, $20, $10, $5, $1, monedas, etc.).\n5. El sistema comparará tu total físico contra el saldo calculado (Fondo + Ingresos - Egresos).\n6. Si todo cuadra (Diferencia = $0.00) o hay sobrante/faltante, presiona **'Confirmar Cierre'**.",
        "redirect": "/cajas"
    },
    {
        "intent": "inyectar_capital",
        "keywords": ["inyectar capital", "aporte socio", "prestamo socio", "meter dinero", "fondo extra"],
        "respuesta": "💵 **¿Cómo Inyectar Capital a la Caja?**\n\nSi necesitas ingresar efectivo a la caja que no proviene de una venta (ej: aporte de socio o préstamo temporal):\n\n1. Ve a **Control de Caja** (`/cajas`).\n2. Asegúrate de tener la caja abierta.\n3. Presiona el botón **'Inyectar Capital'**.\n4. Selecciona el Tipo: 'Aporte de Socio (0% interés)' o 'Préstamo con/sin interés'.\n5. Ingresa el nombre del acreedor/socio y el monto.\n6. El dinero ingresará al saldo de la caja sin inflar tus reporte de ventas gravadas.",
        "redirect": "/cajas"
    },
    {
        "intent": "emitir_factura",
        "keywords": ["emitir factura", "hacer venta", "facturar", "crear dte", "consumidor final", "credito fiscal"],
        "respuesta": "🧾 **Pasos para Emitir una Factura / DTE:**\n\n1. Asegúrate de tener tu **Caja Abierta** (badge en verde en el encabezado).\n2. Ve a **Ventas -> Facturación DTE** (`/facturas`).\n3. Selecciona el **Cliente** (o Consumidor Final).\n4. Agrega los productos desde el buscador de catálogo.\n5. Selecciona el **Tipo de DTE** (Factura Consumidor Final, Crédito Fiscal, Nota de Crédito).\n6. Selecciona el **Condición de Pago** (Contado / Crédito) y Método de Pago.\n7. Presiona **'Emitir Factura'**.\n8. Para enviarla a Hacienda El Salvador, presiona el botón **'Transmitir DTE'**.",
        "redirect": "/facturas"
    },
    {
        "intent": "anular_factura",
        "keywords": ["anular factura", "cancelar factura", "anular dte", "invalidar documento"],
        "respuesta": "🚫 **¿Cómo Anular una Factura?**\n\n1. Ingresa a **Facturación DTE** (`/facturas`).\n2. En la tabla de facturas emitidas, ubica el documento a anular.\n3. Presiona el botón de tres puntos o el icono de papelera/anular.\n4. Selecciona el motivo de invalidación.\n5. Confirma la anulación. El sistema devolverá el stock al inventario y revertirá el dinero si fue al contado.",
        "redirect": "/facturas"
    },
    {
        "intent": "cobrar_cxc",
        "keywords": ["cobrar", "abono cliente", "cuenta por cobrar", "recibir pago cliente", "saldar deuda cliente"],
        "respuesta": "💳 **¿Cómo registrar un Cobro a Cliente (CxC)?**\n\n1. Ve a **Ventas -> Cuentas por Cobrar** (`/cuentas-cobrar`).\n2. Busca al cliente en la lista y presiona **'Registrar Cobro'**.\n3. Ingresa la cantidad a abonar o liquidar.\n4. Selecciona el método de pago: **Efectivo** (requiere caja abierta), **Transferencia** o **Tarjeta**.\n5. Presiona **'Confirmar Cobro'**. El abono actualizará el saldo pendiente y, si fue en efectivo, se sumará inmediatamente a tu caja activa.",
        "redirect": "/cuentas-cobrar"
    },
    {
        "intent": "pagar_cxp",
        "keywords": ["pagar proveedor", "cuenta por pagar", "abono proveedor", "pagar deuda comprad"],
        "respuesta": "📄 **¿Cómo registrar un Pago a Proveedor (CxP)?**\n\n1. Ve a **Compras -> Cuentas por Pagar** (`/cuentas-pagar`).\n2. Selecciona la factura o compra pendiente del proveedor.\n3. Presiona **'Registrar Pago'**.\n4. Ingresa el monto abonado y el medio de pago (Efectivo de Caja o Banco).\n5. Al guardar, si fue en efectivo se registrará el egreso automático en tu caja activa.",
        "redirect": "/cuentas-pagar"
    },
    {
        "intent": "registrar_gasto",
        "keywords": ["registrar gasto", "crear gasto", "gasto operativo", "caja chica", "pago servicio"],
        "respuesta": "💸 **¿Cómo registrar un Gasto Operativo?**\n\n1. Ve a **Finanzas -> Gastos Operativos** (`/gastos`).\n2. Selecciona la **Categoría del Gasto** (Servicios, Mantenimiento, Viáticos, Renta, etc.).\n3. Ingresa el **Monto** ($) y el **Concepto / Descripción**.\n4. Elige si el pago sale de **Efectivo de Caja** (requiere turno de caja abierto) o **Transferencia Bancaria**.\n5. Haz clic en **'Registrar Gasto'**.",
        "redirect": "/gastos"
    },
    {
        "intent": "orden_compra",
        "keywords": ["orden compra", "recibir producto", "ingresar mercaderia", "comprar inventario"],
        "respuesta": "🛒 **¿Cómo procesar Compras e Ingreso de Mercadería?**\n\n1. Ve a **Compras -> Compra / Orden de Compra** (`/ordenes-compra`).\n2. Presiona **'Nueva Órden de Compra'**, elige el proveedor e ingresa los productos con su costo de adquisición.\n3. Cuando los productos físicos lleguen al almacén, abre la orden y cambia su estado a **'Recibida'**.\n4. ¡Listo! Las existencias ingresarán automáticamente a la bodega y el Libro Kardex actualizará el Costo Promedio Ponderado.",
        "redirect": "/ordenes-compra"
    },
    {
        "intent": "kardex_inventario",
        "keywords": ["kardex", "costo promedio", "trazabilidad", "auditar producto", "entradas y salidas"],
        "respuesta": "📋 **¿Cómo consultar el Libro Kardex?**\n\n1. Ve a **Almacén -> Libro Kardex** (`/kardex`).\n2. Selecciona el producto que deseas auditar.\n3. Verás la lista cronológica de todas las Entradas (compras), Salidas (ventas/gastos) y el saldo valorizado con su **Costo Promedio Ponderado**.",
        "redirect": "/kardex"
    },
    {
        "intent": "backup_restauracion",
        "keywords": ["backup", "copia de seguridad", "restaurar", "respaldo", "hmac"],
        "respuesta": "🛡️ **¿Cómo exportar y restaurar la Copia de Seguridad (Backup)?**\n\n1. Ve a **Configuración -> Backup y Restauración** (`/backup-recovery`).\n2. **Para Exportar:** Presiona **'Exportar Backup'**. Se descargará un archivo `.json` firmado con clave de seguridad HMAC-SHA256.\n3. **Para Restaurar:** Selecciona tu archivo `.json` guardado y haz clic en **'Verificar y Restaurar'**. El sistema autenticará la firma para garantizar que no fue manipulado.",
        "redirect": "/backup-recovery"
    },
    {
        "intent": "usuarios_roles",
        "keywords": ["crear usuario", "cambiar rol", "permisos", "vendedor", "cajera", "bodeguero"],
        "respuesta": "👥 **¿Cómo administrar Usuarios y Roles (RBAC)?**\n\n1. Dirígete a **Configuración -> Gestión de Usuarios** (`/usuarios`).\n2. Haz clic en **'Nuevo Usuario'**.\n3. Completa Username, Email y Password.\n4. Selecciona el **Rol** (Admin, Cajera, Bodeguero, Vendedor, Auditor, etc.).\n5. Guarda el usuario. Las pantallas se adaptarán automáticamente a los permisos de ese perfil.",
        "redirect": "/usuarios"
    },
    {
        "intent": "acreedores_maestro",
        "keywords": ["acreedor", "acreedores", "prestamista", "catalogo acreedores", "maestro acreedores"],
        "respuesta": "🏦 **Directorio Maestro de Acreedores (`/acreedores`):**\n\n1. Esta pantalla es exclusivamente el **Catálogo Maestro** de prestamistas (Bancos, Financieras, Personas).\n2. Registra y edita Nombre, DUI/NIT, Teléfono y datos de contacto.\n3. Presiona **'👁️ Ver Préstamos'** en cualquier acreedor para ir a la central de Préstamos y Amortizaciones.",
        "redirect": "/acreedores"
    },
    {
        "intent": "prestamos_cuotas",
        "keywords": ["prestamo", "prestamos", "cuotas", "amortizacion", "pagar cuota", "tabla amortizacion"],
        "respuesta": "🧮 **Préstamos y Amortizaciones (`/pago-prestamos`):**\n\n1. Esta pantalla es el **Módulo Gestor de Préstamos y Pago de Cuotas**.\n2. Presiona **'Nuevo Préstamo'** para crear un contrato eligiendo el Acreedor del maestro, monto, plazo e interés.\n3. Selecciona cualquier préstamo para ver su **Tabla de Amortización** (Sistema Francés o Interés Simple).\n4. Presiona **'$ Pagar Cuota'** para liquidar en orden correlativo descontando de caja chica o banco.",
        "redirect": "/pago-prestamos"
    },
    {
        "intent": "configuracion_dte",
        "keywords": ["configurar dte", "certificado p12", "firma hacienda", "llave api mh"],
        "respuesta": "⚙️ **¿Cómo configurar la Facturación Electrónica DTE?**\n\n1. Ve a **Configuración -> Configuración DTE** (`/configuracion-dte`).\n2. Carga tu archivo de **Certificado Digital `.p12`** y escribe su contraseña.\n3. Ingresa tu **Clave API de Hacienda** (otorgada por el MH El Salvador).\n4. Selecciona el **Entorno** (Pruebas o Producción).\n5. Presiona 'Guardar Configuración' y realiza la prueba de firma.",
        "redirect": "/configuracion-dte"
    }
]

ERP_KEYWORDS = [
    "factura", "dte", "caja", "cobro", "pago", "cliente", "proveedor", "bodega",
    "kardex", "existencia", "producto", "stock", "gasto", "orden", "compra",
    "cuenta", "cobrar", "pagar", "usuario", "rol", "sistema", "empresa",
    "hacienda", "emisión", "despacho", "ruta", "inventario", "cierre", "apertura",
    "financiamiento", "préstamo", "aporte", "impuesto", "nit", "nrc", "iva",
    "ayuda", "hola", "buenos dias", "buenas tardes", "buenas noches", "gracias",
    "opciones", "manual", "configuración", "certificación", "token", "sucursal",
    "inicio", "dashboard", "sesión", "turno", "arqueo", "guia", "como", "usar",
    "trasnochada", "inyectar", "acreedor", "aportante", "backup", "restaurar", "firmar",
    "que haces", "que puedes hacer", "sirves", "funciones"
]

MESSAGE_PAID_SERVICE = (
    "Soy tu asistente virtual especializado exclusivamente en el sistema de Facturación e Inventarios ERP. "
    "Para soporte o desarrollo en sistemas o herramientas externas a la plataforma, disponemos de un servicio de asistencia extendida con costo adicional. "
    "¿En qué te puedo asesorar respecto a tus operaciones de ventas, compras, caja o inventarios hoy?"
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

    # Mensajes personalizados divertidos
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
    if any(p in msg_lower for p in ["qué puedes hacer", "que puedes hacer", "qué haces", "que haces", "funciones", "sirves"]):
        ans = (
            "🤖 **Funciones de tu Avatar Asistente:**\n\n"
            "🧭 **Guía por Página**: Te explico paso a paso cómo operar cada uno de los 16 módulos del ERP mediante el botón 'Guíame en esta página'.\n"
            "💬 **Resolución de Dudas**: Respondo exactamente qué hacer ante cualquier proceso (Caja cerrada, DTE, CxC, CxP, Gastos, Inventario, Backups).\n"
            "🎙️ **Voz Bidireccional**: Escucho por micrófono y respondo por voz en español.\n"
            "🔒 **Respuesta por Rol**: Adapto explicaciones según tu nivel de acceso (Admin, Cajera, Bodeguero, etc.).\n"
            "🔗 **Navegación Rápida**: Te ofrezco atajos a la pantalla donde debes realizar la operación."
        )
        return ChatResponse(response=ans)

    # Buscar coincidencia exacta en el motor de procedimientos / FAQ
    for proc in PROCEDIMIENTOS_KNOWLEDGE:
        if any(kw in msg_lower for kw in proc["keywords"]):
            return ChatResponse(
                response=proc["respuesta"],
                redirect_url=proc.get("redirect")
            )

    # Si solicita guía del módulo actual
    if any(p in msg_lower for p in ["guia", "cómo usar", "como usar", "esta página", "esta pantalla", "ayuda", "explicame"]):
        info_mod = MODULOS_KNOWLEDGE.get(mod, MODULOS_KNOWLEDGE.get("/dashboard"))
        ans = f"🧭 **Guía de Uso: {info_mod['titulo']}**\n\n{info_mod['guia']}\n\n💡 **Frecuentes:** {info_mod['faqs']}"
        return ChatResponse(response=ans)

    # Saludos
    if any(p in msg_lower for p in ["hola", "buenos dias", "buenas tardes", "buenas noches", "saludos"]):
        info_current = MODULOS_KNOWLEDGE.get(mod, MODULOS_KNOWLEDGE.get("/dashboard"))
        ans = f"¡Hola! Soy tu Avatar Asistente. Tu perfil es **{rol.upper()}**.\nActualmente estás en **{info_current['titulo']}**.\n\n¿En qué operación te puedo asistir hoy? Puedes preguntarme sobre apertura/cierre de caja, facturación DTE, cobros, compras o existencias."
        return ChatResponse(response=ans)

    # Si no hubo coincidencia directa por procedimiento, ofrecer la guía del módulo actual
    info_mod = MODULOS_KNOWLEDGE.get(mod, MODULOS_KNOWLEDGE.get("/dashboard"))
    ans = f"Te encuentras en **{info_mod['titulo']}**.\n\n{info_mod['guia']}\n\n💡 **Frecuentes:** {info_mod['faqs']}"
    return ChatResponse(response=ans)
