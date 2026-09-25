import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Calendar, RefreshCw, 
  CheckCircle2, DollarSign, Calculator, AlertCircle, Building2, ShoppingBag, Receipt, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const MESES = [
  { num: 1, nombre: 'Enero' },
  { num: 2, nombre: 'Febrero' },
  { num: 3, nombre: 'Marzo' },
  { num: 4, nombre: 'Abril' },
  { num: 5, nombre: 'Mayo' },
  { num: 6, nombre: 'Junio' },
  { num: 7, nombre: 'Julio' },
  { num: 8, nombre: 'Agosto' },
  { num: 9, nombre: 'Septiembre' },
  { num: 10, nombre: 'Octubre' },
  { num: 11, nombre: 'Noviembre' },
  { num: 12, nombre: 'Diciembre' }
];

export default function LibrosIVAPage() {
  const currentDate = new Date();
  const [mes, setMes] = useState(currentDate.getMonth() + 1);
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState('f07'); // 'f07', 'cf', 'ccf', 'compras'
  
  const [loading, setLoading] = useState(false);
  const [dataCF, setDataCF] = useState(null);
  const [dataCCF, setDataCCF] = useState(null);
  const [dataCompras, setDataCompras] = useState(null);
  const [dataF07, setDataF07] = useState(null);
  const [error, setError] = useState(null);

  const empresaId = localStorage.getItem('empresa_id') || '1';

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resCF, resCCF, resCompras, resF07] = await Promise.all([
        api.get(`/api/v1/libros-iva/ventas-consumidor-final?empresa_id=${empresaId}&anio=${anio}&mes=${mes}`),
        api.get(`/api/v1/libros-iva/ventas-contribuyentes?empresa_id=${empresaId}&anio=${anio}&mes=${mes}`),
        api.get(`/api/v1/libros-iva/compras?empresa_id=${empresaId}&anio=${anio}&mes=${mes}`),
        api.get(`/api/v1/libros-iva/resumen-f07?empresa_id=${empresaId}&anio=${anio}&mes=${mes}`)
      ]);

      setDataCF(resCF.data);
      setDataCCF(resCCF.data);
      setDataCompras(resCompras.data);
      setDataF07(resF07.data);
    } catch (err) {
      console.error('Error cargando Libros de IVA:', err);
      setError('No se pudieron obtener los datos tributarios del periodo seleccionado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [mes, anio]);

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = (rows, headers, filename) => {
    if (!rows || rows.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${anio}_${mes}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarCSVConsumidorFinal = () => {
    if (!dataCF || !dataCF.lineas) return;
    const headers = ["Item", "Fecha", "Del Numero", "Al Numero", "Docs Emitidos", "Ventas Gravadas ($)", "Debito Fiscal ($)", "Total Dia ($)"];
    const rows = dataCF.lineas.map(l => [
      l.item,
      l.fecha,
      `"${l.del_numero}"`,
      `"${l.al_numero}"`,
      l.cantidad_docs,
      l.ventas_gravadas_locales.toFixed(2),
      l.debito_fiscal.toFixed(2),
      l.total_ventas_dia.toFixed(2)
    ]);
    exportToCSV(rows, headers, "Libro_Ventas_Consumidor_Final");
  };

  const descargarCSVContribuyentes = () => {
    if (!dataCCF || !dataCCF.lineas) return;
    const headers = ["Item", "Fecha", "No. Doc", "Cliente", "NIT/NRC", "Ventas Gravadas ($)", "Debito Fiscal ($)", "Total Venta ($)"];
    const rows = dataCCF.lineas.map(l => [
      l.item,
      l.fecha,
      `"${l.numero_doc}"`,
      `"${l.cliente_nombre}"`,
      `"${l.cliente_nit}"`,
      l.ventas_gravadas_locales.toFixed(2),
      l.debito_fiscal.toFixed(2),
      l.total_venta.toFixed(2)
    ]);
    exportToCSV(rows, headers, "Libro_Ventas_Contribuyentes_CCF");
  };

  const descargarCSVCompras = () => {
    if (!dataCompras || !dataCompras.lineas) return;
    const headers = ["Item", "Fecha", "No. Doc", "Proveedor", "NIT/NRC", "Compras Gravadas ($)", "Credito Fiscal ($)", "Total Compra ($)"];
    const rows = dataCompras.lineas.map(l => [
      l.item,
      l.fecha,
      `"${l.numero_doc}"`,
      `"${l.proveedor_nombre}"`,
      `"${l.proveedor_nit}"`,
      l.compras_gravadas_locales.toFixed(2),
      l.credito_fiscal.toFixed(2),
      l.total_compra.toFixed(2)
    ]);
    exportToCSV(rows, headers, "Libro_Compras");
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  const nombreMesActual = MESES.find(m => m.num === parseInt(mes))?.nombre || '';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto print:p-0">
      {/* Header Interactivo */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Módulo Legal Tributario — El Salvador (Art. 141 C.T.)</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-400" />
            Libros IVA & Resumen Declaración F-07
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Generación automática de Libros Legales de IVA y Pre-cálculo oficial de Pago a Cuenta (1.75%) y Débito/Crédito Fiscal.
          </p>
        </div>

        {/* Seleccionador de Periodo */}
        <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>Periodo:</span>
          </div>
          
          <select 
            value={mes} 
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none"
          >
            {MESES.map((m) => (
              <option key={m.num} value={m.num}>{m.nombre}</option>
            ))}
          </select>

          <input 
            type="number"
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            className="w-20 bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none text-center"
            min="2020"
            max="2035"
          />

          <button
            onClick={cargarDatos}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Recargar datos tributarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Titular en caso de Impresión */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase">{localStorage.getItem('empresa_nombre') || 'Mi Empresa'}</h1>
        <h2 className="text-md font-semibold text-slate-700">INFORME TRIBUTARIO — {nombreMesActual.toUpperCase()} {anio}</h2>
        <p className="text-xs text-slate-500">Generado el {currentDate.toLocaleDateString()}</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pestañas de Navegación */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('f07')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'f07'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Resumen F-07 & Liquidez</span>
        </button>

        <button
          onClick={() => setActiveTab('cf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'cf'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ventas Consumidor Final</span>
          {dataCF && (
            <span className="ml-1 bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {dataCF.total_documentos}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ccf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'ccf'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Ventas Contribuyentes (CCF)</span>
          {dataCCF && (
            <span className="ml-1 bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {dataCCF.total_documentos}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('compras')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'compras'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Libro de Compras</span>
          {dataCompras && (
            <span className="ml-1 bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {dataCompras.total_documentos}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: RESUMEN F-07 */}
      {activeTab === 'f07' && dataF07 && (
        <div className="space-y-6">
          {/* Cards Principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-indigo-100">
                <DollarSign className="w-16 h-16 transform translate-x-4 -translate-y-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Ventas Netas Totales</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {formatMoney(dataF07.pago_a_cuenta.base_imponible_ventas_netas)}
              </p>
              <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                <span>CF + CCF (Sin IVA)</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-amber-100">
                <Receipt className="w-16 h-16 transform translate-x-4 -translate-y-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">Débito Fiscal (IVA 13%)</span>
              <p className="text-2xl font-black text-amber-700 mt-1">
                {formatMoney(dataF07.debito_fiscal.total_debito_fiscal)}
              </p>
              <div className="mt-2 text-[10px] text-amber-800 font-semibold">
                Facturas emitidas
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-emerald-100">
                <ShoppingBag className="w-16 h-16 transform translate-x-4 -translate-y-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">Crédito Fiscal (Compras)</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {formatMoney(dataF07.credito_fiscal.total_credito_fiscal)}
              </p>
              <div className="mt-2 text-[10px] text-emerald-800 font-semibold">
                Deducible en compras
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
              <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider">Total Estimado F-07</span>
              <p className="text-2xl font-black text-white mt-1">
                {formatMoney(dataF07.total_estimado_declaracion_f07)}
              </p>
              <div className="mt-2 text-[10px] text-indigo-200 font-semibold">
                IVA a Pagar + Pago a Cuenta (1.75%)
              </div>
            </div>
          </div>

          {/* Cuadro Detallado Estilo Ministerio de Hacienda (F-07) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-4 font-bold text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                Cuadro Resumen para Declaración F-07 — {nombreMesActual} {anio}
              </span>
              <span className="text-xs bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                Pre-Cálculo
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sección 1: IVA (Débito vs Crédito) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-900 tracking-wider border-b pb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  1. Liquidación de Impuesto a la Transferencia de Bienes (IVA)
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Débito Ventas Consumidor Final:</span>
                    <span className="font-bold text-slate-800">{formatMoney(dataF07.debito_fiscal.ventas_consumidor_final)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Débito Ventas Contribuyentes (CCF):</span>
                    <span className="font-bold text-slate-800">{formatMoney(dataF07.debito_fiscal.ventas_credito_fiscal_ccf)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-indigo-50/50 px-2 rounded-lg text-indigo-950 font-extrabold">
                    <span>(=) Total Débito Fiscal del Mes:</span>
                    <span>{formatMoney(dataF07.debito_fiscal.total_debito_fiscal)}</span>
                  </div>

                  <div className="pt-2" />

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">(-) Crédito Fiscal por Compras Locales:</span>
                    <span className="font-bold text-emerald-700">{formatMoney(dataF07.credito_fiscal.total_credito_fiscal)}</span>
                  </div>

                  <div className="flex justify-between py-2 bg-slate-900 text-white px-3 rounded-xl font-black text-sm mt-3">
                    <span>
                      {dataF07.liquidacion_iva.impuesto_iva_a_pagar > 0 
                        ? '(=) IMPUESTO IVA A PAGAR:' 
                        : '(=) SALDO A FAVOR DE IVA:'}
                    </span>
                    <span className={dataF07.liquidacion_iva.impuesto_iva_a_pagar > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {dataF07.liquidacion_iva.impuesto_iva_a_pagar > 0 
                        ? formatMoney(dataF07.liquidacion_iva.impuesto_iva_a_pagar)
                        : formatMoney(dataF07.liquidacion_iva.saldo_a_favor_remisibles)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección 2: Pago a Cuenta (1.75%) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-900 tracking-wider border-b pb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  2. Pago a Cuenta del Impuesto sobre la Renta (1.75%)
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Base Imponible (Ingresos Netos Gravados):</span>
                    <span className="font-bold text-slate-800">{formatMoney(dataF07.pago_a_cuenta.base_imponible_ventas_netas)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Tasa Retención / Anticipo Legal:</span>
                    <span className="font-bold text-indigo-600">1.75%</span>
                  </div>

                  <div className="flex justify-between py-2 bg-indigo-950 text-white px-3 rounded-xl font-black text-sm mt-3">
                    <span>(=) MONTO PAGO A CUENTA:</span>
                    <span className="text-amber-300">{formatMoney(dataF07.pago_a_cuenta.monto_pago_a_cuenta)}</span>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 mt-4 leading-relaxed">
                    <p className="font-bold mb-1">📌 Nota Tributaria:</p>
                    El Pago a Cuenta es un anticipo del Impuesto sobre la Renta exigible mensualmente junto con la declaración del F-07. 
                    El valor calculado aquí es 100% acreditable en tu Declaración Anual F-11.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: LIBRO DE VENTAS CONSUMIDOR FINAL */}
      {activeTab === 'cf' && dataCF && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                Libro de Ventas a Consumidor Final — {nombreMesActual} {anio}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Consolidado diario de Facturas y Tickets emitidos a consumidores finales.
              </p>
            </div>

            <button
              onClick={descargarCSVConsumidorFinal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b">
                  <th className="p-3">#</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Del No.</th>
                  <th className="p-3">Al No.</th>
                  <th className="p-3 text-center">Cant. Docs</th>
                  <th className="p-3 text-right">Ventas Gravadas ($)</th>
                  <th className="p-3 text-right">Débito Fiscal ($)</th>
                  <th className="p-3 text-right">Total Día ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataCF.lineas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                      No hay registros de Ventas a Consumidor Final en este periodo.
                    </td>
                  </tr>
                ) : (
                  dataCF.lineas.map((l) => (
                    <tr key={l.item} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-400">{l.item}</td>
                      <td className="p-3 font-semibold text-slate-800">{l.fecha}</td>
                      <td className="p-3 font-mono text-indigo-600 font-bold">{l.del_numero}</td>
                      <td className="p-3 font-mono text-indigo-600 font-bold">{l.al_numero}</td>
                      <td className="p-3 text-center font-bold">{l.cantidad_docs}</td>
                      <td className="p-3 text-right font-semibold">{formatMoney(l.ventas_gravadas_locales)}</td>
                      <td className="p-3 text-right font-semibold text-amber-700">{formatMoney(l.debito_fiscal)}</td>
                      <td className="p-3 text-right font-black text-slate-900">{formatMoney(l.total_ventas_dia)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {dataCF.lineas.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black">
                    <td colSpan="5" className="p-3 uppercase tracking-wider text-[11px]">Totales del Mes:</td>
                    <td className="p-3 text-right">{formatMoney(dataCF.resumen_totales.total_ventas_netas)}</td>
                    <td className="p-3 text-right text-amber-300">{formatMoney(dataCF.resumen_totales.total_debito_fiscal)}</td>
                    <td className="p-3 text-right text-amber-400 text-sm">{formatMoney(dataCF.resumen_totales.total_general_ventas)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO 3: LIBRO DE VENTAS CONTRIBUYENTES (CCF) */}
      {activeTab === 'ccf' && dataCCF && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Libro de Ventas a Contribuyentes (CCF) — {nombreMesActual} {anio}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Detalle individual de Comprobantes de Crédito Fiscal emitidos.
              </p>
            </div>

            <button
              onClick={descargarCSVContribuyentes}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b">
                  <th className="p-3">#</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">No. CCF</th>
                  <th className="p-3">Nombre Cliente</th>
                  <th className="p-3">NIT / NRC</th>
                  <th className="p-3 text-right">Ventas Gravadas ($)</th>
                  <th className="p-3 text-right">Débito Fiscal ($)</th>
                  <th className="p-3 text-right">Total Venta ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataCCF.lineas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                      No hay registros de Crédito Fiscal (CCF) en este periodo.
                    </td>
                  </tr>
                ) : (
                  dataCCF.lineas.map((l) => (
                    <tr key={l.item} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-400">{l.item}</td>
                      <td className="p-3 font-semibold text-slate-800">{l.fecha}</td>
                      <td className="p-3 font-mono text-indigo-600 font-bold">{l.numero_doc}</td>
                      <td className="p-3 font-bold text-slate-800">{l.cliente_nombre}</td>
                      <td className="p-3 font-mono text-slate-500">{l.cliente_nit}</td>
                      <td className="p-3 text-right font-semibold">{formatMoney(l.ventas_gravadas_locales)}</td>
                      <td className="p-3 text-right font-semibold text-amber-700">{formatMoney(l.debito_fiscal)}</td>
                      <td className="p-3 text-right font-black text-slate-900">{formatMoney(l.total_venta)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {dataCCF.lineas.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black">
                    <td colSpan="5" className="p-3 uppercase tracking-wider text-[11px]">Totales CCF del Mes:</td>
                    <td className="p-3 text-right">{formatMoney(dataCCF.resumen_totales.total_ventas_gravadas)}</td>
                    <td className="p-3 text-right text-amber-300">{formatMoney(dataCCF.resumen_totales.total_debito_fiscal)}</td>
                    <td className="p-3 text-right text-amber-400 text-sm">{formatMoney(dataCCF.resumen_totales.total_general_ccf)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO 4: LIBRO DE COMPRAS */}
      {activeTab === 'compras' && dataCompras && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                Libro de Compras — {nombreMesActual} {anio}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Detalle individual de Comprobantes de Crédito Fiscal recibidos de Proveedores.
              </p>
            </div>

            <button
              onClick={descargarCSVCompras}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b">
                  <th className="p-3">#</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">No. Doc / CCF</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">NIT / NRC</th>
                  <th className="p-3 text-right">Compras Gravadas ($)</th>
                  <th className="p-3 text-right">Crédito Fiscal ($)</th>
                  <th className="p-3 text-right">Total Compra ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataCompras.lineas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                      No hay registros de Compras en este periodo.
                    </td>
                  </tr>
                ) : (
                  dataCompras.lineas.map((l) => (
                    <tr key={l.item} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-400">{l.item}</td>
                      <td className="p-3 font-semibold text-slate-800">{l.fecha}</td>
                      <td className="p-3 font-mono text-indigo-600 font-bold">{l.numero_doc}</td>
                      <td className="p-3 font-bold text-slate-800">{l.proveedor_nombre}</td>
                      <td className="p-3 font-mono text-slate-500">{l.proveedor_nit}</td>
                      <td className="p-3 text-right font-semibold">{formatMoney(l.compras_gravadas_locales)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600">{formatMoney(l.credito_fiscal)}</td>
                      <td className="p-3 text-right font-black text-slate-900">{formatMoney(l.total_compra)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {dataCompras.lineas.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black">
                    <td colSpan="5" className="p-3 uppercase tracking-wider text-[11px]">Totales Compras del Mes:</td>
                    <td className="p-3 text-right">{formatMoney(dataCompras.resumen_totales.total_compras_gravadas)}</td>
                    <td className="p-3 text-right text-emerald-400">{formatMoney(dataCompras.resumen_totales.total_credito_fiscal)}</td>
                    <td className="p-3 text-right text-amber-400 text-sm">{formatMoney(dataCompras.resumen_totales.total_general_compras)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
