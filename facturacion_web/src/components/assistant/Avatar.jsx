import React, { useEffect, useState, useRef } from 'react';
import { Bot, X } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';

export default function Avatar() {
  const { isActive, message, options, dismiss } = useAssistant();
  const [displayedText, setDisplayedText] = useState('');
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialClientX: 0, initialClientY: 0 });
  
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      return;
    }
    
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(message.substring(0, i + 1));
      i++;
      if (i >= message.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, [message]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY
      });
    };

    const handleMouseUp = (e) => {
      if (!isDragging) return;
      setIsDragging(false);
      const dx = Math.abs(e.clientX - dragRef.current.initialClientX);
      const dy = Math.abs(e.clientY - dragRef.current.initialClientY);
      
      if (dx < 15 && dy < 15) {
        setShowMenu(prev => !prev);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    e.preventDefault(); 
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      initialClientX: e.clientX,
      initialClientY: e.clientY
    };
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end animate-in slide-in-from-bottom-8 fade-in duration-500 select-none"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {showMenu && !isActive && (
        <div className="bg-white text-slate-800 p-3 rounded-2xl rounded-br-sm shadow-xl border border-slate-100 mb-4 w-56 relative cursor-default">
          <button 
            onClick={() => setShowMenu(false)}
            className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-full p-1 transition-opacity shadow-sm z-10"
          >
            <X className="w-3 h-3" />
          </button>
          
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asistente Virtual</h5>
          
          <p className="text-sm text-slate-600 p-2 text-center bg-slate-50 rounded-lg">
            ¡Hola! Estoy monitoreando tus operaciones. Pronto tendré más comandos disponibles.
          </p>
        </div>
      )}

      {isActive && message && (
        <div className="bg-white text-slate-800 p-4 rounded-2xl rounded-br-sm shadow-xl border border-slate-100 mb-4 max-w-sm relative group cursor-default">
          <button 
            onClick={dismiss}
            className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-3 h-3" />
          </button>
          
          <p className="text-sm font-medium leading-relaxed select-text">
            {displayedText}
            {displayedText.length < message.length && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse"></span>
            )}
          </p>

          {options && displayedText.length === message.length && (
            <div className="mt-4 flex space-x-2">
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={opt.action}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    idx === 0 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div 
        className="relative cursor-move drag-handle"
        onMouseDown={handleMouseDown}
        title="Arrastra para mover o haz click para opciones"
      >
        {isActive && (
          <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-25 pointer-events-none scale-110"></div>
        )}
        
        <div className={`relative bg-gradient-to-tr from-slate-800 to-slate-900 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 border-white pointer-events-none transition-all overflow-hidden ${isActive ? 'shadow-indigo-500/50 scale-105 ring-2 ring-indigo-400 ring-offset-2' : 'shadow-slate-400 hover:scale-105'}`}>
          <video
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${!isActive ? 'opacity-100' : 'opacity-0'}`}
            src="/avatar-idle.mp4"
            autoPlay loop muted playsInline
            onError={(e) => e.target.style.display = 'none'}
          />
          <video
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${isActive ? 'opacity-100' : 'opacity-0'}`}
            src="/avatar-talking.mp4"
            autoPlay loop muted playsInline
            onError={(e) => e.target.style.display = 'none'}
          />
          <Bot className="w-8 h-8 text-white relative z-0" />
        </div>
      </div>
    </div>
  );
}
