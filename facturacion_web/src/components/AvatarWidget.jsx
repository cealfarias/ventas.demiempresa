import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, MicOff, Volume2, VolumeX, RotateCcw, Repeat, 
  Send, Sparkles, X, ChevronUp, AlertCircle, ExternalLink, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ROLE_SHORTCUTS = {
  cajera: [
    { label: '💼 Aperturar Turno de Caja', action: '/cajas' },
    { label: '🧾 Emitir Factura DTE', action: '/facturas' },
    { label: '📈 Inyectar Capital', action: '/cajas' },
  ],
  bodeguero: [
    { label: '📦 Consultar Existencias', action: '/existencias' },
    { label: '📋 Libro Kardex', action: '/kardex' },
    { label: '📥 Órdenes de Compra', action: '/ordenes-compra' },
  ],
  contador: [
    { label: '💳 Cuentas por Cobrar', action: '/cuentas-cobrar' },
    { label: '📄 Cuentas por Pagar', action: '/cuentas-pagar' },
    { label: '💵 Gastos Operativos', action: '/gastos' },
  ],
  encargado_compras: [
    { label: '🛒 Crear Orden de Compra', action: '/ordenes-compra' },
    { label: '🚚 Ver Proveedores', action: '/proveedores' },
    { label: '📄 Cuentas por Pagar', action: '/cuentas-pagar' },
  ],
  vendedor: [
    { label: '👥 Ver Clientes', action: '/clientes' },
    { label: '📦 Ver Existencias', action: '/existencias' },
    { label: '🧾 Cotizaciones DTE', action: '/facturas' },
  ],
  despachador: [
    { label: '🚚 Rutas y Entregas', action: '/despachos' },
  ],
  admin: [
    { label: '👥 Gestionar Usuarios & Roles', action: '/usuarios' },
    { label: '⚙️ Configuración DTE', action: '/configuracion-dte' },
    { label: '📊 Dashboard General', action: '/' },
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
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const role = (localStorage.getItem('rol') || 'admin').toLowerCase();

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
      window.speechSynthesis.cancel(); // Cancelar lo anterior
      const cleanText = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Inicializar mensaje de bienvenida según tiempo y rol
  const initGreeting = () => {
    const isFirstTime = localStorage.getItem('avatar_facturacion_greeted') !== 'true';
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? 'Buenos días' : (hour < 18 ? 'Buenas tardes' : 'Buenas noches');

    const roleUpper = role.toUpperCase();
    const initialText = `¡${greetingTime}! Soy tu Avatar Asistente. Tu perfil autenticado es **${roleUpper}**. Estoy aquí para orientarte en tus actividades del ERP.`;

    const greetingMsg = {
      sender: 'bot',
      text: initialText,
      isOffTopic: false
    };

    setMessages([greetingMsg]);
    setLastInstruction(initialText);
    if (!isMuted) speakText(initialText);

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

  useEffect(() => {
    initGreeting();
  }, [role]);

  // 4. Escuchar eventos globales 'avatar:say' emitidos por cualquier vista
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

  // 5. Mute Total (Silencio Total)
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // 6. Iniciar desde 0
  const handleResetSession = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    initGreeting();
  };

  // 7. Repetir últimas instrucciones
  const handleRepeatLast = () => {
    if (lastInstruction) {
      speakText(lastInstruction);
    }
  };

  // 8. Speech-to-Text (Escuchar micrófono)
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

  // 9. Enviar consulta a la IA (Gemini Backend)
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/api/v1/avatar/chat', {
        message: query,
        rol: role,
        modulo: window.location.pathname
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
      console.error(err);
      const errMsg = { sender: 'bot', text: 'Ocurrió un inconveniente al consultar con el asistente.', isOffTopic: false };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const shortcuts = ROLE_SHORTCUTS[role] || ROLE_SHORTCUTS.admin;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Botón Flotante del Avatar Unificado */}
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

      {/* Ventana del Avatar Unificado */}
      {isOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[92vw] sm:w-[420px] max-h-[620px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
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
                  ROL ACTIVO: {role}
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

          {/* Barra de Diagnóstico de Hardware y Controles */}
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
                <span>Pensando respuesta...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Atajos Rápidos por Rol */}
          <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1.5">
            {shortcuts.map((sc, i) => (
              <button
                key={i}
                onClick={() => navigate(sc.action)}
                className="text-[11px] font-semibold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
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
              placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe tu duda del ERP...'}
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
