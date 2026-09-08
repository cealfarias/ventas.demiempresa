import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, MicOff, Volume2, VolumeX, RotateCcw, Repeat, 
  Send, Sparkles, X, ChevronUp, AlertCircle, ExternalLink, Compass, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const MODULOS_KNOWLEDGE = {
  "/dashboard": {
    titulo: "📊 Dashboard de Control General",
    guia: "1. Revisa las tarjetas de KPIs principales (Ventas totales, saldos).\n2. Observa la gráfica de ventas para tendencias temporales.\n3. Consulta el Top de Productos más vendidos.",
    faqs: "P: ¿Cada cuánto se actualiza?\nR: En tiempo real al registrar facturas o gastos."
  },
  "/facturas": {
    titulo: "🧾 Facturación DTE (Hacienda)",
    guia: "1. Valida tener un turno de caja abierto.\n2. Selecciona el cliente.\n3. Añade productos revisando la existencia en bodega predeterminada.\n4. Selecciona el Tipo de DTE y presiona 'Emitir Factura'.",
    faqs: "P: ¿Cómo anulo una factura?\nR: Presiona 'Anular' en el historial indicando el motivo."
  },
  "/cajas": {
    titulo: "💼 Control de Caja & Financiamientos",
    guia: "1. Presiona 'Aperturar Turno' con el saldo inicial.\n2. Para inyectar liquidez sin o con interés, usa 'Inyectar Capital'.\n3. Usa los botones de Editar o Eliminar para corregir movimientos.",
    faqs: "P: ¿Qué es la inyección de capital?\nR: Aportes o préstamos para compras y gastos sin alterar ventas."
  },
  "/clientes": {
    titulo: "👥 Gestión de Clientes",
    guia: "1. Haz clic en 'Nuevo Cliente'.\n2. Completa NIT/NRC/DUI y actividad económica (CAT-019).\n3. Define el límite de crédito si aplican ventas a plazo.",
    faqs: "P: ¿Quién es el cliente predeterminado?\nR: El cliente de venta rápida a consumidor final."
  },
  "/cuentas-cobrar": {
    titulo: "💳 Cuentas por Cobrar",
    guia: "1. Revisa los saldos pendientes por cliente.\n2. Presiona 'Registrar Cobro' para abonar o liquidar.\n3. El cobro recibido incrementa la disponibilidad de la caja activa.",
    faqs: "P: ¿Cómo veo el historial de abonos?\nR: En la ficha de detalle de cada cliente."
  },
  "/gastos": {
    titulo: "💸 Gastos Operativos",
    guia: "1. Selecciona la categoría del gasto.\n2. Ingresa monto y concepto.\n3. Selecciona salida por Efectivo o Transferencia y guarda.",
    faqs: "P: ¿Se descuenta del turno de caja?\nR: Sí, si se selecciona pago en Efectivo de Caja."
  },
  "/proveedores": {
    titulo: "🚚 Gestión de Proveedores",
    guia: "1. Registra distribuidores y casas comerciales.\n2. Ingresa su NIT/NRC para sustentar Crédito Fiscal en compras.",
    faqs: "P: ¿Es necesario para órdenes de compra?\nR: Sí, las órdenes requieren seleccionar un proveedor."
  },
  "/ordenes-compra": {
    titulo: "🛒 Órdenes de Compra & Recepción",
    guia: "1. Crea la orden especificando proveedor e ítems.\n2. Al recibir los productos, marca el estado como 'Recibida'.\n3. El stock ingresará automáticamente a la bodega.",
    faqs: "P: ¿Actualiza el costo promedio?\nR: Sí, recalcula el valor según el costo unitario de compra."
  },
  "/cuentas-pagar": {
    titulo: "📄 Cuentas por Pagar",
    guia: "1. Consulta los compromisos financieros con proveedores.\n2. Registra abonos parciales o pagos totales.",
    faqs: "P: ¿Cómo registro el egreso?\nR: Selecciona si el pago sale de caja o banco."
  },
  "/bodegas": {
    titulo: "🏬 Administración de Bodegas",
    guia: "1. Registra las sucursales o almacenes de la empresa.\n2. Define la bodega 'Predeterminada' para venta rápida.",
    faqs: "P: ¿Puedo tener varias bodegas?\nR: Sí, ilimitadas bodegas por empresa."
  },
  "/existencias": {
    titulo: "📦 Existencias en Tiempo Real",
    guia: "1. Consulta las unidades almacenadas por cada bodega.\n2. Filtra productos con alerta de stock mínimo.",
    faqs: "P: ¿Cómo veo el valor del inventario?\nR: Multiplica las unidades por el costo promedio ponderado."
  },
  "/kardex": {
    titulo: "📋 Libro Kardex (Trazabilidad)",
    guia: "1. Selecciona un producto para auditar su historial.\n2. Analiza las entradas, salidas y saldo valorizado.",
    faqs: "P: ¿Qué método fiscal utiliza?\nR: Costo Promedio Ponderado."
  },
  "/productos": {
    titulo: "📦 Catálogo de Productos y Servicios",
    guia: "1. Crea ítems ingresando código, precio y costo.\n2. Asigna imagen URL para visualización en facturación.",
    faqs: "P: ¿Un servicio maneja stock?\nR: No, los servicios no descuentan unidades físicas."
  },
  "/despachos": {
    titulo: "🚚 Logística y Rutas de Entrega",
    guia: "1. Agrupa facturas emitidas por ruta de entrega.\n2. Actualiza los estados: Pendiente -> En Ruta -> Entregado.",
    faqs: "P: ¿Se genera Guía DTE?\nR: Sí, se enlaza al documento de transporte de Hacienda."
  },
  "/configuracion-dte": {
    titulo: "⚙️ Configuración DTE (Hacienda)",
    guia: "1. Carga tu archivo .p12 y contraseña de certificado.\n2. Ingresa la clave API otorgada por el Ministerio de Hacienda.\n3. Selecciona el Entorno (Pruebas / Producción).",
    faqs: "P: ¿Qué hago si da error de firma?\nR: Revisa que la clave del .p12 coincida exactamente."
  },
  "/usuarios": {
    titulo: "👥 Gestión de Usuarios y Roles (RBAC)",
    guia: "1. Registra colaboradores con su username y correo.\n2. Asigna uno de los 8 roles predefinidos.\n3. Modifica estados o restablece contraseñas.",
    faqs: "P: ¿Quién puede gestionar usuarios?\nR: Exclusivamente el usuario con rol 'admin'."
  }
};

