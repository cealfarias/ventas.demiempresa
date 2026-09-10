import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Plus, Search, FileText, CheckCircle2, DollarSign, XCircle, FileOutput, Lock, Wallet, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

// Componente de búsqueda inteligente
const SearchableSelect = ({ value, options, onChange, placeholder = "Buscar...", className="w-full px-3 py-2 border rounded-xl", autoFocus = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = React.useRef(null);
  React.useEffect(() => { if (autoFocus) setOpen(true); }, [autoFocus]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      <div 
        className={`${className} bg-white cursor-pointer flex justify-between items-center text-sm`}
        onClick={() => { setOpen(!open); setSearch(""); }}
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-400 truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-slate-400 text-xs shrink-0 ml-2">▼</span>
      </div>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b">
            <input 
              type="text" 
              autoFocus
              className="w-full px-2 py-1 text-sm border rounded bg-slate-50 focus:outline-none"
              placeholder="Escriba para buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filtered.length === 0 && <div className="p-2 text-xs text-slate-500 text-center">No hay resultados</div>}
            {filtered.map(o => (
              <div 
                key={o.value} 
                className="px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer text-sm rounded flex justify-between items-center gap-2"
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                <span className="truncate font-medium">{o.label}</span>
                {o.subLabel && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-semibold shrink-0 ${o.subLabelColor || 'bg-slate-100 text-slate-600'}`}>
                    {o.subLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;
const fmtStock = (stock) => {
  const n = Number(stock || 0);
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
};

const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.847 0-3.556-.492-5.031-1.353l-.36-.211-3.74.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.444 4.43-9.873 9.878-9.873 2.637 0 5.116 1.028 6.98 2.893 1.864 1.865 2.891 4.344 2.89 6.982 0 5.446-4.43 9.875-9.87 9.875m0-18.066c-4.516 0-8.192 3.676-8.192 8.191 0 1.794.577 3.456 1.554 4.814l-.657 2.4 2.457-.644a8.147 8.147 0 004.838 1.557c4.517 0 8.194-3.676 8.194-8.19 0-2.188-.853-4.246-2.404-5.797-1.55-1.551-3.608-2.405-5.79-2.405" />
  </svg>
);

export default function Facturas() {
  
  useEffect(() => {
    const isFirstTime = localStorage.getItem('avatar_facturas_done') !== 'true';
    if (isFirstTime) {
      localStorage.setItem('avatar_facturas_done', 'true');
      
      window.dispatchEvent(new CustomEvent('avatar:say', {
        detail: {
          text: '¡Estás en la pantalla de Facturas! Aquí se registrarán todas tus ventas.',
          highlightId: 'table-facturas',
          options: []
        }
      }));
      
      setTimeout(() => {
        if (window.location.pathname !== '/facturas') return;
        window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: 'Para generar una nueva factura o comprobante de crédito fiscal, debes hacer clic en el botón "Emitir Factura".',
            highlightId: 'btn-emitir-factura',
            options: []
          }
        }));
      }, 7000);
      
      setTimeout(() => {
        if (window.location.pathname !== '/facturas') return;
        window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: 'Una vez emitida, podrás presionar "Transmitir MH" para enviarla inmediatamente al Ministerio de Hacienda, y el PDF se habilitará cuando sea aprobada.',
            highlightId: null,
            options: [{ label: '¡Entendido!', action: null }]
          }
        }));
      }, 15000);
    }
  }, []);

  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(15);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('lista'); // lista | nueva
  const [editandoId, setEditandoId] = useState(null);
  const [modalVuelto, setModalVuelto] = useState(false);
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [cajaActiva, setCajaActiva] = useState(true);
  const [showModalCajaRequerida, setShowModalCajaRequerida] = useState(false);

  const facturasFiltradas = facturas.filter(f => {
    const term = busqueda.toLowerCase().trim();
    const matchNumero = f.numero ? String(f.numero).toLowerCase().includes(term) : false;
    const matchCliente = f.cliente_nombre ? f.cliente_nombre.toLowerCase().includes(term) : false;
    const matchTipoDoc = f.tipo_doc ? f.tipo_doc.toLowerCase().includes(term) : false;
    
    let matchFechaStr = false;
    if (f.fecha_emision) {
      const fechaObj = new Date(f.fecha_emision);
      const fechaLocalStr = fechaObj.toLocaleString().toLowerCase();
      const fechaIsoStr = fechaObj.toISOString().slice(0, 10);
      matchFechaStr = fechaLocalStr.includes(term) || fechaIsoStr.includes(term);
    }

    const matchesBusqueda = !term || matchNumero || matchCliente || matchTipoDoc || matchFechaStr;

    let matchesFechaPicker = true;
    if (filtroFecha && f.fecha_emision) {
      const fechaIso = new Date(f.fecha_emision).toISOString().slice(0, 10);
      matchesFechaPicker = fechaIso === filtroFecha;
    }

    return matchesBusqueda && matchesFechaPicker;
  });

  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  
  const [form, setForm] = useState({ cliente_id: '', vendedor_id: '', bodega_salida_id: '', tipo_doc: 'FACTURA', condicion_operacion: 'CONTADO', metodo_pago: 'efectivo', dias_credito: 30, items: [] });
  const [guardando, setGuardando] = useState(false);

  const reqIdRef = React.useRef(0);

  const cargar = async (b = busqueda, f = filtroFecha) => {
    const currentReqId = ++reqIdRef.current;
    setCargando(true);
    try {
      let urlFacturas = `/api/v1/facturacion/facturas/?empresa_id=${empresaId()}`;
      if (b) urlFacturas += `&busqueda=${encodeURIComponent(b)}`;
      if (f) urlFacturas += `&fecha=${encodeURIComponent(f)}`;

      const [resF, resC, resP, resB, resCaja, resV] = await Promise.all([
        api.get(urlFacturas),
        api.get(`/api/v1/facturacion/clientes/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/cajas/sesion-activa?empresa_id=${empresaId()}&usuario_id=1`).catch(() => ({ data: { activa: true } })),
        api.get(`/api/v1/logistica/vendedores/?empresa_id=${empresaId()}&solo_activos=true`).catch(() => ({ data: [] }))
      ]);

      if (currentReqId === reqIdRef.current) {
        setFacturas(resF.data);
        setClientes(resC.data);
        setProductos(resP.data);
        setBodegas(resB.data);
        setVendedores(resV.data || []);
        if (resCaja && resCaja.data) {
          setCajaActiva(resCaja.data.activa);
        }
      }
    } catch (e) { console.error(e); }
    finally {
      if (currentReqId === reqIdRef.current) {
        setCargando(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargar(busqueda, filtroFecha);
    }, 250);
    return () => clearTimeout(timer);
  }, [busqueda, filtroFecha]);

  const cambiarBodega = async (bodegaId) => {
    setForm(prev => ({ ...prev, bodega_salida_id: bodegaId }));
    try {
      const url = bodegaId 
        ? `/api/v1/facturacion/productos/?empresa_id=${empresaId()}&bodega_id=${bodegaId}`
        : `/api/v1/facturacion/productos/?empresa_id=${empresaId()}`;
      const resP = await api.get(url);
      setProductos(resP.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { cargar(); }, []);

  const agregarLinea = () => setForm({ ...form, items: [...form.items, { producto_id: '', cantidad: 1, precio_unitario: 0 }] });
  const actualizarLinea = (idx, campo, val) => {
    const nuevos = [...form.items];
    nuevos[idx][campo] = val;
    
    if (campo === 'producto_id') {
      const prod = productos.find(p => String(p.id_producto) === String(val));
      if (prod) {
        let precio = (prod.precio_venta || 0);
        nuevos[idx].precio_unitario = precio.toFixed(4);
      }
    }
    
    setForm({ ...form, items: nuevos });
  };
  const eliminarLinea = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  
  const iniciarEdicion = (fac) => {
    // Populate form with existing data
    setForm({
      cliente_id: fac.cliente_id || '',
      vendedor_id: fac.vendedor_id || '',
      bodega_salida_id: '', // Not strictly tracked in list view, user must reselect if they want to deduct
      tipo_doc: fac.tipo_doc || 'FACTURA',
      condicion_operacion: fac.condicion_operacion || 'CONTADO',
      dias_credito: (fac.dias_credito !== undefined && fac.dias_credito !== null) ? fac.dias_credito : 30,
      entrega_domicilio: false,
      incluye_iva: false,
      fecha_emision: fac.fecha_emision ? (new Date(new Date(fac.fecha_emision).getTime() - new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
      items: fac.items ? fac.items.map(i => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: Number(i.precio_unitario).toFixed(4),
        subtotal: i.subtotal
      })) : []
    });
    setEditandoId(fac.id);
    setVista('nueva');
  };

  
  const intentarGuardar = () => {
    if (!cajaActiva) {
      setShowModalCajaRequerida(true);
      return;
    }
    if (form.condicion_operacion === "CONTADO" && form.metodo_pago === "efectivo") {
      setEfectivoRecibido((total/100).toFixed(2));
      setModalVuelto(true);
    } else {
      guardar();
    }
  };

  const guardar = async () => {
    setModalVuelto(false);

    if (!form.cliente_id) return window.dispatchEvent(new CustomEvent('avatar:say', { detail: { text: 'Seleccione un cliente', options: [{label:'Aceptar', action:null}] }}));
    if (form.items.length === 0) return window.dispatchEvent(new CustomEvent('avatar:say', { detail: { text: 'Agregue al menos un producto', options: [{label:'Aceptar', action:null}] }}));

    const clienteSel = clientes.find(c => String(c.id_cliente) === String(form.cliente_id));
    if (form.condicion_operacion === 'CREDITO' && clienteSel) {
      const limite = clienteSel.limite_credito || 0;
      const saldoAct = clienteSel.saldo_pendiente || 0;
      if (limite <= 0) {
        return window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: `El cliente "${clienteSel.nombre}" no tiene línea de crédito autorizada (Límite: $0.00). Por favor seleccione venta al Contado o asigne un límite de crédito en el módulo de Clientes.`,
            options: [{ label: 'Aceptar', action: null }]
          }
        }));
      }
      if ((saldoAct + total) > limite) {
        return window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: `Límite de crédito excedido para "${clienteSel.nombre}". Límite autorizado: $${(limite/100).toFixed(2)}, Saldo con esta venta: $${((saldoAct + total)/100).toFixed(2)}.`,
            options: [{ label: 'Aceptar', action: null }]
          }
        }));
      }
    }
    
    setGuardando(true);
    try {
      const payload = {
        ...form,
        dias_credito: (form.dias_credito !== undefined && form.dias_credito !== '') ? parseInt(form.dias_credito) : 30,
        vendedor_id: form.vendedor_id ? parseInt(form.vendedor_id) : null,
        bodega_salida_id: form.bodega_salida_id ? parseInt(form.bodega_salida_id) : null,
        subtotal: subtotal,
        iva: iva,
        total: total,
        items: form.items.map(i => ({ 
          ...i, 
          precio_unitario: parseFloat(i.precio_unitario), 
          subtotal: Math.round(i.cantidad * parseFloat(i.precio_unitario) * 100) 
        }))
      };
      if (editandoId) {
        await api.put(`/api/v1/facturacion/facturas/${editandoId}?empresa_id=${empresaId()}&usuario_id=1`, payload);
      } else {
        await api.post(`/api/v1/facturacion/facturas/?empresa_id=${empresaId()}&usuario_id=1`, payload);
      }
      setVista('lista'); setEditandoId(null);
      cargar();
    } catch (e) { 
      const detail = e.response?.data?.detail;
      window.dispatchEvent(new CustomEvent('avatar:say', { detail: { text: typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Error al emitir factura', options: [{label:'Aceptar', action:null}] }})); 
    }
    finally { setGuardando(false); }
  };

  const sumItems = form.items.reduce((acc, i) => acc + (i.cantidad * (parseFloat(i.precio_unitario) || 0) * 100), 0);
  let subtotal = Math.round(sumItems);
  let iva = 0;
  
  if (form.tipo_doc === 'CCF') {
    if (form.incluye_iva) {
      subtotal = Math.round(sumItems / 1.13);
      iva = sumItems - subtotal;
    } else {
      iva = Math.round(subtotal * 0.13);
    }
  }
  const total = Math.round(subtotal + iva);

  if (vista === 'nueva') {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        {modalVuelto && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Pago en Efectivo</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">Total a Pagar:</span>
                  <span className="text-xl font-bold text-indigo-600">${(total/100).toFixed(2)}</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Efectivo Recibido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input 
                      type="number" 
                      min={(total/100).toFixed(2)} 
                      step="any" 
                      value={efectivoRecibido} 
                      onChange={e => setEfectivoRecibido(e.target.value)} 
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      autoFocus
                      onFocus={e => e.target.select()}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Vuelto (Cambio):</span>
                  <span className={`text-xl font-bold ${parseFloat(efectivoRecibido || 0) < total/100 ? "text-red-500" : "text-emerald-500"}`}>
                    ${Math.max(0, parseFloat(efectivoRecibido || 0) - total/100).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalVuelto(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium">Cancelar</button>
                <button 
                  onClick={guardar} 
                  disabled={parseFloat(efectivoRecibido || 0) < total/100 || guardando}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {guardando ? "Cobrando..." : "Cobrar"}
                </button>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-indigo-600" /> {editandoId ? 'Actualizar Factura' : 'Emitir Factura'}
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Cliente *</label>
                <SearchableSelect 
                  value={form.cliente_id}
                  options={[{value: '', label: 'Seleccione...'}, ...clientes.map(c => ({value: c.id_cliente, label: c.nombre}))]}
                  onChange={val => setForm({...form, cliente_id: val})}
                  className="w-full mt-1 px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Vendedor</label>
                <SearchableSelect 
                  value={form.vendedor_id}
                  options={[
                    {value: '', label: '(Sin Vendedor Asignado)'}, 
                    ...vendedores.map(v => ({
                      value: v.id, 
                      label: v.codigo ? `${v.codigo} - ${v.nombre}` : v.nombre,
                      subLabel: v.porcentaje_comision ? `${v.porcentaje_comision}% com.` : null
                    }))
                  ]}
                  onChange={val => setForm({...form, vendedor_id: val})}
                  placeholder="Seleccionar vendedor..."
                  className="w-full mt-1 px-3 py-2 border rounded-xl"
                />
              </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipo Documento DTE</label>
              <select value={form.tipo_doc} onChange={e => setForm({...form, tipo_doc: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                <option value="FACTURA">Factura Consumidor Final</option>
                <option value="CCF">Comprobante de Crédito Fiscal (CCF)</option>
                <option value="EXPORTACION">Factura de Exportación</option>
              </select>
            </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Fecha de Emisión</label>
                <input type="datetime-local" value={form.fecha_emision || ''} onChange={e => setForm({...form, fecha_emision: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Bodega de Salida (Inventario)</label>
                <select value={form.bodega_salida_id} onChange={e => cambiarBodega(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-xl">
                  <option value="">(Sin descontar inventario)</option>
                  {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Condición de Operación</label>
              <select value={form.condicion_operacion} onChange={e => setForm({...form, condicion_operacion: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                <option value="CONTADO">Contado</option>
                <option value="CREDITO">Crédito (Generar CxC)</option>
              </select>
            </div>
          </div>
            {form.condicion_operacion === 'CONTADO' && (
                <div className="w-1/4">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                  <select value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                    <option value="efectivo">Efectivo (Caja)</option>
                    <option value="transferencia">Transferencia (Caja)</option>
                    <option value="tarjeta">Tarjeta (Caja)</option>
                  </select>
                </div>
              )}
            {form.condicion_operacion === 'CREDITO' && (
              <div className="w-1/4">
                <label className="text-xs font-semibold text-slate-500 uppercase">Plazo Crédito (Días)</label>
                <input type="number" value={form.dias_credito} onChange={e => setForm({...form, dias_credito: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" />
              </div>
            )}
            
            <div className="flex gap-6 mt-4 pt-4 border-t w-full col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.entrega_domicilio || false} onChange={e => setForm({...form, entrega_domicilio: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Requerir Entrega a Domicilio (Genera Despacho)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.incluye_iva || false} onChange={e => setForm({...form, incluye_iva: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Los Precios Digitados Incluyen IVA</span>
              </label>
            </div>
          </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
          <h3 className="font-bold text-slate-700 mb-4">Líneas de Venta</h3>
          <table className="w-full text-left mb-4">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b">
                <th className="pb-2">Producto</th>
                <th className="pb-2 w-24">Cantidad</th>
                <th className="pb-2 w-32">Precio (USD)</th>
                <th className="pb-2 w-32 text-right">Subtotal</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2">
                    <SearchableSelect autoFocus={i === form.items.length - 1} value={it.producto_id}
                      options={[{value: '', label: 'Seleccionar...'}, ...productos.map(p => ({
                        value: p.id_producto, 
                        label: p.nombre, 
                        subLabel: `Exist: ${fmtStock(p.stock)}`,
                        subLabelColor: Number(p.stock) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }))]}
                      onChange={val => actualizarLinea(i, 'producto_id', val)}
                      className="w-full px-2 py-1.5 border rounded-lg"
                    />
                  </td>
                  <td className="py-2"><input type="number" min="0.1" step="any" value={it.cantidad} onChange={e => actualizarLinea(i, 'cantidad', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" /></td>
                  <td className="py-2"><input type="number" min="0" step="0.0001" value={it.precio_unitario} onChange={e => actualizarLinea(i, 'precio_unitario', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" /></td>
                  <td className="py-2 text-right text-sm font-medium">${((it.cantidad || 0) * (it.precio_unitario || 0)).toFixed(2)}</td>
                  <td className="py-2 text-right"><button onClick={() => eliminarLinea(i)} className="text-red-400"><XCircle className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={agregarLinea} className="text-sm text-indigo-600 font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar Producto</button>
          
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal:</span> <span>${(subtotal/100).toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>IVA:</span> <span>${(iva/100).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span> <span>${(total/100).toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => { setVista('lista'); setEditandoId(null); }} className="px-6 py-2.5 rounded-xl border font-medium">Cancelar</button>
          <button onClick={intentarGuardar} disabled={guardando || !form.cliente_id || form.items.length === 0} className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
            {guardando ? (editandoId ? 'Actualizando...' : 'Emitiendo...') : (editandoId ? 'Actualizar Factura' : 'Emitir Factura')}
          </button>
        </div>
      </div>
    );
  }

  
  const iniciarNuevaFactura = () => {
    if (!cajaActiva) {
      setShowModalCajaRequerida(true);
      return;
    }
    const clienteDefault = clientes.find(c => c.es_predeterminado);
    setForm({
      cliente_id: clienteDefault ? clienteDefault.id_cliente : "",
      vendedor_id: "",
      bodega_salida_id: "",
      tipo_doc: "FACTURA",
      condicion_operacion: "CONTADO",
      metodo_pago: "efectivo",
      dias_credito: 30,
      items: [{ producto_id: "", cantidad: 1, precio_unitario: 0 }],
      fecha_emision: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
      entrega_domicilio: false,
      incluye_iva: false
    });
    setVista("nueva");
  };

  const anularFactura = async (id) => {
    if (!window.confirm("¿Está seguro de anular esta factura? Esta acción revertirá los saldos y el inventario, y no se puede deshacer.")) return;
    try {
      await api.put(`/api/v1/facturacion/facturas/${id}/anular?empresa_id=${empresaId()}&usuario_id=1`);
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Factura anulada exitosamente.", options: [{label:"Aceptar", action:null}] }}));
      cargar();
    } catch (e) {
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: e.response?.data?.detail || "Error al anular la factura", options: [{label:"Aceptar", action:null}] }}));
    }
  };

  const transmitirMH = async (id) => {
    try {
      await api.post(`/api/v1/facturacion/dte/transmitir/${id}?empresa_id=${empresaId()}`);
      window.dispatchEvent(new CustomEvent('avatar:say', { detail: { text: 'DTE transmitido y aceptado exitosamente por el MH.', options: [{label:'Aceptar', action:null}] }}));
      cargar();
    } catch (e) {
      window.dispatchEvent(new CustomEvent('avatar:say', { detail: { text: e.response?.data?.detail || 'Error al transmitir DTE al Ministerio de Hacienda', options: [{label:'Aceptar', action:null}] }}));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {!cajaActiva && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Turno de Caja Inactivo</h4>
              <p className="text-xs text-amber-700 mt-0.5">Se requiere la apertura previa de su turno de caja para proceder con la facturación y cobranza.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/cajas')} 
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
          >
            <Wallet className="w-4 h-4" /> Aperturar Caja
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Receipt className="w-6 h-6 text-indigo-600" /> Facturas DTE</h1>
          <p className="text-sm text-slate-500 mt-1">Historial de ventas y documentos tributarios</p>
        </div>
        <button id="btn-emitir-factura" onClick={iniciarNuevaFactura} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 relative z-0">
          <Plus className="w-4 h-4" /> Emitir Factura
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA INTELIGENTE Y FILTRO DE FECHA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            placeholder="Buscar por número de factura, cliente o fecha..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          {busqueda && (
            <button
              onClick={() => { setBusqueda(''); setPaginaActual(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center"
              title="Limpiar búsqueda"
            >
              &times;
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            <span className="text-xs font-semibold text-slate-500 mr-2 uppercase shrink-0">Fecha:</span>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => { setFiltroFecha(e.target.value); setPaginaActual(1); }}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            />
            {filtroFecha && (
              <button
                onClick={() => { setFiltroFecha(''); setPaginaActual(1); }}
                className="ml-2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-4 h-4 flex items-center justify-center shrink-0"
                title="Limpiar fecha"
              >
                &times;
              </button>
            )}
          </div>

          {(busqueda || filtroFecha) && (
            <button
              onClick={() => { setBusqueda(''); setFiltroFecha(''); setPaginaActual(1); }}
              className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shrink-0"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando facturas...</div>
      ) : facturas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay facturas emitidas</p>
        </div>
      ) : facturasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-300 opacity-50" />
          <p className="font-semibold text-slate-700">No se encontraron facturas</p>
          <p className="text-sm text-slate-400 mt-1">No hay resultados para la búsqueda realizada.</p>
          <button
            onClick={() => { setBusqueda(''); setFiltroFecha(''); setPaginaActual(1); }}
            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <>
        <div id="table-facturas" className="bg-white border rounded-2xl overflow-hidden shadow-sm relative z-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Número</th>
                <th className="px-5 py-3.5">Fecha</th><th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Documento</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-center">MH Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...facturasFiltradas]
                .sort((a, b) => b.id - a.id)
                .slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina)
                .map(f => (
                <tr key={f.id} className={`hover:bg-slate-50 ${f.estado === "anulada" ? "bg-red-50/75" : ""}`}>
                  <td className="px-5 py-4 font-medium text-slate-800">{f.numero}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{f.fecha_emision ? new Date(f.fecha_emision).toLocaleString() : ''}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <div className="font-semibold text-slate-800">{f.cliente_nombre}</div>
                    {f.vendedor_nombre && (
                      <div className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                        <span className="text-slate-400">Vendedor:</span> {f.vendedor_nombre}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <div>{f.tipo_doc}</div>
                    <div className="text-xs text-slate-400">{f.condicion_operacion}</div>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-700">{fmt(f.total)}</td>
                  <td className="px-5 py-4 text-center">
                    {f.estado === "anulada" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Anulada</span>
                    ) : f.estado_dte === 'procesado' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Aprobado</span>
                    ) : f.estado_dte === 'rechazado' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Rechazado</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pendiente DTE</span>
                    )}
                  </td>
                  <td className="px-5 py-4 flex justify-end gap-2">
                    {f.estado_dte !== 'procesado' && (
                      <>
                        <button onClick={() => iniciarEdicion(f)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-medium">Editar</button>
                        <button onClick={() => transmitirMH(f.id)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium">Transmitir MH</button>
                      </>
                    )}
                    {f.estado !== "anulada" && (
                      <button onClick={() => anularFactura(f.id)} className="text-slate-400 hover:text-red-600 inline-flex items-center p-1 mr-1" title="Anular Factura">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const baseUrl = import.meta.env.VITE_API_URL || 'https://ventas-demiempresa.onrender.com';
                        const pdfUrl = `${baseUrl}/api/v1/facturacion/facturas/${f.id}/imprimir?empresa_id=${empresaId()}`;
                        const texto = `Hola, le comparto la factura N° ${f.numero} por un total de ${fmt(f.total)}:\n\n📄 Ver PDF: ${pdfUrl}`;
                        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
                        window.open(waUrl, '_blank');
                      }}
                      className="text-emerald-600 hover:text-emerald-700 hover:scale-110 transition-transform inline-flex items-center p-1"
                      title="enviar por whatsap"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </button>
                    <a href={`${import.meta.env.VITE_API_URL || 'https://ventas-demiempresa.onrender.com'}/api/v1/facturacion/facturas/${f.id}/imprimir?empresa_id=${empresaId()}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 inline-flex items-center p-1" title="Ver / Imprimir PDF"><FileOutput className="w-4 h-4" /></a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {facturasFiltradas.length > itemsPorPagina && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <span className="text-sm text-slate-500">
              Mostrando {Math.min((paginaActual - 1) * itemsPorPagina + 1, facturasFiltradas.length)} a {Math.min(paginaActual * itemsPorPagina, facturasFiltradas.length)} de {facturasFiltradas.length} {facturasFiltradas.length !== facturas.length ? `(filtradas de ${facturas.length} total)` : ''}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaActual(Math.min(Math.ceil(facturasFiltradas.length / itemsPorPagina), paginaActual + 1))}
                disabled={paginaActual >= Math.ceil(facturasFiltradas.length / itemsPorPagina)}
                className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {showModalCajaRequerida && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Control Operativo de Caja Requerido</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
              Estimado usuario: Para proceder con la emisión y cobro de documentos de venta, es necesario disponer de un turno de caja activo. Por favor, realice la apertura de su turno de caja antes de iniciar la facturación.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModalCajaRequerida(false)} 
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { setShowModalCajaRequerida(false); navigate('/cajas'); }} 
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" /> Aperturar Caja Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
