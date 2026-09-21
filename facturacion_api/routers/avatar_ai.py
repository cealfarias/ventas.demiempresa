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
        "intent": "opciones_inventario",
        "keywords": ["opciones de inventario", "formas de inventario", "descontar existencia", "no afectar existencia", "producto fisico", "servicio sin stock", "json de compra", "armar por json", "crear producto por compra", "como trabajar inventarios", "cómo trabajar los inventarios", "dos opciones de inventario", "metodos de inventario"],
        "respuesta": "📦 **Opciones para Trabajar los Inventarios en el Sistema:**\n\n1️⃣ **Al Facturar/Vender:**\n• **Producto Físico:** Descuenta existencias automáticamente de la bodega asignada y actualiza el Kardex.\n• **Servicio / No Inventariable:** Permite facturar libremente sin requerir existencias ni afectar stock en bodega.\n\n2️⃣ **Al Comprar (DTE / JSON):**\n• Al cargar o procesar el **JSON / DTE de Compra de Proveedores**, el sistema **crea automáticamente los productos nuevos** si no existen y **actualiza/incrementa las existencias** en la bodega asignada con su Costo Promedio Ponderado.",
        "redirect": "/productos"
    },
    {
        "intent": "primeros_pasos",
        "keywords": ["primeros pasos", "por donde empiezo", "por dónde empiezo", "que hago primero", "qué hago primero", "primer ingreso", "nuevo usuario", "configurar desde cero", "como empiezo", "cómo empiezo", "pasos iniciales", "pasos para iniciar", "que debo hacer al entrar"],
        "respuesta": "🚀 **Pasos Iniciales Recomendados para un Nuevo Usuario / Empresa:**\n\n1️⃣ **Configuración DTE (`/configuracion-dte`):** Ingresa la razón social, NIT/NRC y tu certificado del Ministerio de Hacienda.\n2️⃣ **Crear Bodega (`/bodegas`):** Registra tu primera bodega o tienda física para inventario.\n3️⃣ **Cargar Productos (`/productos`):** Agrega los productos o servicios que ofrecerás con su precio de venta.\n4️⃣ **Aperturar Caja (`/cajas`):** Abre tu primer turno de caja para comenzar a emitir facturas.",
        "redirect": "/configuracion-dte"
    },
    {
        "intent": "emitir_factura",
        "keywords": ["emitir factura", "hacer venta", "facturar", "crear dte", "consumidor final", "credito fiscal", "como hago facturas", "cómo hago facturas", "como hago una factura", "cómo hago una factura", "como emitir", "cómo emitir", "como vendo", "cómo vendo"],
        "respuesta": "🧾 **¿Cómo emitir una Factura / DTE?**\n\n1. Asegúrate de tener tu **Caja Abierta** (indicador verde en el encabezado).\n2. Ve al módulo **Facturación DTE** (`/facturas`).\n3. Selecciona el **Cliente** (o Consumidor Final para venta rápida).\n4. Agrega los productos o servicios desde el catálogo.\n5. Elige el **Tipo de Documento** (Factura, Crédito Fiscal, Nota de Crédito) y Condición de Pago.\n6. Haz clic en **'Emitir Factura'** y posteriormente en **'Transmitir DTE'** para enviar a Hacienda.",
        "redirect": "/facturas"
    },
    {
        "intent": "orden_compra",
        "keywords": ["orden compra", "recibir producto", "ingresar mercaderia", "comprar inventario", "como hago una compra", "cómo hago una compra", "como hago compras", "cómo hago compras", "como compro", "cómo compro", "como ingresar compra", "cómo ingresar compra"],
        "respuesta": "🛒 **¿Cómo procesar Compras e Ingreso de Inventario?**\n\n1. Ve al menú **Compras -> Compra / Orden de Compra** (`/ordenes-compra`).\n2. Presiona **'Nueva Órden de Compra'** y selecciona el proveedor.\n3. Añade los productos indicando cantidades y costo de adquisición.\n4. Cuando los productos lleguen físicamente, abre la orden y cambia su estado a **'Recibida'**.\n5. Las existencias ingresarán automáticamente a la bodega y el Kardex recalculará el Costo Promedio Ponderado.",
        "redirect": "/ordenes-compra"
    },
    {
        "intent": "caja_cerrada",
        "keywords": ["caja cerrada", "abrir caja", "aperturar turno", "sin caja", "no me deja facturar", "no puedo cobrar en efectivo", "no tiene caja abierta", "como abro caja", "cómo abro la caja", "como hago apertura de caja", "cómo hago la apertura"],
        "respuesta": "🔑 **¿Cómo abrir la Caja / Resolver 'Caja Cerrada'?**\n\n1. **Opción Rápida:** Haz clic en el botón **'[Abrir]'** en el indicador de caja ubicado en la barra superior (Header).\n2. **Opción Completa:** Ve a **Control de Caja** (`/cajas`) y presiona 'Aperturar Turno'.\n3. Selecciona la caja física e ingresa tu **Saldo Inicial** (fondo de caja).\n4. Al confirmar, tu caja quedará **ABIERTA** y podrás facturar y cobrar en efectivo.",
        "redirect": "/cajas"
    },
    {
        "intent": "cierre_caja",
        "keywords": ["cerrar caja", "arqueo", "cierre z", "cuadrar caja", "cerrar turno", "como cierro caja", "cómo cierro la caja", "como hago el cierre de caja", "cómo hago el cierre"],
        "respuesta": "📊 **¿Cómo hacer el Cierre y Arqueo de Caja?**\n\n1. Dirígete a **Finanzas -> Control de Caja** (`/cajas`).\n2. Presiona el botón **'Cerrar Turno'**.\n3. Se abrirá la calculadora de **Arqueo de Billetes y Monedas**.\n4. Cuenta tu efectivo físico y digita las cantidades.\n5. El sistema comparará tu total físico contra el saldo calculado por el sistema.\n6. Si todo cuadra (Diferencia = $0.00), presiona **'Confirmar Cierre'**.",
        "redirect": "/cajas"
    },
    {
        "intent": "cobrar_cxc",
        "keywords": ["cobrar", "abono cliente", "cuenta por cobrar", "recibir pago cliente", "saldar deuda cliente", "como hago un cobro", "cómo hago un cobro", "como cobro", "cómo cobro", "como abonar cliente"],
        "respuesta": "💳 **¿Cómo registrar un Cobro a Cliente (CxC)?**\n\n1. Ve a **Ventas -> Cuentas por Cobrar** (`/cuentas-cobrar`).\n2. Busca al cliente y presiona **'Registrar Cobro'**.\n3. Ingresa la cantidad a abonar y selecciona la forma de pago (**Efectivo**, **Transferencia** o **Tarjeta**).\n4. Al confirmar, el saldo del cliente se actualizará y, si fue en efectivo, se sumará inmediatamente a tu caja activa.",
        "redirect": "/cuentas-cobrar"
    },
    {
        "intent": "pagar_cxp",
        "keywords": ["pagar proveedor", "cuenta por pagar", "abono proveedor", "pagar deuda comprad", "como hago un pago a proveedor", "cómo hago un pago a proveedor", "como pago proveedor"],
        "respuesta": "📄 **¿Cómo registrar un Pago a Proveedor (CxP)?**\n\n1. Ve a **Compras -> Cuentas por Pagar** (`/cuentas-pagar`).\n2. Selecciona la factura o compra pendiente del proveedor.\n3. Presiona **'Registrar Pago'**.\n4. Ingresa el monto abonado y el medio de pago (Efectivo de Caja o Banco).\n5. Al guardar, si fue en efectivo se registrará el egreso automático en tu caja activa.",
        "redirect": "/cuentas-pagar"
    },
    {
        "intent": "registrar_gasto",
        "keywords": ["registrar gasto", "crear gasto", "gasto operativo", "caja chica", "pago servicio", "como hago un gasto", "cómo hago un gasto", "como registro un gasto", "cómo registro un gasto"],
        "respuesta": "💸 **¿Cómo registrar un Gasto Operativo?**\n\n1. Ve a **Finanzas -> Gastos Operativos** (`/gastos`).\n2. Selecciona la **Categoría del Gasto** (Servicios, Mantenimiento, Viáticos, Renta, etc.).\n3. Ingresa el **Monto** ($) y el **Concepto / Descripción**.\n4. Elige si el pago sale de **Efectivo de Caja** (requiere turno de caja abierto) o **Transferencia Bancaria**.\n5. Haz clic en **'Registrar Gasto'**.",
        "redirect": "/gastos"
    },
    {
        "intent": "crear_cliente",
        "keywords": ["crear cliente", "nuevo cliente", "registrar cliente", "como creo un cliente", "cómo creo un cliente", "como hago un cliente", "cómo hago un cliente"],
        "respuesta": "👥 **¿Cómo crear un nuevo Cliente?**\n\n1. Dirígete a **Ventas -> Clientes** (`/clientes`).\n2. Haz clic en el botón **'Nuevo Cliente'**.\n3. Ingresa el Nombre, NIT/NRC/DUI, Teléfono y Dirección.\n4. Asigna un límite de crédito si realizará compras a plazo y guarda los cambios.",
        "redirect": "/clientes"
    },
    {
        "intent": "crear_producto",
        "keywords": ["crear producto", "nuevo producto", "agregar producto", "como creo un producto", "cómo creo un producto", "como hago un producto"],
        "respuesta": "📦 **¿Cómo crear un nuevo Producto o Servicio?**\n\n1. Ve a **Almacén -> Catálogo de Productos** (`/productos`).\n2. Haz clic en **'Nuevo Producto'**.\n3. Selecciona si es **Producto Físico** (descuenta stock) o **Servicio**.\n4. Ingresa el Código, Nombre, Precio de Venta y Costo Inicial.",
        "redirect": "/productos"
    },
    {
        "intent": "kardex_inventario",
        "keywords": ["kardex", "costo promedio", "trazabilidad", "auditar producto", "entradas y salidas", "como consulto el kardex", "cómo consulto el kardex", "como veo el kardex"],
        "respuesta": "📋 **¿Cómo consultar el Libro Kardex?**\n\n1. Ve a **Almacén -> Libro Kardex** (`/kardex`).\n2. Selecciona el producto que deseas auditar.\n3. Verás el historial cronológico de todas las Entradas (compras), Salidas (ventas/gastos) y el saldo valorizado con su **Costo Promedio Ponderado**.",
        "redirect": "/kardex"
    },
    {
        "intent": "backup_restauracion",
        "keywords": ["backup", "copia de seguridad", "restaurar", "respaldo", "hmac", "como hago un backup", "cómo hago un backup", "como respaldo"],
        "respuesta": "🛡️ **¿Cómo exportar y restaurar la Copia de Seguridad (Backup)?**\n\n1. Ve a **Configuración -> Backup y Restauración** (`/backup-recovery`).\n2. **Para Exportar:** Presiona **'Exportar Backup'**. Se descargará un archivo `.json` firmado con clave de seguridad HMAC-SHA256.\n3. **Para Restaurar:** Selecciona tu archivo `.json` guardado y haz clic en **'Verificar y Restaurar'**.",
        "redirect": "/backup-recovery"
    },
    {
        "intent": "usuarios_roles",
        "keywords": ["crear usuario", "cambiar rol", "permisos", "vendedor", "cajera", "bodeguero", "como creo un usuario", "cómo creo un usuario"],
        "respuesta": "👥 **¿Cómo administrar Usuarios y Roles (RBAC)?**\n\n1. Dirígete a **Configuración -> Gestión de Usuarios** (`/usuarios`).\n2. Haz clic en **'Nuevo Usuario'**.\n3. Completa Username, Email, Contraseña y asigna el **Rol** correspondiente.",
        "redirect": "/usuarios"
    },
    {
        "intent": "caja_trasnochada",
        "keywords": ["trasnochada", "dia anterior", "caja anterior", "cierre z", "cerrar caja ayer"],
        "respuesta": "⚠️ **Caja Trasnochada (Abierta en día anterior)**\n\n1. Ve a **Control de Caja** (`/cajas`).\n2. Presiona **'Cerrar Turno'** y realiza el arqueo físico.\n3. Confirma el cierre. Inmediatamente después, presiona **'Aperturar Turno'** con el nuevo fondo para el día de hoy.",
        "redirect": "/cajas"
    },
    {
        "intent": "inyectar_capital",
        "keywords": ["inyectar capital", "aporte socio", "prestamo socio", "meter dinero", "fondo extra"],
        "respuesta": "💵 **¿Cómo Inyectar Capital a la Caja?**\n\n1. Ve a **Control de Caja** (`/cajas`) con la caja abierta.\n2. Presiona el botón **'Inyectar Capital'**.\n3. Selecciona Tipo (Aporte o Préstamo), ingresa acreedor/socio y monto.",
        "redirect": "/cajas"
    },
    {
        "intent": "anular_factura",
        "keywords": ["anular factura", "cancelar factura", "anular dte", "invalidar documento"],
        "respuesta": "🚫 **¿Cómo Anular una Factura?**\n\n1. Ingresa a **Facturación DTE** (`/facturas`).\n2. En la tabla de facturas emitidas, ubica el documento y presiona el botón **'Anular'**.\n3. Selecciona el motivo de invalidación. El stock devolverá automáticamente al inventario.",
        "redirect": "/facturas"
    },
    {
        "intent": "acreedores_maestro",
        "keywords": ["acreedor", "acreedores", "prestamista", "catalogo acreedores", "maestro acreedores"],
        "respuesta": "🏦 **Directorio Maestro de Acreedores (`/acreedores`):**\n\n1. Registra y edita Bancos, Financieras o Prestamistas.\n2. Presiona **'👁️ Ver Préstamos'** en cualquier acreedor para ver sus contratos.",
        "redirect": "/acreedores"
    },
    {
        "intent": "prestamos_cuotas",
        "keywords": ["prestamo", "prestamos", "cuotas", "amortizacion", "pagar cuota", "tabla amortizacion", "como pago una cuota"],
        "respuesta": "🧮 **Préstamos y Amortizaciones (`/pago-prestamos`):**\n\n1. Ve a **Finanzas -> Pago de Préstamos**.\n2. Presiona **'Nuevo Préstamo'** para crear un contrato o selecciona uno existente para ver su tabla de amortización.\n3. Haz clic en **'$ Pagar Cuota'** para saldar la cuota correlativa.",
        "redirect": "/pago-prestamos"
    },
    {
        "intent": "configuracion_dte",
        "keywords": ["configurar dte", "certificado p12", "firma hacienda", "llave api mh"],
        "respuesta": "⚙️ **¿Cómo configurar la Facturación Electrónica DTE?**\n\n1. Ve a **Configuración -> Configuración DTE** (`/configuracion-dte`).\n2. Carga tu archivo de **Certificado Digital `.p12`** y su contraseña.\n3. Ingresa la **Clave API de Hacienda** y selecciona el entorno.",
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
    "inicio", "dashboard", "sesión", "turno", "arqueo", "guia", "como", "usar", "cómo", "hago", "puedo", "pasos",
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
