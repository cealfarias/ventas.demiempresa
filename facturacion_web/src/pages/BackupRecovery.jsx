import React, { useState } from 'react';
import { ShieldCheck, Download, Upload, FileText, CheckCircle2, AlertTriangle, Lock, RefreshCw, Key, Database } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

export default function BackupRecovery() {
  const [descargando, setDescargando] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [contenidoJson, setContenidoJson] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const ejecutarExportacion = async () => {
    setDescargando(true);
    setErrorMsg('');
    try {
      let res;
      try {
        res = await api.get(`/api/v1/sistema/backup/export?empresa_id=${empresaId()}`);
      } catch (e1) {
        res = await api.get(`/api/v1/backup/export?empresa_id=${empresaId()}`);
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      const fechaStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `respaldo_${empresaId()}_${fechaStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Copia de seguridad exportada y firmada digitalmente con HMAC-SHA256." }}));
    } catch (e) {
      const msg = e.response?.data?.detail || 'Error al generar la copia de seguridad en el servidor.';
      setErrorMsg(msg);
    } finally {
      setDescargando(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivoSeleccionado(file);
    setResultado(null);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed.firma_integridad || !parsed.datos) {
          setErrorMsg('El archivo no tiene la estructura requerida de un respaldo con firma digital.');
          setContenidoJson(null);
        } else {
          setContenidoJson(parsed);
        }
      } catch (err) {
        setErrorMsg('El archivo seleccionado no es un formato JSON válido.');
        setContenidoJson(null);
      }
    };
    reader.readAsText(file);
  };

  const ejecutarRestauracion = async () => {
    if (!contenidoJson) return;
    setProcesando(true);
    setResultado(null);
    setErrorMsg('');

    try {
      let res;
      try {
        res = await api.post(`/api/v1/sistema/backup/import?empresa_id=${empresaId()}`, contenidoJson);
      } catch (e1) {
        res = await api.post(`/api/v1/backup/import?empresa_id=${empresaId()}`, contenidoJson);
      }

      setResultado(res.data);
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Firma digital verificada y datos restaurados exitosamente." }}));
    } catch (e) {
      const msg = e.response?.data?.detail || 'Error en la verificación e inyección del respaldo.';
      setErrorMsg(msg);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" /> Respaldo y Restauración (Backup & Recovery)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Exportación e inyección inmediata de copias de seguridad resguardadas con Firma Digital Criptográfica HMAC-SHA256</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <Key className="w-4 h-4" /> Firma HMAC-SHA256 Activa
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* TARJETA EXPORTAR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Exportar Copia de Seguridad</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Genera un archivo completo en formato <span className="font-bold text-slate-700">JSON</span> con todos los módulos de tu empresa (Inventarios, Clientes, Facturas, Cajas, Acreedores y Préstamos).
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-6 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Incluye firma criptográfica de integridad.
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Descarga inmediata de un solo archivo `.json`.
              </div>
            </div>
          </div>

          <button
            onClick={ejecutarExportacion}
            disabled={descargando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {descargando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generando y Firmando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Generar y Descargar Respaldo JSON
              </>
            )}
          </button>
        </div>

        {/* TARJETA RESTAURAR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Restaurar / Inyectar Respaldo</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Carga un archivo de respaldo `.json`. El sistema <span className="font-bold text-slate-700">verificará la firma digital</span> antes de permitir cualquier modificación en la base de datos.
            </p>

            <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/30 mb-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">
                {archivoSeleccionado ? archivoSeleccionado.name : 'Haz clic o arrastra tu archivo JSON aquí'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Archivos de respaldo firmados (.json)</div>
            </div>

            {/* PREVIEW DE LA FIRMA */}
            {contenidoJson && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 mb-4 text-xs space-y-1">
                <div className="font-bold text-indigo-900 flex items-center justify-between">
                  <span>Respaldo Detectado</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">CON SELLO DIG</span>
                </div>
                <div className="text-slate-600">Empresa: <span className="font-semibold text-slate-800">{contenidoJson.empresa_id}</span></div>
                <div className="text-slate-600">Firma HMAC: <span className="font-mono text-[10px] text-indigo-700 font-bold block truncate">{contenidoJson.firma_integridad}</span></div>
              </div>
            )}
          </div>

          <button
            onClick={ejecutarRestauracion}
            disabled={!contenidoJson || procesando}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {procesando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Firma e Inyectando...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Verificar Firma e Inyectar en Sistema
              </>
            )}
          </button>
        </div>
      </div>

      {/* ALERTAS DE RESULTADO */}
      {resultado && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex items-start gap-4 text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-base">{resultado.mensaje}</h4>
            <p className="text-xs text-emerald-700 mt-1">Registros procesados: <span className="font-bold">{resultado.registros_procesados}</span>. Firma digital verificada como 100% auténtica.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-start gap-4 text-red-900 animate-in fade-in">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-base">Restauración Revertida y Bloqueada</h4>
            <p className="text-xs text-red-700 mt-1 font-medium leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* CARD INFORMATIVA DE SEGURIDAD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" /> Protección de Integridad con HMAC-SHA256
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Cada archivo de respaldo generado por el sistema incluye una firma criptográfica única. Si un usuario o tercero intenta modificar un valor en el archivo JSON (como precios, existencias, nombres o cuotas) fuera del sistema, la firma digital **dejará de coincidir**, impidiendo de forma estricta que la información adulterada se inyecte en la base de datos de la empresa.
        </p>
      </div>
    </div>
  );
}
