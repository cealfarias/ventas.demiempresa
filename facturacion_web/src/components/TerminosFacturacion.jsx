import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

export default function TerminosFacturacion({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Términos de Referencia</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-600 space-y-5">
          <p>
            <strong>ALCANCE DEL SERVICIO DE FACTURACIÓN E INVENTARIO SAAS</strong><br />
            Este documento establece los términos bajo los cuales "Facturación SaaS" proporciona la plataforma de gestión de ingresos, catálogo de productos y control de inventarios a la empresa registrada.
          </p>
          
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-base">1. Naturaleza Multi-Empresa</h3>
            <p>La plataforma está diseñada con arquitectura multi-tenant (multi-inquilino). Esto garantiza que la información de cada empresa esté criptográficamente aislada mediante un `empresa_id` único, asegurando que ningún usuario pueda acceder a datos de otra organización.</p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-base">2. Responsabilidad de la Data</h3>
            <p>Toda la información registrada (facturas emitidas, catálogos, y movimientos de inventario) es propiedad exclusiva de la empresa usuaria. Facturación SaaS provee el medio tecnológico pero no interviene en la veracidad, validez fiscal ni legalidad de los documentos emitidos por la empresa.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-base">3. Seguridad y 2FA</h3>
            <p>La plataforma utiliza algoritmos de encriptación estándar de la industria (Bcrypt, JWT). Se recomienda encarecidamente activar la <strong>Verificación en 2 Pasos (2FA)</strong> para los roles de Administrador, limitando el riesgo de accesos no autorizados a las arcas del negocio.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
