import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, FileBadge, Building2, Server, Mail, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
);

export default function ConfiguracionDTE() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [probandoSmtp, setProbandoSmtp] = useState(false);
  const [smtpMensaje, setSmtpMensaje] = useState(null);
  const [instruccionesSmtp, setInstruccionesSmtp] = useState('');

  // Estructura de Catálogos Geográficos en Cascada
  const [geoData, setGeoData] = useState([]);
  const [distritosDisponibles, setDistritosDisponibles] = useState([]);
  const [distritoSeleccionado, setDistritoSeleccionado] = useState('');

  const [config, setConfig] = useState({
    nit: '', nrc: '', nombre_comercial: '', actividad_economica_cod: '',
    desc_actividad_economica: '', direccion_municipio: '', direccion_departamento: '',
    direccion_distrito: '', direccion_complemento: '', telefono: '', email: '',
    establecimiento_tipo: '02', establecimiento_cod: '0000',
    ambiente: '00', api_pwd: '', certificado_pwd: '',
    smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '',
    smtp_use_tls: true, smtp_from_email: ''
  });

  const cargar = async () => {
    setCargando(true);
    try {
      // 1. Cargar Configuración Actual
      const res = await api.get(`/api/v1/configuracion/configuracion-dte/?empresa_id=${empresaId()}`);
      const datos = res.data;
      setConfig({ ...datos, api_pwd: '', certificado_pwd: '', smtp_password: '' });

      // 2. Cargar Jerarquía Geográfica (Departamentos -> Distritos -> Auto Municipio)
      const geoRes = await api.get('/api/v1/configuracion/configuracion-dte/catalogos-geograficos');
      const deptos = geoRes.data.departamentos || [];
      setGeoData(deptos);

      // Si ya hay departamento seleccionado, cargar sus distritos
      if (datos.direccion_departamento) {
        const deptoEncontrado = deptos.find(d => d.codigo_departamento === datos.direccion_departamento);
        if (deptoEncontrado) {
          setDistritosDisponibles(deptoEncontrado.distritos || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Handler: 1. Seleccionar Departamento
  const manejarCambioDepartamento = (deptoCod) => {
    const deptoEncontrado = geoData.find(d => d.codigo_departamento === deptoCod);
    const dists = deptoEncontrado ? deptoEncontrado.distritos : [];
    
    setDistritosDisponibles(dists);
    setDistritoSeleccionado('');
    
    setConfig(prev => ({
      ...prev,
      direccion_departamento: deptoCod,
      direccion_distrito: '',
      direccion_municipio: ''
    }));
  };

  // Handler: 2. Seleccionar Distrito -> 3. Auto-asignar Municipio
  const manejarCambioDistrito = (distritoCod) => {
    setDistritoSeleccionado(distritoCod);
    const distEncontrado = distritosDisponibles.find(d => d.codigo_distrito === distritoCod);

    if (distEncontrado) {
      // Auto-asignación automática del Municipio oficial del MH
      setConfig(prev => ({
        ...prev,
        direccion_distrito: distritoCod,
        direccion_municipio: distEncontrado.municipio_cod,
        direccion_municipio_nombre: distEncontrado.municipio_nombre
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        direccion_distrito: distritoCod,
        direccion_municipio: ''
      }));
    }
  };

  // Auto-detección de servidor SMTP al escribir el correo
  const manejarAutoDetectarSMTP = async (emailInput) => {
    setConfig(prev => ({ ...prev, smtp_username: emailInput, email: emailInput }));
    if (emailInput.includes('@')) {
      try {
        const res = await api.post('/api/v1/configuracion/configuracion-dte/auto-detectar-smtp', { email: emailInput });
        const auto = res.data;
        if (auto.smtp_host) {
          setConfig(prev => ({
            ...prev,
            smtp_host: auto.smtp_host,
            smtp_port: auto.smtp_port || 587,
            smtp_use_tls: auto.smtp_use_tls !== undefined ? auto.smtp_use_tls : true
          }));
        }
        if (auto.instrucciones) {
          setInstruccionesSmtp(auto.instrucciones);
        }
      } catch (ex) {
        console.error(ex);
      }
    }
  };

  const probarConexionSMTP = async () => {
    setProbandoSmtp(true);
    setSmtpMensaje(null);
    try {
      const payload = {
        smtp_host: config.smtp_host,
        smtp_port: parseInt(config.smtp_port) || 587,
        smtp_username: config.smtp_username,
        smtp_password: config.smtp_password,
        smtp_use_tls: config.smtp_use_tls,
        smtp_from_email: config.smtp_from_email || config.smtp_username
      };
      const res = await api.post('/api/v1/configuracion/configuracion-dte/probar-smtp', payload);
      setSmtpMensaje({ exito: true, texto: res.data.mensaje });
    } catch (e) {
      setSmtpMensaje({ exito: false, texto: e.response?.data?.detail || 'Fallo la prueba de conexión SMTP' });
    } finally {
      setProbandoSmtp(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put(`/api/v1/configuracion/configuracion-dte/?empresa_id=${empresaId()}`, config);
      alert('Configuración DTE y Correo guardada exitosamente');
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = btoa(new Uint8Array(ev.target.result).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        setConfig({ ...config, certificado_p12_base64: base64 });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  if (cargando) return <div className="p-8 text-center text-slate-400">Cargando configuración...</div>;

  // Obtener nombre del municipio auto-asignado para mostrar al usuario
  const nombreDeptoActual = geoData.find(d => d.codigo_departamento === config.direccion_departamento)?.nombre_departamento || '';
  const distActual = distritosDisponibles.find(d => d.codigo_distrito === (config.direccion_distrito || distritoSeleccionado));
  const nombreMunicipioAuto = distActual ? `${distActual.municipio_nombre} (Cod: ${distActual.municipio_cod})` : config.direccion_municipio;

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" /> Configuración DTE (Hacienda)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Credenciales, ubicación geográfica y correo saliente para Facturación Electrónica</p>
        </div>
        <button onClick={guardar} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-md transition-all">
          <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Datos del Emisor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" /> Datos del Emisor
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NIT"><Input value={config.nit || ''} onChange={e => setConfig({...config, nit: e.target.value})} placeholder="0000-000000-000-0" /></Field>
            <Field label="NRC"><Input value={config.nrc || ''} onChange={e => setConfig({...config, nrc: e.target.value})} placeholder="123456-7" /></Field>
            <Field label="Nombre Comercial"><Input value={config.nombre_comercial || ''} onChange={e => setConfig({...config, nombre_comercial: e.target.value})} /></Field>
            <Field label="Código Actividad Económica"><Input value={config.actividad_economica_cod || ''} onChange={e => setConfig({...config, actividad_economica_cod: e.target.value})} placeholder="Ej: 62010" /></Field>
            
            <div className="col-span-2">
              <Field label="Descripción de Actividad"><Input value={config.desc_actividad_economica || ''} onChange={e => setConfig({...config, desc_actividad_economica: e.target.value})} /></Field>
            </div>
            
            {/* 1. DEPARTAMENTO (Desplegable) */}
            <Field label="1. Departamento (MH)">
              <select
                value={config.direccion_departamento || ''}
                onChange={e => manejarCambioDepartamento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Seleccione Departamento --</option>
                {geoData.map(depto => (
                  <option key={depto.codigo_departamento} value={depto.codigo_departamento}>
                    {depto.codigo_departamento} - {depto.nombre_departamento}
                  </option>
                ))}
              </select>
            </Field>

            {/* 2. DISTRITO (Desplegable filtrado) */}
            <Field label="2. Distrito (MH)">
              <select
                value={config.direccion_distrito || distritoSeleccionado || ''}
                onChange={e => manejarCambioDistrito(e.target.value)}
                disabled={!config.direccion_departamento}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">-- Seleccione Distrito --</option>
                {distritosDisponibles.map(dist => (
                  <option key={dist.codigo_distrito} value={dist.codigo_distrito}>
                    {dist.nombre_distrito}
                  </option>
                ))}
              </select>
            </Field>

            {/* 3. MUNICIPIO (Auto-Asignado Automáticamente) */}
            <div className="col-span-2 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                  3. Municipio Asignado Automáticamente (CAT-013 MH):
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {nombreMunicipioAuto ? nombreMunicipioAuto : 'Seleccione un Departamento y Distrito arriba'}
                </span>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            </div>

            <div className="col-span-2">
              <Field label="Dirección Complemento"><Input value={config.direccion_complemento || ''} onChange={e => setConfig({...config, direccion_complemento: e.target.value})} placeholder="Calle, avenida, número de local o casa..." /></Field>
            </div>
            
            <Field label="Teléfono"><Input value={config.telefono || ''} onChange={e => setConfig({...config, telefono: e.target.value})} /></Field>
            <Field label="Correo Electrónico Emisor"><Input type="email" value={config.email || ''} onChange={e => manejarAutoDetectarSMTP(e.target.value)} placeholder="facturacion@miempresa.com" /></Field>
            <Field label="Tipo Establecimiento"><Input value={config.establecimiento_tipo || '02'} onChange={e => setConfig({...config, establecimiento_tipo: e.target.value})} placeholder="02" /></Field>
            <Field label="Código Establecimiento"><Input value={config.establecimiento_cod || '0000'} onChange={e => setConfig({...config, establecimiento_cod: e.target.value})} placeholder="0000" /></Field>
          </div>
        </div>

        {/* Configuración de Correo Saliente (SMTP) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" /> Configuración de Correo Saliente (Envío Asíncrono DTE)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Asistente inteligente: Al ingresar tu correo, el sistema auto-detecta el servidor SMTP y te orienta paso a paso.
          </p>

          {instruccionesSmtp && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>{instruccionesSmtp}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Servidor SMTP (Host)"><Input value={config.smtp_host || ''} onChange={e => setConfig({...config, smtp_host: e.target.value})} placeholder="smtp.gmail.com" /></Field>
            <Field label="Puerto SMTP"><Input type="number" value={config.smtp_port || 587} onChange={e => setConfig({...config, smtp_port: e.target.value})} placeholder="587" /></Field>
            <Field label="Usuario SMTP (Correo)"><Input type="email" value={config.smtp_username || ''} onChange={e => manejarAutoDetectarSMTP(e.target.value)} placeholder="facturacion@miempresa.com" /></Field>
            <Field label="Contraseña SMTP / Clave de App">
              <Input type="password" value={config.smtp_password || ''} onChange={e => setConfig({...config, smtp_password: e.target.value})} placeholder="••••••••••••••••" />
            </Field>
          </div>

          {smtpMensaje && (
            <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${smtpMensaje.exito ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {smtpMensaje.exito ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{smtpMensaje.texto}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={probarConexionSMTP}
              disabled={probandoSmtp || !config.smtp_host || !config.smtp_username}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              🧪 {probandoSmtp ? 'Probando Conexión...' : 'Probar Conexión SMTP'}
            </button>
          </div>
        </div>

        {/* API y Certificado */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" /> API Ministerio de Hacienda
            </h2>
            <div className="space-y-4">
              <Field label="Ambiente de Transmisión">
                <select value={config.ambiente || '00'} onChange={e => setConfig({...config, ambiente: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm">
                  <option value="00">Pruebas (00)</option>
                  <option value="01">Producción (01)</option>
                </select>
              </Field>
              <Field label="Contraseña API MH">
                <Input type="password" value={config.api_pwd || ''} onChange={e => setConfig({...config, api_pwd: e.target.value})} placeholder="Dejar en blanco para no cambiar" />
              </Field>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-indigo-500" /> Certificado Firma (.p12)
            </h2>
            <div className="space-y-4">
              <Field label="Subir Archivo .p12">
                <input type="file" accept=".p12" onChange={manejarArchivo} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </Field>
              {config.certificado_p12_base64 && <div className="text-xs text-emerald-600 font-medium">✓ Certificado cargado en sistema</div>}
              
              <Field label="Contraseña del Certificado">
                <Input type="password" value={config.certificado_pwd || ''} onChange={e => setConfig({...config, certificado_pwd: e.target.value})} placeholder="Dejar en blanco para no cambiar" />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
