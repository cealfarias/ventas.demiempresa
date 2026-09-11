import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Wallet, AlertTriangle, CheckCircle, Lock, PlusCircle } from 'lucide-react';
import AperturaCajaModal from './AperturaCajaModal';

export default function CajaStateBanner() {
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const empresaId = localStorage.getItem('empresa_id');
  const usuarioId = localStorage.getItem('usuario_id') ? parseInt(localStorage.getItem('usuario_id')) : 1;

  const consultarEstado = async () => {
    if (!empresaId) return;
    try {
      const res = await api.get(`/api/v1/cajas/estado-usuario?empresa_id=${empresaId}&usuario_id=${usuarioId}`);
      setEstadoCaja(res.data);
    } catch (e) {
      console.error('Error al consultar estado de caja', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarEstado();

    const handleUpdate = () => consultarEstado();
    window.addEventListener('caja:updated', handleUpdate);
    return () => window.removeEventListener('caja:updated', handleUpdate);
  }, [empresaId, usuarioId]);

  if (cargando || !empresaId) return null;

  const sesion = estadoCaja?.sesion;

  return (
    <>
      <div className="flex items-center gap-2">
        {sesion?.activa ? (
          sesion.es_trasnochada ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold animate-pulse shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Caja {sesion.caja_nombre} (Día anterior pendiente de cierre)</span>
              <a href="/cajas" className="underline font-bold hover:text-amber-900 ml-1">Ir a Cierre Z</a>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Turno Activo:</span>
              <span className="font-bold">{sesion.caja_nombre}</span>
              <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-md font-mono font-bold ml-1">
                ${(sesion.total_efectivo / 100).toFixed(2)}
              </span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 text-rose-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Caja Cerrada</span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 bg-rose-600 text-white px-2.5 py-0.5 rounded-md text-xs font-bold hover:bg-rose-700 transition-colors ml-1"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Abrir</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AperturaCajaModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            consultarEstado();
          }}
        />
      )}
    </>
  );
}