const ROLE_SHORTCUTS = {
  cajera: [
    { label: '💼 Turno de Caja', action: '/cajas' },
    { label: '🧾 Factura DTE', action: '/facturas' },
    { label: '📈 Inyectar Capital', action: '/cajas' },
    { label: '❓ ¿Qué puedes hacer?', action: 'que_haces' },
  ],
  bodeguero: [
    { label: '📦 Existencias', action: '/existencias' },
    { label: '📋 Libro Kardex', action: '/kardex' },
    { label: '📥 Compras', action: '/ordenes-compra' },
    { label: '❓ ¿Qué puedes hacer?', action: 'que_haces' },
  ],
  contador: [
    { label: '💳 Cuentas por Cobrar', action: '/cuentas-cobrar' },
    { label: '📄 Cuentas por Pagar', action: '/cuentas-pagar' },
    { label: '💵 Gastos Operativos', action: '/gastos' },
    { label: '❓ ¿Qué puedes hacer?', action: 'que_haces' },
  ],
  encargado_compras: [
    { label: '🛒 Orden de Compra', action: '/ordenes-compra' },
    { label: '🚚 Proveedores', action: '/proveedores' },
    { label: '📄 Cuentas por Pagar', action: '/cuentas-pagar' },
    { label: '❓ ¿Qué puedes hacer?', action: 'que_haces' },
  ],
  vendedor: [
    { label: '👥 Clientes', action: '/clientes' },
    { label: '📦 Existencias', action: '/existencias' },
    { label: '🧾 Facturación', action: '/facturas' },
    { label: '❓ ¿Qué puedes hacer?', action: 'que_haces' },
  ],
  despachador: [
    { label: '🚚 Rutas y Entregas', action: '/despachos' },
    { label: '❓ ¿Qué puedes hacer?', action: 'que_haces' },
  ],
  admin: [
    { label: '👥 Usuarios & Roles', action: '/usuarios' },
    { label: '⚙️ Configuración DTE', action: '/configuracion-dte' },
    { label: '📊 Dashboard', action: '/' },
    { label: '❓ ¿Qué puedes hacer?', action: 'que_haces' },
  ],
};

