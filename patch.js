const fs = require('fs');
let code = fs.readFileSync('facturacion_web/src/pages/Existencias.jsx', 'utf8');

const stateCode = 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    producto_id: '',
    bodega_id: '',
    tipo_movimiento: 'AJUSTE_POSITIVO',
    cantidad: '',
    costo_unitario: '',
    notas: 'Inventario Físico Inicial'
  });
;

code = code.replace('const [modalAbierto, setModalAbierto] = useState(false);', stateCode);

const guardarCode = 
  const guardarAjuste = async () => {
    if (!form.producto_id || !form.bodega_id || !form.cantidad || form.cantidad <= 0) {
      return alert('Complete producto, bodega y una cantidad mayor a cero');
    }
    setGuardando(true);
    try {
      const payload = {
        empresa_id: empresaId(),
        bodega_id: parseInt(form.bodega_id),
        producto_id: parseInt(form.producto_id),
        tipo_movimiento: form.tipo_movimiento,
        cantidad: parseFloat(form.cantidad),
        costo_unitario: form.costo_unitario ? Math.round(parseFloat(form.costo_unitario) * 100) : 0,
        usuario_id: 1,
        notas: form.notas
      };
      await api.post('/api/v1/almacen/kardex/ajuste', payload);
      setModalAbierto(false);
      setForm({
        producto_id: '', bodega_id: '', tipo_movimiento: 'AJUSTE_POSITIVO',
        cantidad: '', costo_unitario: '', notas: 'Inventario Físico Inicial'
      });
      cargar(); 
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar el ajuste');
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => { cargar(); }, []);
;

code = code.replace('useEffect(() => { cargar(); }, []);', guardarCode);

const fetchCode = 
        api.get(\/api/v1/almacen/kardex/existencias?empresa_id=\\),
        api.get(\/api/v1/almacen/bodegas/?empresa_id=\\),
        api.get(\/api/v1/facturacion/productos/?empresa_id=\\)
      ]);
      setStock(resS.data);
      setBodegas(resB.data);
      setProductos(resP.data);
;

code = code.replace(/api\.get\(\\/api\/v1\/almacen\/kardex\/existencias\?empresa_id=\\?\$\{empresaId\(\)\}\\),[\s\S]*?setBodegas\(resB\.data\);/, fetchCode);

code = code.replace('Cdigo', 'Código');
code = code.replace('}\\n}\\n', '}\\n');
code = code.replace(/}\s*}$/, '}');

fs.writeFileSync('facturacion_web/src/pages/Existencias.jsx', code);
