import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

export default function TerminosFacturacion({ onClose }) {
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
        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-600 space-y-6 custom-scrollbar">
          <p className="text-xs text-slate-400 font-medium">Última actualización: 15 de Agosto de 2026</p>
          
          <p className="leading-relaxed">
            Bienvenido al Sistema de Facturación e Inventario SaaS (en adelante, "la Plataforma"). Al registrar su empresa y utilizar nuestros servicios, usted acepta estar sujeto a los siguientes Términos de Referencia y Condiciones de Servicio. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder a la Plataforma.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base">1. Naturaleza del Servicio</h3>
            <p className="leading-relaxed">La Plataforma es un software alojado en la nube (SaaS - Software as a Service) diseñado para proveer a las empresas herramientas automatizadas de control de inventarios, catálogo de productos, gestión de clientes y emisión de comprobantes fiscales y facturación electrónica. La Plataforma actúa exclusivamente como una herramienta informática para facilitar sus procesos de venta y contabilidad operativa.</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base">2. Cumplimiento Legal (El Salvador)</h3>
            <p className="leading-relaxed">La Plataforma ha sido desarrollada en estricto cumplimiento con la legislación fiscal y tributaria de la República de El Salvador, incluyendo pero no limitado a:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Código Tributario de El Salvador:</strong> Cumplimiento de las obligaciones formales estipuladas para la emisión de Facturas, Comprobantes de Crédito Fiscal (CCF), Notas de Crédito y Débito, y Tickets en transacciones de punto de venta.</li>
              <li><strong>Ministerio de Hacienda (MH) - Facturación Electrónica:</strong> El sistema está preparado para cumplir con los estándares técnicos exigidos para la generación, firma y transmisión de Documentos Tributarios Electrónicos (DTE) bajo el formato JSON aprobado por el MH.</li>
              <li><strong>Cálculo de Impuestos:</strong> El sistema provee mecanismos para el cálculo automático del Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA), Percepción/Retención del 1%, y otras contribuciones especiales (FOVIAL, COTRANS) según aplique al rubro.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base">3. Licenciamiento y Modelos de Uso</h3>
            <p className="leading-relaxed">La Plataforma se ofrece bajo diferentes modalidades de licencia, las cuales pueden variar según el plan elegido:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Versión Gratuita (Freeware con Publicidad):</strong> El uso de la plataforma puede ser gratuito sujeto a la visualización de anuncios publicitarios de terceros, tiempos de espera programados (cool-downs) para ciertas acciones, y límites en la cantidad de DTEs emitidos al mes.</li>
              <li><strong>Período de Prueba (Trial):</strong> Podrá disponer de un período de prueba gratuito de 14 días con todas las funciones Premium habilitadas (inventarios ilimitados, sucursales). Transcurrido este tiempo, deberá adquirir una suscripción o su cuenta pasará a la versión gratuita con restricciones.</li>
              <li><strong>Versiones Premium:</strong> Libres de publicidad, sin tiempos de espera, multisupervisor, manejo de bodegas múltiples y reportes avanzados.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base">4. Responsabilidad de la Información (Integridad de Datos)</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Exactitud de los Datos:</strong> El usuario administrador de la empresa es el único responsable de la veracidad, exactitud y actualización de los datos ingresados en el sistema (NIT, NRC, precios, existencias, giros comerciales de clientes).</li>
              <li><strong>Emisión de DTEs e Impuestos:</strong> Aunque la Plataforma automatiza los cálculos de IVA y totalización, es responsabilidad legal y fiduciaria de la empresa emisora verificar los totales antes de firmar electrónicamente y transmitir el DTE al Ministerio de Hacienda. La Plataforma no sustituye el criterio contable de su auditor ni asume responsabilidad por contingencias fiscales.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base">5. Privacidad y Confidencialidad de los Datos</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Aislamiento de Datos (Multi-Tenant):</strong> Garantizamos que la información de sus clientes, proveedores, precios y ventas está estrictamente aislada criptográficamente y es inaccesible para otras empresas que utilicen la Plataforma.</li>
              <li><strong>Propiedad de los Datos:</strong> Usted retiene todos los derechos y la propiedad intelectual sobre la información comercial ingresada al sistema. La Plataforma únicamente actúa como custodio.</li>
              <li><strong>Uso de Cookies y Tecnologías de Seguimiento:</strong> La Plataforma utiliza cookies propias y de terceros necesarias para mantener la sesión activa de los cajeros, recordar preferencias y recopilar datos estadísticos. Al utilizar nuestros servicios, usted otorga su consentimiento.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base">6. Propiedad Intelectual y Restricciones de Uso</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Derechos Reservados:</strong> Nos reservamos todos los derechos de propiedad intelectual, derechos de autor y patentes sobre el código fuente, algoritmos, y diseño de la Plataforma.</li>
              <li><strong>Prohibición de Copias y Scraping:</strong> Queda estrictamente prohibido realizar ingeniería inversa, desensamblar el software o utilizar herramientas automatizadas (Web Scraping) para extraer datos de la Plataforma.</li>
              <li><strong>Seguridad:</strong> Queda prohibido intentar vulnerar las medidas de seguridad del sistema o realizar cualquier actividad cibernética ilícita, bajo pena de cancelación inmediata del servicio.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base">7. Disponibilidad del Servicio y Soporte</h3>
            <p className="leading-relaxed">Nos esforzamos por mantener una disponibilidad del servicio del 99.9%, esencial para puntos de venta continuos. Sin embargo, la Plataforma puede estar sujeta a interrupciones por mantenimiento de servidores o caídas de los servicios de validación del Ministerio de Hacienda (contingencia). Se realizan copias de seguridad de las bases de datos transaccionales de forma constante y periódica.</p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aceptar y Continuar
          </button>
        </div>

      </div>
    </div>
  );
}
