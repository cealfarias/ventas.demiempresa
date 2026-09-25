import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings, Save, CheckCircle, AlertCircle, RefreshCw, BookOpen, Key, Link2 } from 'lucide-react';

export default function ConfiguracionContable() {
  const [empresaId] = useState(localStorage.getItem('empresa_id') || '');
  const [loading, setLoading] = useState(false);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [catalogoRemoto, setCatalogoRemoto] = useState([]);

  const [formData, setFormData] = useState({
    url_api_contable: 'http://127.0.0.1:8000',
    api_key_empresa: '',
    cuenta_caja_general: '110101',
    cuenta_bancos: '110201',
    cuenta_iva_debito: '210201',
    cuenta_iva_credito: '110601',
    cuenta_cxc_clientes: '110301',
    cuenta_cxp_proveedores: '210101',
    cuenta_ventas_cf: '410101',
    cuenta_ventas_ccf: '410102',
    cuenta_inventario: '110501',
    cuenta_costo_ventas: '510101'
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/integracion-contable/configuracion?empresa_id=${empresaId}`);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          url_api_contable: res.data.url_api_contable || 'http://127.0.0.1:8000',
          api_key_empresa: res.data.api_key_empresa || '',
          cuenta_caja_general: res.data.cuenta_caja_general || '110101',
          cuenta_bancos: res.data.cuenta_bancos || '110201',
          cuenta_iva_debito: res.data.cuenta_iva_debito || '210201',
          cuenta_iva_credito: res.data.cuenta_iva_credito || '110601',
          cuenta_cxc_clientes: res.data.cuenta_cxc_clientes || '110301',
          cuenta_cxp_proveedores: res.data.cuenta_cxp_proveedores || '210101',
          cuenta_ventas_cf: res.data.cuenta_ventas_cf || '410101',
          cuenta_ventas_ccf: res.data.cuenta_ventas_ccf || '410102',
          cuenta_inventario: res.data.cuenta_inventario || '110501',
          cuenta_costo_ventas: res.data.cuenta_costo_ventas || '510101'
        }));
      }
    } catch (err) {
      console.error("Error al cargar configuracion contable", err);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogoRemoto = async () => {
    if (!formData.api_key_empresa) {
      setError("Por favor ingresa primero la API Key de Contabilidad");
      return;
    }
    setCargandoCatalogo(true);
    setError(null);
    try {
      const res = await api.get(`/api/v1/integracion-contable/catalogo-remoto?empresa_id=${empresaId}`);
      if (res.data && Array.isArray(res.data)) {
        setCatalogoRemoto(res.data);
        setMensaje(`¡Catálogo contable obtenido con éxito! (${res.data.length} cuentas cargadas)`);
      }
    } catch (err) {
      setError("No se pudo obtener el catálogo remoto. Verifica la URL y la API Key de Contabilidad.");
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const res = await api.post(`/api/v1/integracion-contable/configuracion?empresa_id=${empresaId}`, formData);
      if (res.data?.exito) {
        setMensaje("Configuración de Integración Contable guardada exitosamente");
      }
    } catch (err) {
      setError("Error al guardar la configuración: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Link2 className="w-7 h-7 text-indigo-600" />
            Integración Contable del Ecosistema
          </h1>
          <p className="text-sm text-slate-500">
            Conecta la Facturación con el Núcleo Contable (<span className="font-semibold text-indigo-600">c:\conta.demiempresa</span>) usando la API Key de tu Empresa.
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Credenciales API */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <Key className="w-5 h-5 text-indigo-600" />
            1. Servidor de Contabilidad y Credenciales de Servicio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                URL del Servidor Contable
              </label>
              <input
                type="text"
                name="url_api_contable"
                value={formData.url_api_contable}
                onChange={handleChange}
                placeholder="http://127.0.0.1:8000 o https://conta.demiempresa.online"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                API Key de la Empresa (X-API-Key)
              </label>
              <input
                type="password"
                name="api_key_empresa"
                value={formData.api_key_empresa}
                onChange={handleChange}
                placeholder="Generada en Contabilidad -> Configuración -> API Keys"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={cargarCatalogoRemoto}
              disabled={cargandoCatalogo}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors border border-indigo-200"
            >
              <RefreshCw className={`w-4 h-4 ${cargandoCatalogo ? 'animate-spin' : ''}`} />
              Probador de Conexión / Cargar Catálogo Contable
            </button>
          </div>
        </div>

        {/* Card Mapeo de Cuentas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            2. Mapeo de Cuentas Contables por Defecto
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Ingresa los códigos de cuenta según el Catálogo de tu Empresa en el sistema contable.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Caja General (Efectivo)</label>
              <input
                type="text"
                name="cuenta_caja_general"
                value={formData.cuenta_caja_general}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 110101"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bancos / Transferencias</label>
              <input
                type="text"
                name="cuenta_bancos"
                value={formData.cuenta_bancos}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 110201"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Débito Fiscal IVA (13%)</label>
              <input
                type="text"
                name="cuenta_iva_debito"
                value={formData.cuenta_iva_debito}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 210201"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Crédito Fiscal IVA (Compras)</label>
              <input
                type="text"
                name="cuenta_iva_credito"
                value={formData.cuenta_iva_credito}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 110601"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cuentas por Cobrar Clientes</label>
              <input
                type="text"
                name="cuenta_cxc_clientes"
                value={formData.cuenta_cxc_clientes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 110301"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cuentas por Pagar Proveedores</label>
              <input
                type="text"
                name="cuenta_cxp_proveedores"
                value={formData.cuenta_cxp_proveedores}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 210101"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ventas Consumidor Final</label>
              <input
                type="text"
                name="cuenta_ventas_cf"
                value={formData.cuenta_ventas_cf}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 410101"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ventas Crédito Fiscal (CCF)</label>
              <input
                type="text"
                name="cuenta_ventas_ccf"
                value={formData.cuenta_ventas_ccf}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 410102"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inventario de Mercaderías</label>
              <input
                type="text"
                name="cuenta_inventario"
                value={formData.cuenta_inventario}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 110501"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Costo de Ventas</label>
              <input
                type="text"
                name="cuenta_costo_ventas"
                value={formData.cuenta_costo_ventas}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                placeholder="Ej: 510101"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Configuración Contable'}
          </button>
        </div>
      </form>
    </div>
  );
}