export default function AvatarWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasMic, setHasMic] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastInstruction, setLastInstruction] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const role = (localStorage.getItem('rol') || 'admin').toLowerCase();
  const currentPath = location.pathname.endsWith('/') && location.pathname !== '/' ? location.pathname.slice(0, -1) : location.pathname;

  // 1. Diagnóstico de Hardware (Micrófono y Parlantes)
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const micFound = devices.some((d) => d.kind === 'audioinput');
        setHasMic(micFound);
      }).catch(() => setHasMic(false));
    }
  }, []);

  // 2. Función Text-to-Speech (Hablar)
  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Inicializar saludo (UN SOLO SALUDO POR SESIÓN - Cero saludos al cambiar de página)
  const initGreeting = (force = false) => {
    const sessionGreeted = sessionStorage.getItem('avatar_session_greeted') === 'true';

    // Si ya saludó en la sesión activa y no es un reset explícito ("Iniciar desde 0"), OMITIR EL SALUDO
    if (sessionGreeted && !force) {
      return;
    }

    sessionStorage.setItem('avatar_session_greeted', 'true');

    const isFirstTime = localStorage.getItem('avatar_facturacion_greeted') !== 'true';
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? 'Buenos días' : (hour < 18 ? 'Buenas tardes' : 'Buenas noches');

    const modInfo = MODULOS_KNOWLEDGE[currentPath] || MODULOS_KNOWLEDGE["/dashboard"];
    const roleUpper = role.toUpperCase();

    const initialText = `¡${greetingTime}! Soy tu Avatar Asistente. Tu perfil es **${roleUpper}**.\nTe encuentras en **${modInfo.titulo}**.\n\nPresiona **'🧭 Guíame en esta página'** si deseas ver el paso a paso de este módulo.`;

    const greetingMsg = {
      sender: 'bot',
      text: initialText,
      isOffTopic: false
    };

    setMessages((prev) => {
      const exists = prev.some((m) => m.text === initialText);
      if (exists) return prev;
      return [...prev, greetingMsg];
    });

    setLastInstruction(initialText);
    if (!isMuted && !sessionGreeted) speakText(initialText);

    if (isFirstTime) {
      localStorage.setItem('avatar_facturacion_greeted', 'true');
      setTimeout(() => {
        const tipMsg = {
          sender: 'bot',
          text: 'Te recomiendo revisar primero la Configuración DTE para validar tu certificado de Hacienda.',
          options: [
            { label: 'Ir a Configuración DTE', action: 'navigate:config-dte' }
          ],
          isOffTopic: false
        };
        setMessages((prev) => [...prev, tipMsg]);
        setLastInstruction(tipMsg.text);
        if (!isMuted) speakText(tipMsg.text);
      }, 5000);
    }
  };

  // Solo saludar al cargar por primera vez la sesión en el navegador
  useEffect(() => {
    initGreeting();
  }, []);

  // 4. Escuchar eventos globales 'avatar:say' emitidos por la app
  useEffect(() => {
    const handleAvatarSay = (e) => {
      const { text, options } = e.detail || {};
      if (text) {
        const botMsg = {
          sender: 'bot',
          text,
          options: options || [],
          isOffTopic: false
        };
        setMessages((prev) => [...prev, botMsg]);
        setLastInstruction(text);
        if (!isMuted) speakText(text);

        if (!isOpen) {
          setUnreadCount((count) => count + 1);
        }
      }
    };

    window.addEventListener('avatar:say', handleAvatarSay);
    return () => window.removeEventListener('avatar:say', handleAvatarSay);
  }, [isMuted, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // 5. Guía Paso a Paso de la Página Actual
  const handleGuiamePagina = () => {
    const modInfo = MODULOS_KNOWLEDGE[currentPath] || MODULOS_KNOWLEDGE["/dashboard"];
    const guideText = `🧭 **Guía Paso a Paso: ${modInfo.titulo}**\n\n${modInfo.guia}\n\n💡 **Pregunta Frecuente:** ${modInfo.faqs}`;
    
    const botMsg = {
      sender: 'bot',
      text: guideText,
      isOffTopic: false
    };

    setMessages((prev) => [...prev, botMsg]);
    setLastInstruction(guideText);
    speakText(guideText);
  };

  // 6. Mute Total
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // 7. Iniciar desde 0 (Limpia marcas de sesión y saluda de nuevo)
  const handleResetSession = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    sessionStorage.removeItem('avatar_session_greeted');
    setMessages([]);
    initGreeting(true);
  };

  // 8. Repetir últimas instrucciones
  const handleRepeatLast = () => {
    if (lastInstruction) {
      speakText(lastInstruction);
    }
  };

  // 9. Speech-to-Text
  const handleToggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta el reconocimiento de voz nativo.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // 10. Motor Inteligente Resiliente Client-Side
  const processQueryClientSide = (query, currentRole) => {
    const msgLower = (query || '').toLowerCase().trim();
    const r = (currentRole || 'admin').toLowerCase();

    const ERP_KEYWORDS = [
      "factura", "dte", "caja", "turno", "cobro", "pago", "cliente", "proveedor", "bodega",
      "kardex", "existencia", "producto", "stock", "gasto", "orden", "compra",
      "cuenta", "cobrar", "pagar", "usuario", "rol", "sistema", "empresa",
      "hacienda", "emisión", "despacho", "ruta", "inventario", "cierre", "apertura",
      "financiamiento", "préstamo", "aporte", "impuesto", "nit", "nrc", "iva",
      "ayuda", "hola", "buenos dias", "buenas tardes", "buenas noches", "gracias",
      "opciones", "manual", "configuración", "certificación", "token", "sucursal",
      "inicio", "dashboard", "sesión", "turno", "arqueo", "guia", "como", "usar", "que haces", "sirves", "funciones",
      "mario", "janeth", "abrazando"
    ];

    if (msgLower.includes("mario") || msgLower.includes("janeth") || msgLower.includes("abrazando")) {
      return {
        text: "Hola Mario, hoy no andas abrazando a nadie, mejor tráeme a la Janeth 😄"
      };
    }

    const isErpQuery = ERP_KEYWORDS.some(kw => msgLower.includes(kw)) || msgLower.split(' ').length <= 3;

    if (!isErpQuery) {
      return {
        text: "Soy tu asistente virtual especializado exclusivamente en el sistema de Facturación e Inventarios. Para consultas o soporte en temas externos a la plataforma, disponemos de un servicio de asistencia extendida con costo adicional. ¿En qué puedo ayudarte respecto a tus operaciones de ventas, compras o inventario hoy?",
        isOffTopic: true
      };
    }

    if (msgLower.includes("qué puedes hacer") || msgLower.includes("que puedes hacer") || msgLower.includes("qué haces") || msgLower.includes("que haces") || msgLower.includes("funciones") || msgLower.includes("sirves")) {
      return {
        text: "🤖 **Funciones de tu Avatar Asistente:**\n\n" +
              "🧭 **Guía por Página**: Te explico paso a paso cómo operar cada uno de los 16 módulos del ERP mediante el botón 'Guíame en esta página'.\n" +
              "🎙️ **Voz Bidireccional**: Escucho tus consultas por micrófono y respondo en voz alta en español.\n" +
              "🔒 **Perfiles por Rol**: Adapto respuestas y atajos a tu rol (Admin, Cajera, Bodeguero, Contador, etc.).\n" +
              "🔇 **Controles de Audio**: Dispones de 'Silencio Total' (Mute), 'Repetir Instrucción' e 'Iniciar desde 0'.\n" +
              "🧾 **Soporte ERP**: Te guío en Facturación DTE, Cajas, Inyección de Capital, Kardex, Existencias, Gastos y Usuarios.\n" +
              "💡 **Enfoque ERP**: Atiendo consultas del sistema (asistencia externa aplica costo adicional)."
      };
    }

    if (msgLower.includes("guia") || msgLower.includes("cómo usar") || msgLower.includes("esta página") || msgLower.includes("esta pantalla")) {
      const modInfo = MODULOS_KNOWLEDGE[currentPath] || MODULOS_KNOWLEDGE["/dashboard"];
      return {
        text: `🧭 **Guía de Uso: ${modInfo.titulo}**\n\n${modInfo.guia}\n\n💡 **Frecuentes:** ${modInfo.faqs}`
      };
    }

    if (msgLower.includes("caja") || msgLower.includes("turno")) {
      const info = MODULOS_KNOWLEDGE["/cajas"];
      return { text: `💼 **Control de Caja:** ${info.guia}`, redirectUrl: "/cajas" };
    }

    if (msgLower.includes("factura") || msgLower.includes("dte")) {
      const info = MODULOS_KNOWLEDGE["/facturas"];
      return { text: `🧾 **Facturación DTE:** ${info.guia}`, redirectUrl: "/facturas" };
    }

    if (msgLower.includes("bodega") || msgLower.includes("kardex") || msgLower.includes("stock") || msgLower.includes("existencia")) {
      const info = MODULOS_KNOWLEDGE["/existencias"];
      return { text: `📦 **Inventarios:** ${info.guia}`, redirectUrl: "/existencias" };
    }

    if (msgLower.includes("usuario") || msgLower.includes("rol") || msgLower.includes("permiso")) {
      const info = MODULOS_KNOWLEDGE["/usuarios"];
      return { text: `👥 **Usuarios y Roles:** ${info.guia}`, redirectUrl: "/usuarios" };
    }

    if (msgLower.includes("gasto")) {
      const info = MODULOS_KNOWLEDGE["/gastos"];
      return { text: `💸 **Gastos Operativos:** ${info.guia}`, redirectUrl: "/gastos" };
    }

    if (msgLower.includes("compra") || msgLower.includes("proveedor")) {
      const info = MODULOS_KNOWLEDGE["/ordenes-compra"];
      return { text: `🛒 **Compras:** ${info.guia}`, redirectUrl: "/ordenes-compra" };
    }

    if (msgLower.includes("hola") || msgLower.includes("buenos dias") || msgLower.includes("buenas tardes") || msgLower.includes("buenas noches")) {
      const modInfo = MODULOS_KNOWLEDGE[currentPath] || MODULOS_KNOWLEDGE["/dashboard"];
      return {
        text: `¡Hola! Soy tu Avatar Asistente. Tu perfil activo es **${r.toUpperCase()}**.\nActualmente te encuentras en **${modInfo.titulo}**.`
      };
    }

    const modInfo = MODULOS_KNOWLEDGE[currentPath] || MODULOS_KNOWLEDGE["/dashboard"];
    return {
      text: `Te encuentras en **${modInfo.titulo}**.\n\n${modInfo.guia}`
    };
  };

  // 11. Enviar consulta a la IA (Gemini Backend con Fallback Inteligente)
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    if (query === 'que_haces') {
      const fallback = processQueryClientSide('qué puedes hacer', role);
      const botMsg = { sender: 'bot', text: fallback.text, isOffTopic: false };
      setMessages((prev) => [...prev, botMsg]);
      setLastInstruction(fallback.text);
      speakText(fallback.text);
      return;
    }

    if (query === 'mario_janeth') {
      const phrase = "Hola Mario, hoy no andas abrazando a nadie, mejor tráeme a la Janeth 😄";
      const botMsg = { sender: 'bot', text: phrase, isOffTopic: false };
      setMessages((prev) => [...prev, botMsg]);
      setLastInstruction(phrase);
      speakText(phrase);
      return;
    }

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/api/v1/avatar/chat', {
        message: query,
        rol: role,
        modulo: currentPath
      });

      const botReply = res.data.response || 'De acuerdo, continuemos.';
      const isOffTopic = res.data.is_off_topic || false;

      const botMsg = {
        sender: 'bot',
        text: botReply,
        isOffTopic: isOffTopic,
        redirectUrl: res.data.redirect_url
      };

      setMessages((prev) => [...prev, botMsg]);
      setLastInstruction(botReply);
      speakText(botReply);
    } catch (err) {
      console.warn('Network or API fallback triggered:', err);
      const fallback = processQueryClientSide(query, role);
      const botMsg = {
        sender: 'bot',
        text: fallback.text,
        isOffTopic: fallback.isOffTopic || false,
        redirectUrl: fallback.redirectUrl
      };
      setMessages((prev) => [...prev, botMsg]);
      setLastInstruction(fallback.text);
      speakText(fallback.text);
    } finally {
      setLoading(false);
    }
  };

  const shortcuts = ROLE_SHORTCUTS[role] || ROLE_SHORTCUTS.admin;
  const currentModInfo = MODULOS_KNOWLEDGE[currentPath] || MODULOS_KNOWLEDGE["/dashboard"];

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Botón Flotante del Avatar */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-105 border-2 border-indigo-400 group relative"
          title="Abrir Avatar Asistente IA"
        >
          <div className="relative">
            <Bot className="w-7 h-7 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600" />
          </div>
          <span className="font-bold text-sm pr-1 hidden sm:inline">Avatar IA ({role.toUpperCase()})</span>

          {unreadCount > 0 && (
            <span className="absolute -top-2 -left-2 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Ventana del Avatar */}
      {isOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[92vw] sm:w-[420px] max-h-[640px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Bot className="w-6 h-6 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  Avatar Asistente <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </h3>
                <p className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">
                  ROL: {role} • {currentModInfo.titulo.split(' ')[1] || 'General'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Controles y Diagnóstico */}
          <div className="bg-slate-800 text-slate-300 px-3 py-2 text-xs flex items-center justify-between gap-2 border-b border-slate-700">
            <div className="flex items-center gap-2 text-[11px]">
              {hasMic ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1" title="Micrófono activo">
                  <Mic className="w-3.5 h-3.5" /> Mic ON
                </span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1" title="Sin micrófono">
                  <MicOff className="w-3.5 h-3.5" /> Sin Mic
                </span>
              )}
              <span>•</span>
              {isMuted ? (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <VolumeX className="w-3.5 h-3.5" /> Muteado
                </span>
              ) : (
                <span className="text-indigo-300 font-medium flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Audio ON
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleMute}
                className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${isMuted ? 'text-amber-400' : 'text-slate-300'}`}
                title={isMuted ? 'Activar Voz (Unmute)' : 'Silencio Total (Mute)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRepeatLast}
                className="p-1.5 rounded text-slate-300 hover:bg-slate-700 transition-colors"
                title="Repetir Última Instrucción"
              >
                <Repeat className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetSession}
                className="p-1.5 rounded text-slate-300 hover:bg-slate-700 transition-colors"
                title="Iniciar desde 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botón de Guía interactiva de esta página */}
          <div className="bg-indigo-50 border-b border-indigo-100 p-2 flex justify-between items-center px-3">
            <span className="text-[11px] text-indigo-900 font-semibold truncate">
              📍 Módulo actual: {currentModInfo.titulo}
            </span>
            <button
              onClick={handleGuiamePagina}
              className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1 shrink-0"
            >
              <Compass className="w-3.5 h-3.5" /> Guíame en esta página
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 min-h-[220px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : m.isOffTopic
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.isOffTopic && (
                    <div className="flex items-center gap-1 text-amber-700 font-bold mb-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" /> Asistencia Extendida (Costo Adicional)
                    </div>
                  )}
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Opciones interactivas */}
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                      {m.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => {
                            if (opt.action) {
                              if (opt.action === 'navigate:config-dte' || opt.action === '/configuracion-dte') {
                                navigate('/configuracion-dte');
                              } else if (opt.action.startsWith('navigate:')) {
                                navigate('/' + opt.action.replace('navigate:', ''));
                              } else {
                                navigate(opt.action);
                              }
                            }
                          }}
                          className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                        >
                          {opt.label} <ExternalLink className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  {m.redirectUrl && (
                    <button
                      onClick={() => navigate(m.redirectUrl)}
                      className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100"
                    >
                      Ir al módulo <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white p-2.5 rounded-xl border border-slate-200 w-fit">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Analizando módulo...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Atajos Rápidos por Rol */}
          <div className="p-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1">
            {shortcuts.map((sc, i) => (
              <button
                key={i}
                onClick={() => {
                  if (sc.action === 'que_haces') {
                    handleSendMessage('que_haces');
                  } else {
                    navigate(sc.action);
                  }
                }}
                className="text-[10px] font-semibold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors"
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Input e Interacción de Voz */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-bounce shadow-md shadow-rose-600/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title={isListening ? 'Escuchando... presiona para detener' : 'Presiona para hablar (Micrófono)'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? 'Escuchando tu voz...' : `Consulta sobre ${currentModInfo.titulo.split(' ')[1] || 'este módulo'}...`}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
