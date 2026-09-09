import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, DollarSign, Plus, CheckCircle, Clock, AlertCircle, Lock, Percent, History, Calculator, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

export default function PagoPrestamos() {
  const [acreedores, setAcreedores] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState('');
  
  const [detallePrestamo, setDetallePrestamo] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [cargandoTabla, setCargandoTabla] = useState(false);

  // Modales
  const [modalNuevoPrestamo, setModalNuevoPrestamo] = useState(false);
  const [formPrestamo, setFormPrestamo] = useState({
    acreedor_id: '', monto_prestamo: '', tasa_interes_anual: 12.0, plazo_meses: 12, tipo_amortizacion: 'saldos_frances', fecha_desembolso: '', notas: ''
  });

  const [modalPagoCuota, setModalPagoCuota] = useState(false);
  const [cuotaAPagar, setCuotaAPagar] = useState(null);
  const [formPago, setFormPago] = useState({
    metodo_pago: 'efectivo', referencia: '', notas: ''
  });

  const [guardando, setGuardando] = useState(false);

  const cargarDatosIniciales = async () => {
    try {
      const [resAc, resPr] = await Promise.all([
        api.get(`/api/v1/finanzas/acreedores/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/finanzas/acreedores/prestamos?empresa_id=${empresaId()}`)
      ]);
      setAcreedores(resAc.data);
      setPrestamos(resPr.data);

      if (resPr.data.length > 0 && !prestamoSeleccionadoId) {
        setPrestamoSeleccionadoId(resPr.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarTablaAmortizacion = async (prestamoId) => {
    if (!prestamoId) return;
    setCargandoTabla(true);
    try {
      const res = await api.get(`/api/v1/finanzas/acreedores/prestamos/${prestamoId}/tabla?empresa_id=${empresaId()}`);
      setDetallePrestamo(res.data.prestamo);
      setCuotas(res.data.cuotas);
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoTabla(false);
    }
  };

  useEffect(() => {
    if (prestamoSeleccionadoId) {
      cargarTablaAmortizacion(prestamoSeleccionadoId);
    }
  }, [prestamoSeleccionadoId]);

  const abrirModalNuevoPrestamo = () => {
    setFormPrestamo({
      acreedor_id: acreedores.length > 0 ? acreedores[0].id : '',
      monto_prestamo: '',
      tasa_interes_anual: 12.0,
      plazo_meses: 12,
      tipo_amortizacion: 'saldos_frances',
      fecha_desembolso: new Date().toISOString().split('T')[0],
      notas: ''
    });
    setModalNuevoPrestamo(true);
  };

  const crearPrestamo = async () => {
    if (!formPrestamo.acreedor_id) return alert('Seleccione un acreedor');
    if (!formPrestamo.monto_prestamo || parseFloat(formPrestamo.monto_prestamo) <= 0) return alert('Ingrese un monto válido');
    if (!formPrestamo.plazo_meses || parseInt(formPrestamo.plazo_meses) <= 0) return alert('Ingrese un plazo válido en meses');

    setGuardando(true);
    try {
      const payload = {
        acreedor_id: parseInt(formPrestamo.acreedor_id),
        monto_prestamo: Math.round(parseFloat(formPrestamo.monto_prestamo) * 100),
        tasa_interes_anual: parseFloat(formPrestamo.tasa_interes_anual || 0),
        plazo_meses: parseInt(formPrestamo.plazo_meses),
        tipo_amortizacion: formPrestamo.tipo_amortizacion,
        fecha_desembolso: formPrestamo.fecha_desembolso || null,
        notas: formPrestamo.notas
      };

      const res = await api.post(`/api/v1/finanzas/acreedores/prestamos?empresa_id=${empresaId()}&usuario_id=1`, payload);
      setModalNuevoPrestamo(false);
      await cargarDatosIniciales();
      setPrestamoSeleccionadoId(res.data.id);
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Préstamo registrado y tabla de amortizaciones generada con éxito." }}));
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al crear préstamo');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalPagoCuota = (cuota) => {
    setCuotaAPagar(cuota);
    setFormPago({ metodo_pago: 'efectivo', referencia: '', notas: '' });
    setModalPagoCuota(true);
  };

  const ejecutarPagoCuota = async () => {
    setGuardando(true);
    try {
      const payload = {
        metodo_pago: formPago.metodo_pago,
        referencia: formPago.referencia,
        notas: formPago.notas
      };
      await api.post(
        `/api/v1/finanzas/acreedores/prestamos/${detallePrestamo.id}/pagar-cuota/${cuotaAPagar.numero_cuota}?empresa_id=${empresaId()}&usuario_id=1`,
        payload
      );
      setModalPagoCuota(false);
      await cargarTablaAmortizacion(detallePrestamo.id);
      await cargarDatosIniciales();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: `Cuota #${cuotaAPagar.numero_cuota} pagada y egreso de caja registrado automáticamente.` }}));
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al pagar cuota');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" /> Control y Pago de Préstamos
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de amortizaciones teóricas vs. reales con pagos correlativos y desembolsos automáticos en caja</p>
        </div>
        <button onClick={abrirModalNuevoPrestamo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
          <Plus className="w-4 h-4" /> Nuevo Préstamo
        </button>
      </div>

      {/* SELECTOR DE PRÉSTAMO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-8">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seleccionar Préstamo Activo</label>
        <select
          value={prestamoSeleccionadoId}
          onChange={(e) => setPrestamoSeleccionadoId(e.target.value)}
          className="w-full md:w-1/2 p-3 border rounded-xl outline-none font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:border-indigo-500 text-sm"
        >
          {prestamos.length === 0 ? (
            <option value="">No hay préstamos registrados</option>
          ) : (
            prestamos.map((p) => (
              <option key={p.id} value={p.id}>
                Préstamo #{p.id} - {p.acreedor_nombre} | {fmt(p.monto_prestamo)} ({p.tipo_amortizacion === 'saldos_frances' ? 'Francés sobre Saldos' : 'Interés Simple'})
              </option>
            ))
          )}
        </select>
      </div>

      {/* RESUMEN DEL PRÉSTAMO SELECCIONADO */}
      {detallePrestamo && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 mb-8 shadow-md grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-indigo-300 font-medium">Acreedor / Prestamista</div>
            <div className="text-lg font-bold truncate">{detallePrestamo.acreedor_nombre}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {detallePrestamo.tipo_amortizacion === 'saldos_frances' ? 'Intereses sobre Saldos (Francés)' : 'Interés Simple (Flat)'}
            </div>
          </div>
          <div>
            <div className="text-xs text-indigo-300 font-medium">Monto Original / Tasa / Plazo</div>
            <div className="text-lg font-bold">{fmt(detallePrestamo.monto_prestamo)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{detallePrestamo.tasa_interes_anual}% Anual — {detallePrestamo.plazo_meses} Meses</div>
          </div>
          <div>
            <div className="text-xs text-indigo-300 font-medium">Saldo Pendiente Restante</div>
            <div className="text-xl font-black text-amber-400">{fmt(detallePrestamo.saldo_pendiente)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Estado: <span className="uppercase font-semibold text-white">{detallePrestamo.estado}</span></div>
          </div>
          <div>
            <div className="text-xs text-indigo-300 font-medium">Próxima Cuota Habilitada</div>
            <div className="text-xl font-bold text-emerald-400">
              {detallePrestamo.siguiente_cuota_num ? `Cuota #${detallePrestamo.siguiente_cuota_num}` : 'Totalmente Liquidado'}
            </div>
          </div>
        </div>
      )}

      {/* TABLA DE AMORTIZACIÓN TEÓRICA VS REAL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" /> Tabla de Amortización Teórica y Registro Real de Pagos
          </h3>
          <span className="text-xs text-slate-400 font-medium">* Regla: Las cuotas deben pagarse en orden correlativo estricto</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Nº Cuota</th>
                <th className="py-3 px-4">Vencimiento Teórico</th>
                <th className="py-3 px-4 text-right">Abono Capital</th>
                <th className="py-3 px-4 text-right">Pago Interés</th>
                <th className="py-3 px-4 text-right">Cuota Total Teórica</th>
                <th className="py-3 px-4 text-right">Saldo Proyectado</th>
                <th className="py-3 px-4 text-center">Estado / Pago Real</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cargandoTabla ? (
                <tr><td colSpan="8" className="text-center py-12 text-slate-400">Cargando tabla de amortización...</td></tr>
              ) : cuotas.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-slate-400">Seleccione un préstamo para ver su tabla de amortización</td></tr>
              ) : (
                cuotas.map((c) => {
                  const esPagada = c.estado === 'pagado';
                  const esSiguiente = c.es_siguiente_a_pagar;

                  return (
                    <tr key={c.id} className={`transition-colors ${esPagada ? 'bg-emerald-50/20' : esSiguiente ? 'bg-indigo-50/30 font-medium' : 'hover:bg-slate-50/50'}`}>
                      <td className="py-3 px-4 font-bold text-slate-800">Cuota #{c.numero_cuota}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(c.fecha_vencimiento).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">{fmt(c.monto_capital_teorico)}</td>
                      <td className="py-3 px-4 text-right font-medium text-indigo-600">{fmt(c.monto_interes_teorico)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{fmt(c.monto_cuota_teorica)}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500">{fmt(c.saldo_teorico)}</td>
                      <td className="py-3 px-4 text-center">
                        {esPagada ? (
                          <div className="flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> PAGADA
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {c.fecha_pago_real ? new Date(c.fecha_pago_real).toLocaleDateString() : ''} ({c.metodo_pago})
                            </span>
                          </div>
                        ) : esSiguiente ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 inline-block">
                            <Clock className="w-3 h-3" /> HABILITADA PARA PAGO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400 flex items-center gap-1 justify-center inline-flex">
                            <Lock className="w-3 h-3" /> BLOQUEADA
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {esPagada ? (
                          <span className="text-xs text-emerald-600 font-semibold">Completado</span>
                        ) : esSiguiente ? (
                          <button
                            onClick={() => abrirModalPagoCuota(c)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1 mx-auto"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pagar Cuota
                          </button>
                        ) : (
                          <button
                            disabled
                            title="Debe pagar las cuotas anteriores primero"
                            className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed mx-auto flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3" /> Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO PRÉSTAMO */}
      {modalNuevoPrestamo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Registrar Nuevo Préstamo y Generar Amortizaciones</h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Acreedor / Prestamista *</label>
                <select
                  value={formPrestamo.acreedor_id}
                  onChange={(e) => setFormPrestamo({ ...formPrestamo, acreedor_id: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">Seleccione Acreedor...</option>
                  {acreedores.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} (Tasa: {a.tasa_interes_anual}%)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto del Préstamo ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrestamo.monto_prestamo}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, monto_prestamo: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-bold"
                    placeholder="1000.00"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tasa Interés Anual (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formPrestamo.tasa_interes_anual}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, tasa_interes_anual: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-semibold"
                    placeholder="12.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plazo en Meses *</label>
                  <input
                    type="number"
                    value={formPrestamo.plazo_meses}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, plazo_meses: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Desembolso</label>
                  <input
                    type="date"
                    value={formPrestamo.fecha_desembolso}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, fecha_desembolso: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Sistema de Amortización *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer flex flex-col transition-all ${formPrestamo.tipo_amortizacion === 'saldos_frances' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <input
                        type="radio"
                        name="tipo_amort"
                        value="saldos_frances"
                        checked={formPrestamo.tipo_amortizacion === 'saldos_frances'}
                        onChange={(e) => setFormPrestamo({ ...formPrestamo, tipo_amortizacion: e.target.value })}
                      />
                      Intereses s/ Saldos
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Cuota fija (Sistema Francés). Interés sobre saldo deudor.</span>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex flex-col transition-all ${formPrestamo.tipo_amortizacion === 'interes_simple' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <input
                        type="radio"
                        name="tipo_amort"
                        value="interes_simple"
                        checked={formPrestamo.tipo_amortizacion === 'interes_simple'}
                        onChange={(e) => setFormPrestamo({ ...formPrestamo, tipo_amortizacion: e.target.value })}
                      />
                      Interés Simple
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Interés global dividido equitativamente en cuotas.</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={formPrestamo.notas}
                  onChange={(e) => setFormPrestamo({ ...formPrestamo, notas: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  placeholder="Detalles sobre el contrato o transferencia"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setModalNuevoPrestamo(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium">Cancelar</button>
              <button onClick={crearPrestamo} disabled={guardando} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm">
                {guardando ? 'Generando...' : 'Generar Préstamo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGAR CUOTA */}
      {modalPagoCuota && cuotaAPagar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Pagar Cuota #{cuotaAPagar.numero_cuota} del Préstamo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Se registrará automáticamente el Egreso en la Caja Abierta</p>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Abono a Capital:</span>
                  <span className="font-semibold text-slate-800">{fmt(cuotaAPagar.monto_capital_teorico)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Pago de Interés:</span>
                  <span className="font-semibold text-indigo-600">{fmt(cuotaAPagar.monto_interes_teorico)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Cuota a Pagar:</span>
                  <span className="text-emerald-600 text-base">{fmt(cuotaAPagar.monto_cuota_teorica)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Método de Pago *</label>
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500 bg-white font-medium"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nº Comprobante / Referencia</label>
                <input
                  type="text"
                  value={formPago.referencia}
                  onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  placeholder="Ej. N° Transferencia 987654"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas del Pago</label>
                <input
                  type="text"
                  value={formPago.notas}
                  onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setModalPagoCuota(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium">Cancelar</button>
              <button onClick={ejecutarPagoCuota} disabled={guardando} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> {guardando ? 'Procesando...' : 'Confirmar y Pagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
