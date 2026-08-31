import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AssistantContext = createContext();

export const useAssistant = () => useContext(AssistantContext);

export const AssistantProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const dismiss = useCallback(() => {
    setIsActive(false);
    setHighlightId(null);
    setOptions(null);
    window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      
      const voices = window.speechSynthesis.getVoices();
      const svVoice = voices.find(v => v.lang === 'es-SV' || v.lang === 'es_SV' || v.name.includes('Salvador'));
      
      if (svVoice) utterance.voice = svVoice;
      else {
        const esVoice = voices.find(v => v.lang.startsWith('es-') && v.name.includes('Google'));
        if (esVoice) utterance.voice = esVoice;
        else {
          const anyEs = voices.find(v => v.lang.startsWith('es-'));
          if (anyEs) utterance.voice = anyEs;
        }
      }
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech API failed', e);
      }
    }
  }, []);

  const say = useCallback((text, highlight = null, interactiveOptions = null) => {
    setIsActive(true);
    setMessage(text);
    setHighlightId(highlight);
    setOptions(interactiveOptions);
    speak(text);
  }, [speak]);

  // Manejador del resaltado visual
  useEffect(() => {
    document.querySelectorAll('.assistant-highlight').forEach(el => {
      el.classList.remove('assistant-highlight', 'ring-4', 'ring-indigo-500', 'ring-offset-2', 'animate-pulse', 'z-50', 'relative');
    });

    if (highlightId && isActive) {
      const el = document.getElementById(highlightId);
      if (el) {
        el.classList.add('assistant-highlight', 'ring-4', 'ring-indigo-500', 'ring-offset-2', 'animate-pulse', 'z-50', 'relative');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, isActive]);

  const getGreetingByTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const startFacturacionGreeting = useCallback(() => {
    const isFirstTime = localStorage.getItem('avatar_facturacion_greeted') !== 'true';
    
    if (isFirstTime) {
      localStorage.setItem('avatar_facturacion_greeted', 'true');
      const greeting = getGreetingByTime();
      say(`¡${greeting}! Bienvenido al módulo de Facturación e Inventarios. Soy tu asistente virtual y estoy aquí para ayudarte a emitir DTEs y controlar tus existencias.`);
      
      setTimeout(() => {
        say('Te recomiendo revisar primero la Configuración DTE para validar tu certificado de Hacienda.', null, [
          { label: 'Ir a Configuración', action: () => { dismiss(); navigate('/configuracion-dte'); } },
          { label: 'Explorar por mi cuenta', action: () => dismiss() }
        ]);
      }, 9000);
    }
  }, [say, navigate, dismiss]);

  const startFacturasOnboarding = useCallback(() => {
    const isFirstTime = localStorage.getItem('avatar_facturas_done') !== 'true';
    if (!isFirstTime) return;

    localStorage.setItem('avatar_facturas_done', 'true');
    setIsActive(true);
    
    say('¡Estás en la pantalla de Facturas! Aquí se registrarán todas tus ventas.', 'table-facturas');
    
    setTimeout(() => {
      if (window.location.pathname !== '/facturas') return;
      say('Para generar una nueva factura o comprobante de crédito fiscal, debes hacer clic en el botón "Emitir Factura".', 'btn-emitir-factura');
    }, 7000);
    
    setTimeout(() => {
      if (window.location.pathname !== '/facturas') return;
      say('Una vez emitida, podrás presionar "Transmitir MH" para enviarla inmediatamente al Ministerio de Hacienda, y el PDF se habilitará cuando sea aprobada.', null, [
        { label: '¡Entendido!', action: dismiss }
      ]);
    }, 15000);
  }, [say, dismiss]);

  return (
    <AssistantContext.Provider value={{
      isActive,
      message,
      options,
      say,
      dismiss,
      startFacturacionGreeting,
      startFacturasOnboarding
    }}>
      {children}
    </AssistantContext.Provider>
  );
};
