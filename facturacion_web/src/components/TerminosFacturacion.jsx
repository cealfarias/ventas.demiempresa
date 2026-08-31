import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TerminosFacturacion({ onClose }) {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Apuntamos al archivo centralizado en Vercel directamente para evitar problemas de DNS con el 'www'
    const url = window.location.hostname === 'localhost' 
      ? '/terminos.md' 
      : 'https://demiempresa.vercel.app/terminos.md';
      
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar los términos');
        return res.text();
      })
      .then(text => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Términos de Referencia y Contrato de Servicio</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 text-sm text-slate-600 space-y-4 custom-scrollbar bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Cargando términos centralizados...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-red-500">
              <p>Error al cargar los términos. Por favor intente más tarde.</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-slate prose-headings:text-slate-800 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-6 prose-p:leading-relaxed prose-li:leading-relaxed">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all shadow-md"
            disabled={loading}
          >
            <CheckCircle2 className="w-4 h-4" />
            Aceptar y Continuar
          </button>
        </div>

      </div>
    </div>
  );
}
