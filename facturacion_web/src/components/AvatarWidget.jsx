import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, Mic, MicOff, Volume2, VolumeX, RotateCcw, Repeat, 
  Send, Sparkles, X, ChevronUp, AlertCircle, ExternalLink, Compass, HelpCircle,
  Move, GripVertical
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
    titulo: "💼 Control de Caja, Turnos y Movimientos",
    guia: "1. Presiona 'Aperturar Turno' con el saldo inicial.\n2. Toda venta, cobro CxC, pago CxP o gasto en efectivo afectará tu caja activa.\n3. Para inyectar liquidez sin inflar ventas, usa 'Inyectar Capital'.\n4. Al finalizar la jornada, realiza el conteo de billetes/monedas y ejecuta el Cierre de Caja.",
    faqs: "P: ¿Qué hago si dice 'Caja Cerrada'?\nR: Presiona el botón '[Abrir]' en el encabezado o en esta pantalla."
  },
  "/clientes": {
    titulo: "👥 Gestión de Clientes",
    guia: "1. Haz clic en 'Nuevo Cliente'.\n2. Completa NIT/NRC/DUI, Nombre y Teléfono.\n3. Define el límite de crédito si aplican ventas a plazo.",
    faqs: "P: ¿Quién es el cliente predeterminado?\nR: El cliente de venta rápida a consumidor final."
  },
  "/cuentas-cobrar": {
    titulo: "💳 Cuentas por Cobrar (CxC)",
    guia: "1. Revisa los saldos pendientes agrupados por cliente.\n2. Presiona 'Registrar Cobro' para abonar o liquidar.\n3. Si cobras en efectivo, el monto incrementará tu caja activa automáticamente.",
    faqs: "P: ¿Puedo imprimir el estado de cuenta?\nR: Sí, haz clic en 'Imprimir Estado de Cuenta' en la ficha del cliente."
  },
  "/gastos": {
    titulo: "💸 Gastos Operativos (Caja Chica / Banco)",
    guia: "1. Selecciona la categoría del gasto (Servicios, Mantenimiento, Viáticos, etc.).\n2. Ingresa monto y concepto.\n3. Selecciona si sale de 'Efectivo de Caja' (requiere caja abierta) o 'Transferencia Bancaria'.",
    faqs: "P: ¿Puedo crear categorías nuevas?\nR: Sí, presiona el botón '+' al lado de la categoría."
  },
  "/proveedores": {
    titulo: "🚚 Gestión de Proveedores",
    guia: "1. Registra distribuidores y casas comerciales.\n2. Ingresa su NIT/NRC para sustentar Crédito Fiscal en compras.",
    faqs: "P: ¿Es necesario para órdenes de compra?\nR: Sí, las órdenes requieren seleccionar un proveedor."
  },
  "/ordenes-compra": {
    titulo: "🛒 Órdenes de Compra & Recepción",
    guia: "1. Crea la orden especificando proveedor e ítems.\n2. Al recibir los productos, marca el estado como 'Recibida'.\n3. El stock ingresará a la bodega y recalculará el costo promedio en Kardex.",
    faqs: "P: ¿Qué pasa si es compra al contado en efectivo?\nR: Al recibir, desmarca 'Crear Cuenta por Pagar' y descontará de la caja activa."
  },
  "/cuentas-pagar": {
    titulo: "📄 Cuentas por Pagar (CxP)",
    guia: "1. Consulta las obligaciones financieras con proveedores.\n2. Presiona 'Registrar Pago' para abonos parciales o totales.\n3. Selecciona si el pago sale de caja en efectivo o banco.",
    faqs: "P: ¿Genera egreso de caja?\nR: Sí, si eliges pago en Efectivo de Caja."
  },
  "/bodegas": {
    titulo: "🏬 Administración de Bodegas",
    guia: "1. Registra las sucursales o almacenes de la empresa.\n2. Define la bodega 'Predeterminada' para venta rápida.",
    faqs: "P: ¿Puedo tener varias bodegas?\nR: Sí, ilimitadas bodegas por empresa."
  },
  "/existencias": {
    titulo: "📦 Existencias en Tiempo Real",
    guia: "1. Consulta las unidades almacenadas por cada bodega.\n2. Filtra productos con alerta de stock mínimo en rojo.",
    faqs: "P: ¿Cómo veo el valor del inventario?\nR: Multiplica las unidades físicas por su costo promedio ponderado."
  },
  "/kardex": {
    titulo: "📋 Libro Kardex (Trazabilidad Físico-Valorada)",
    guia: "1. Selecciona un producto para auditar su historial completo.\n2. Analiza las Entradas (compras), Salidas (ventas) y el saldo con su Costo Promedio Ponderado.",
    faqs: "P: ¿Cumple normativa fiscal?\nR: Sí, 100% conforme al Código de Comercio y NIIF para Pymes."
  },
  "/productos": {
    titulo: "📦 Catálogo de Productos y Servicios",
    guia: "1. Crea ítems ingresando Código, Nombre, Precio de Venta y Costo Inicial.\n2. Define si es 'Producto Físico' o 'Servicio'.\n3. Asigna imagen URL opcional para el POS.",
    faqs: "P: ¿Un servicio maneja stock?\nR: No, los servicios no descuentan unidades físicas."
  },
  "/despachos": {
    titulo: "🚚 Rutas y Entregas (Logística)",
    guia: "1. Agrupa facturas emitidas por ruta de entrega y asigna un repartidor.\n2. Actualiza los estados: Pendiente -> En Ruta -> Entregado.",
    faqs: "P: ¿Se genera Guía DTE?\nR: Sí, se enlaza al documento de transporte de Hacienda."
  },
  "/vendedores": {
    titulo: "👤 Vendedores y Comisiones",
    guia: "1. Administra tu fuerza de ventas.\n2. Define porcentajes de comisión por vendedor.",
    faqs: "P: ¿Dónde se asigna?\nR: Al emitir la factura en el módulo de ventas."
  },
  "/configuracion-dte": {
    titulo: "⚙️ Configuración DTE (Hacienda El Salvador)",
    guia: "1. Carga tu archivo de certificado digital `.p12` y contraseña.\n2. Ingresa la clave API otorgada por el Ministerio de Hacienda.\n3. Selecciona el Entorno (Pruebas / Producción) y prueba la firma.",
    faqs: "P: ¿Qué hago si da error de firma?\nR: Revisa que la clave del .p12 y la clave API de Hacienda sean idénticas a las del portal MH."
  },
  "/usuarios": {
    titulo: "👥 Gestión de Usuarios y Roles (RBAC)",
    guia: "1. Registra colaboradores con username, correo y contraseña.\n2. Asigna uno de los roles (Admin, Cajera, Bodeguero, Contador, etc.).\n3. Controla estado activo/inactivo.",
    faqs: "P: ¿Quién puede crear usuarios?\nR: Exclusivamente el perfil Administrador."
  },
  "/acreedores": {
    titulo: "🏦 Acreedores y Préstamos",
    guia: "1. Registra instituciones bancarias o financistas.\n2. Ingresa préstamos asignando monto, interés y plazo.",
    faqs: "P: ¿Genera tabla de cuotas?\nR: Sí, calcula amortizaciones de capital e interés."
  },
  "/pago-prestamos": {
    titulo: "🧮 Pago de Préstamos",
    guia: "1. Selecciona la cuota del préstamo a saldar.\n2. Elige pago en Efectivo de Caja o Banco.\n3. Registra el abono para descontar el pasivo.",
    faqs: "P: ¿Afecta caja?\nR: Sí, si seleccionas pago en Efectivo."
  },
  "/aportantes": {
    titulo: "👥 Aportantes de Capital",
    guia: "1. Registra socios inversionistas.\n2. Documenta aportes de capital sin interés o retiros de socios.",
    faqs: "P: ¿Se refleja en finanzas?\nR: Sí, como patrimonio/efectivo."
  },
  "/arrendamientos": {
    titulo: "🏢 Contratos de Arrendamiento",
    guia: "1. Registra inmuebles o locales comerciales.\n2. Controla cobros a inquilinos o pagos a propietarios.\n3. Emite comprobantes y comparte por WhatsApp.",
    faqs: "P: ¿Registra movimiento en caja?\nR: Sí, al seleccionar método Efectivo se integra con la sesión de caja activa."
  },
  "/backup-recovery": {
    titulo: "🛡️ Copia de Seguridad y Restauración (HMAC-SHA256)",
    guia: "1. **Exportar:** Presiona 'Exportar Backup' para descargar un respaldo firmado digitalmente.\n2. **Restaurar:** Sube el archivo `.json` de respaldo para verificar su firma criptográfica y restaurar los datos.",
    faqs: "P: ¿Qué pasa si altero el archivo?\nR: La verificación HMAC fallará y la app protegerá los datos evitando la carga."
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
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('avatar_voice_muted') === 'true';
  });
  const [hasMic, setHasMic] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('avatar_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [playingMsgIdx, setPlayingMsgIdx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastInstruction, setLastInstruction] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const role = (localStorage.getItem('rol') || 'admin').toLowerCase();
  const currentPath = location.pathname.endsWith('/') && location.pathname !== '/' ? location.pathname.slice(0, -1) : location.pathname;

  // Estado de Posición Arrastrable (Draggable - Mouse y Tap/Touch)
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('avatar_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    // Posición inicial por defecto: abajo a la derecha
    return {
      x: Math.max(10, window.innerWidth - 240),
      y: Math.max(10, window.innerHeight - 90)
    };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false });
  const containerRef = useRef(null);

  const handlePointerDown = (e) => {
    // Cuando la ventana está abierta (maximizada), filtrar botones internos que no sean de arrastre
    if (isOpen) {
      if (e.target.closest('input') || e.target.closest('textarea')) return;
      if (e.target.closest('button') && !e.target.closest('.drag-handle-btn')) return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: pos.x,
      initialY: pos.y,
      hasMoved: false
    };
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragStartRef.current.startX;
      const dy = clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStartRef.current.hasMoved = true;
      }

      const widgetWidth = isOpen ? 430 : 220;
      const maxX = Math.max(10, window.innerWidth - Math.min(window.innerWidth * 0.92, widgetWidth) - 10);
      const maxY = Math.max(10, window.innerHeight - (isOpen ? 640 : 70));

      const newX = Math.max(10, Math.min(maxX, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(maxY, dragStartRef.current.initialY + dy));

      setPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setPos(currentPos => {
          try {
            localStorage.setItem('avatar_pos', JSON.stringify(currentPos));
          } catch (e) {}
          return currentPos;
        });
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isOpen]);

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
      setIsOpen(true);
      setTimeout(() => {
        const onboardingText = `🎉 **¡Bienvenido a tu nuevo Espacio Empresarial!**\nSoy tu **Avatar Asistente IA** y te guiaré paso a paso para poner a punto tu negocio.\n\n**Pasos iniciales recomendados:**\n\n1️⃣ **Configuración DTE**: Completa tu razón social, NIT/NRC y tu certificado para emitir en Hacienda.\n2️⃣ **Crear Bodega**: Define la bodega o sucursal desde donde administrarás tu stock.\n3️⃣ **Cargar Productos e Inventarios** (2 opciones):\n   • *Opción A (Manual)*: Crea **Productos Físicos** (descuentan existencias de bodega) o **Servicios** (facturan libremente sin afectar existencias).\n   • *Opción B (Automática por JSON/DTE)*: Al procesar la compra de tus proveedores en **Orden de Compra**, el sistema crea automáticamente los productos nuevos e incrementa el stock en bodega con su costo promedio.\n4️⃣ **Apertura de Caja**: Abre tu primer turno de caja para comenzar a facturar y cobrar.`;

        const onboardingMsg = {
          sender: 'bot',
          text: onboardingText,
          options: [
            { label: '1. Configuración DTE ⚙️', action: '/configuracion-dte' },
            { label: '2. Crear Bodega 📦', action: '/bodegas' },
            { label: '3. Registrar Productos 🏷️', action: '/productos' },
            { label: '4. Control de Caja 💰', action: '/cajas' }
          ],
          isOffTopic: false
        };

        setMessages((prev) => [...prev, onboardingMsg]);
        setLastInstruction(onboardingText);
        if (!isMuted) speakText("¡Bienvenido a tu nuevo espacio empresarial! Te he preparado la guía con los primeros cuatro pasos esenciales para comenzar a operar.");
      }, 1200);
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

    // Guardar mensajes en la sesión del navegador para poder retomarlos al cambiar de módulo
    try {
      if (messages.length > 0) {
        sessionStorage.setItem('avatar_chat_messages', JSON.stringify(messages));
      }
    } catch (e) {
      console.error("Error guardando mensajes de avatar:", e);
    }
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
    localStorage.setItem('avatar_voice_muted', newMuted ? 'true' : 'false');
    if (newMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // 7. Iniciar desde 0 (Limpia marcas de sesión y saluda de nuevo)
  const handleResetSession = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    sessionStorage.removeItem('avatar_session_greeted');
    sessionStorage.removeItem('avatar_chat_messages');
    setMessages([]);
    setPlayingMsgIdx(null);
    initGreeting(true);
  };

  // 7b. Reproducir por voz cualquier mensaje específico del historial
  const handlePlayMessageAudio = (text, idx) => {
    if (!('speechSynthesis' in window)) return;

    if (playingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setPlayingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~>|-]/g, ' ').replace(/\s+/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;

    utterance.onend = () => setPlayingMsgIdx(null);
    utterance.onerror = () => setPlayingMsgIdx(null);

    setPlayingMsgIdx(idx);
    window.speechSynthesis.speak(utterance);
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
      "inicio", "dashboard", "sesión", "turno", "arqueo", "guia", "como", "usar", "que haces", "sirves", "funciones"
    ];

    const isErpQuery = ERP_KEYWORDS.some(kw => msgLower.includes(kw)) || msgLower.split(' ').length <= 3;

    if (!isErpQuery) {
      return {
        text: "Soy tu asistente virtual especializado exclusivamente en el sistema de Facturación e Inventarios. Para consultas o soporte en temas externos a la plataforma, disponemos de un servicio de asistencia extendida con costo adicional. ¿En qué puedo ayudarte respecto a tus operaciones de ventas, compras o inventario hoy?",
        isOffTopic: true
      };
    }

    if (msgLower.includes("primeros pasos") || msgLower.includes("por donde empiezo") || msgLower.includes("por dónde empiezo") || msgLower.includes("que hago primero") || msgLower.includes("qué hago primero") || msgLower.includes("nuevo usuario") || msgLower.includes("primer ingreso") || msgLower.includes("configurar desde cero") || msgLower.includes("como empiezo") || msgLower.includes("primeros")) {
      return {
        text: "🚀 **Pasos Iniciales Recomendados para una Nueva Empresa / Usuario:**\n\n" +
              "1️⃣ **Configuración DTE**: Completa la Razón Social, NIT/NRC y tu certificado del Ministerio de Hacienda.\n" +
              "2️⃣ **Crear Bodega**: Define tu primera bodega o tienda principal para gestionar tu inventario.\n" +
              "3️⃣ **Registrar Productos**: Agrega tus productos o servicios con precios de venta.\n" +
              "4️⃣ **Apertura de Caja**: Abre tu primer turno de caja para comenzar a facturar.",
        options: [
          { label: '1. Configuración DTE ⚙️', action: '/configuracion-dte' },
          { label: '2. Crear Bodega 📦', action: '/bodegas' },
          { label: '3. Registrar Productos 🏷️', action: '/productos' },
          { label: '4. Control de Caja 💰', action: '/cajas' }
        ]
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

  const shortcuts = [
    { label: '🧾 Facturación DTE', action: '/facturas' },
    { label: '🛒 Compras', action: '/ordenes-compra' },
    ...(ROLE_SHORTCUTS[role] || ROLE_SHORTCUTS.admin)
  ];
  const currentModInfo = MODULOS_KNOWLEDGE[currentPath] || MODULOS_KNOWLEDGE["/dashboard"];

  const SUGGESTED_QUESTIONS = [
    "¿Cómo hago facturas?",
    "¿Cómo hago una compra?",
    "¿Cómo abro la caja?",
    "¿Cómo hago un cobro?",
    "¿Cómo registro un gasto?"
  ];

  const currentWidth = isOpen ? Math.min(window.innerWidth * 0.92, 430) : 220;
  const currentHeight = isOpen ? Math.min(window.innerHeight * 0.9, 660) : 60;

  const safeX = Math.max(10, Math.min(pos.x, window.innerWidth - currentWidth - 10));
  const safeY = Math.max(10, Math.min(pos.y, window.innerHeight - currentHeight - 10));

  const handleOrbClick = (e) => {
    if (dragStartRef.current.hasMoved) {
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${safeX}px`,
        top: `${safeY}px`,
        zIndex: 9999
      }}
      className="font-sans select-none"
    >
      {/* Botón Flotante Estilo Orb Animado del Avatar */}
      {!isOpen && (
        <button
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onClick={handleOrbClick}
          className="relative group flex items-center gap-2.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-2.5 pr-4 rounded-full shadow-2xl border-2 border-indigo-400 hover:border-indigo-300 transition-all hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing"
          title="Mantén presionado para arrastrar • Haz clic o tap para abrir Avatar IA"
        >
          {/* Esfera Brillante / Glowing Orb */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-500/50 overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-indigo-500/30 animate-ping rounded-full" />
            <Bot className="w-6 h-6 text-white relative z-10 animate-bounce" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-900 z-20" />
          </div>

          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1">
              Avatar IA <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
            </span>
            <span className="text-[10px] text-slate-300 font-semibold tracking-tight flex items-center gap-1">
              <Move className="w-2.5 h-2.5 text-indigo-300" /> Arrástrame o pregunta
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="absolute -top-2 -left-2 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md animate-bounce border border-white/40">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Ventana Principal del Avatar */}
      {isOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[92vw] sm:w-[430px] max-h-[660px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header con Esfera Orb */}
          <div
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            className="bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-900 text-white p-3.5 flex items-center justify-between border-b border-indigo-800 cursor-grab active:cursor-grabbing"
            title="Mantén presionado el encabezado para mover la ventana"
          >
            <div className="flex items-center gap-2.5">
              <GripVertical className="w-4 h-4 text-indigo-400/80 shrink-0" />
              {/* Esfera Orb activa en Header */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/50 shrink-0">
                <div className={`absolute inset-0 rounded-full ${loading ? 'bg-amber-400/40 animate-ping' : 'bg-indigo-400/20 animate-pulse'}`} />
                <Bot className="w-5 h-5 text-white relative z-10" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5 text-white">
                  Avatar Asistente <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </h3>
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">
                  ROL: {role} • {currentModInfo.titulo.split(' ')[1] || 'General'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors drag-handle-btn"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Accesos Directos Permanentes y Estado */}
          <div className="bg-slate-900 text-slate-300 px-3 py-2 text-xs flex items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/facturas')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow transition-all hover:scale-105"
              >
                🧾 Facturación DTE
              </button>
              <button
                onClick={() => navigate('/ordenes-compra')}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow transition-all hover:scale-105"
              >
                🛒 Compras
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleMute}
                className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isMuted ? 'text-amber-400' : 'text-slate-300'}`}
                title={isMuted ? 'Activar Voz (Unmute)' : 'Silencio Total (Mute)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRepeatLast}
                className="p-1.5 rounded text-slate-300 hover:bg-slate-800 transition-colors"
                title="Repetir Última Instrucción"
              >
                <Repeat className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetSession}
                className="p-1.5 rounded text-slate-300 hover:bg-slate-800 transition-colors"
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

          {/* Chips Sugeridos de Preguntas "¿Cómo hago...?" */}
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase shrink-0">💡 Pregúntame:</span>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-[10px] font-semibold bg-white hover:bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 whitespace-nowrap shrink-0 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 min-h-[220px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[88%] text-xs leading-relaxed shadow-sm ${
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

                  {/* Reproductor de voz por mensaje */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/60 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handlePlayMessageAudio(m.text, idx)}
                      className={`flex items-center gap-1 font-semibold transition-colors px-1.5 py-0.5 rounded-md ${
                        playingMsgIdx === idx
                          ? 'text-indigo-600 bg-indigo-50 font-bold'
                          : m.sender === 'user'
                          ? 'text-indigo-200 hover:text-white'
                          : 'text-slate-500 hover:text-indigo-600'
                      }`}
                      title={playingMsgIdx === idx ? 'Detener reproducción de voz' : 'Escuchar mensaje por voz'}
                    >
                      <Volume2 className={`w-3 h-3 ${playingMsgIdx === idx ? 'animate-bounce text-indigo-600' : ''}`} />
                      <span>{playingMsgIdx === idx ? 'Reproduciendo...' : 'Reproducir voz'}</span>
                    </button>
                  </div>

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
                <span>Buscando cómo hacer esta operación...</span>
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
              placeholder={isListening ? 'Escuchando tu voz...' : `Escribe: ¿Cómo hago... ?`}
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
