import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, FileBadge, Building2, Server } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

export default function ConfiguracionDTE() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState({
    nit: '', nrc: '', nombre_comercial: '', actividad_economica_cod: '',
    desc_actividad_economica: '', direccion_municipio: '', direccion_departamento: '',
    direccion_complemento: '', telefono: '', email: '',
    establecimiento_tipo: '02', establecimiento_cod: '0000',
    ambiente: '00', api_pwd: '', certificado_pwd: ''
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/configuracion/configuracion-dte/?empresa_id=${empresaId()}`);
      setConfig({ ...res.data, api_pwd: '', certificado_pwd: '' }); // Ocultar contraseñas reales
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put(`/api/v1/configuracion/configuracion-dte/?empresa_id=${empresaId()}`, config);
      alert('Configuración DTE guardada exitosamente');
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // En un caso real se usa el binario del .p12, aquí guardamos el base64
        const base64 = btoa(new Uint8Array(e.target.result).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        setConfig({ ...config, certificado_p12_base64: base64 });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const Field = ({ label, children }) => <div><label className="text-xs font-semibold text-slate-500 uppercase block mb-1">{label}</label>{children}</div>;
  const Input = (props) => <input {...props} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />;

  if (cargando) return <div className="p-8 text-center text-slate-400">Cargando configuración...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" /> Configuración DTE (Hacienda)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Credenciales y certificados para la Facturación Electrónica</p>
        </div>
        <button onClick={guardar} disabled={guardando} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Datos del Emisor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> Datos del Emisor</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NIT"><Input value={config.nit} onChange={e => setConfig({...config, nit: e.target.value})} placeholder="0000-000000-000-0" /></Field>
            <Field label="NRC"><Input value={config.nrc} onChange={e => setConfig({...config, nrc: e.target.value})} placeholder="123456-7" /></Field>
            <Field label="Nombre Comercial"><Input value={config.nombre_comercial} onChange={e => setConfig({...config, nombre_comercial: e.target.value})} /></Field>
            <Field label="Código Actividad Económica"><Input value={config.actividad_economica_cod} onChange={e => setConfig({...config, actividad_economica_cod: e.target.value})} placeholder="Ej: 62010" /></Field>
            <div className="col-span-2">
              <Field label="Descripción de Actividad"><Input value={config.desc_actividad_economica} onChange={e => setConfig({...config, desc_actividad_economica: e.target.value})} /></Field>
            </div>
            
            <Field label="Departamento (Cod MH)"><Input value={config.direccion_departamento} onChange={e => setConfig({...config, direccion_departamento: e.target.value})} placeholder="Ej: 06 (San Salvador)" /></Field>
            <Field label="Municipio (Cod MH)"><Input value={config.direccion_municipio} onChange={e => setConfig({...config, direccion_municipio: e.target.value})} placeholder="Ej: 14 (San Salvador)" /></Field>
            <div className="col-span-2">
              <Field label="Dirección Complemento"><Input value={config.direccion_complemento} onChange={e => setConfig({...config, direccion_complemento: e.target.value})} /></Field>
            </div>
            
            <Field label="Teléfono"><Input value={config.telefono} onChange={e => setConfig({...config, telefono: e.target.value})} /></Field>
            <Field label="Correo Electrónico"><Input type="email" value={config.email} onChange={e => setConfig({...config, email: e.target.value})} /></Field>
            <Field label="Tipo Establecimiento"><Input value={config.establecimiento_tipo} onChange={e => setConfig({...config, establecimiento_tipo: e.target.value})} placeholder="02" /></Field>
            <Field label="Código Establecimiento"><Input value={config.establecimiento_cod} onChange={e => setConfig({...config, establecimiento_cod: e.target.value})} placeholder="0000" /></Field>
          </div>
        </div>

        {/* API y Certificado */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-indigo-500" /> API Ministerio de Hacienda</h2>
            <div className="space-y-4">
              <Field label="Ambiente de Transmisión">
                <select value={config.ambiente} onChange={e => setConfig({...config, ambiente: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm">
                  <option value="00">Pruebas (00)</option>
                  <option value="01">Producción (01)</option>
                </select>
              </Field>
              <Field label="Contraseña API MH">
                <Input type="password" value={config.api_pwd} onChange={e => setConfig({...config, api_pwd: e.target.value})} placeholder="Dejar en blanco para no cambiar" />
              </Field>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileBadge className="w-5 h-5 text-indigo-500" /> Certificado Firma (.p12)</h2>
            <div className="space-y-4">
              <Field label="Subir Archivo .p12">
                <input type="file" accept=".p12" onChange={manejarArchivo} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </Field>
              {config.certificado_p12_base64 && <div className="text-xs text-emerald-600 font-medium">✓ Certificado cargado en sistema</div>}
              
              <Field label="Contraseña del Certificado">
                <Input type="password" value={config.certificado_pwd} onChange={e => setConfig({...config, certificado_pwd: e.target.value})} placeholder="Dejar en blanco para no cambiar" />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
