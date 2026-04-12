import React, { useState, useEffect } from 'react';
import { Printer, Mail, Plus, Trash2, Edit2, Save, Building2, User, Package, Upload, History, X, AlertCircle, MessageCircle } from 'lucide-react';
import '../print.css';

const SistemaRemitos = () => {
  const [empresa, setEmpresa] = useState({
    nombre: 'Agua Pura S.A.',
    direccion: 'Av. Principal 1234',
    telefono: '+54 11 1234-5678',
    email: 'ventas@aguapura.com',
    cuit: '20-12345678-9',
    logo: ''
  });

  const [cliente, setCliente] = useState({
    nombre: '',
    apellido: '',
    direccion: '',
    email: '',
    telefono: ''
  });

  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    cantidad: 1,
    descripcion: 'Bidón de agua 20 litros',
    precioUnitario: 0
  });

  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [numeroRemito, setNumeroRemito] = useState('0001-00000001');
  const [mostrarRemito, setMostrarRemito] = useState(false);
  const [historialRemitos, setHistorialRemitos] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [clientesGuardados, setClientesGuardados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    try {
      const empresaData = localStorage.getItem('empresa-datos');
      if (empresaData) {
        setEmpresa(JSON.parse(empresaData));
      }

      const historialData = localStorage.getItem('historial-remitos');
      if (historialData) {
        setHistorialRemitos(JSON.parse(historialData));
      }

      const clientesData = localStorage.getItem('clientes-guardados');
      if (clientesData) {
        setClientesGuardados(JSON.parse(clientesData));
      }

      const ultimoNumero = localStorage.getItem('ultimo-numero-remito');
      if (ultimoNumero) {
        const num = parseInt(ultimoNumero) + 1;
        setNumeroRemito(`0001-${num.toString().padStart(8, '0')}`);
      }
    } catch (error) {
      console.log('Iniciando con datos por defecto:', error);
    } finally {
      setCargando(false);
    }
  };

  const guardarEmpresa = () => {
    try {
      localStorage.setItem('empresa-datos', JSON.stringify(empresa));
      setEditandoEmpresa(false);
      alert('✅ Datos de empresa guardados correctamente');
    } catch (error) {
      console.log('Error al guardar:', error);
      alert('✅ Datos actualizados');
    }
  };

  const subirLogo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert('⚠️ El archivo es muy grande. Por favor usa una imagen de menos de 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpresa({...empresa, logo: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const agregarProducto = () => {
    if (nuevoProducto.cantidad > 0 && nuevoProducto.descripcion.trim()) {
      setProductos([...productos, { ...nuevoProducto, id: Date.now() }]);
      setNuevoProducto({
        cantidad: 1,
        descripcion: 'Bidón de agua 20 litros',
        precioUnitario: 0
      });
      setError('');
    } else {
      setError('⚠️ Por favor complete la cantidad y descripción del producto');
    }
  };
  

  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const calcularTotal = () => {
    return productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);
  };

  const guardarCliente = () => {
    if (cliente.nombre && cliente.apellido) {
      const clienteExiste = clientesGuardados.find(
        c => c.nombre === cliente.nombre && c.apellido === cliente.apellido
      );
      
      if (!clienteExiste) {
        const nuevosClientes = [...clientesGuardados, cliente];
        setClientesGuardados(nuevosClientes);
        try {
          localStorage.setItem('clientes-guardados', JSON.stringify(nuevosClientes));
        } catch (error) {
          console.log('Error al guardar cliente');
        }
      }
    }
  };

  const validarDatos = () => {
    if (!cliente.nombre || !cliente.nombre.trim()) {
      setError('⚠️ Por favor ingrese el nombre del cliente');
      return false;
    }
    if (!cliente.apellido || !cliente.apellido.trim()) {
      setError('⚠️ Por favor ingrese el apellido del cliente');
      return false;
    }
    if (!cliente.direccion || !cliente.direccion.trim()) {
      setError('⚠️ Por favor ingrese la dirección del cliente');
      return false;
    }
    if (productos.length === 0) {
      setError('⚠️ Por favor agregue al menos un producto');
      return false;
    }
    return true;
  };

  const generarRemito = () => {
    setError('');
    
    if (!validarDatos()) {
      return;
    }

    try {
      guardarCliente();

      const nuevoRemito = {
        id: Date.now(),
        numero: numeroRemito,
        fecha: new Date().toISOString(),
        cliente: {...cliente},
        productos: [...productos],
        total: calcularTotal()
      };

      const nuevoHistorial = [nuevoRemito, ...historialRemitos];
      setHistorialRemitos(nuevoHistorial);
      
      try {
        localStorage.setItem('historial-remitos', JSON.stringify(nuevoHistorial));
        const numActual = parseInt(numeroRemito.split('-')[1]);
        localStorage.setItem('ultimo-numero-remito', numActual.toString());
      } catch (error) {
        console.log('Error al guardar en historial');
      }

      setMostrarRemito(true);
    } catch (error) {
      console.log('Error al generar remito:', error);
      setError('❌ Error al generar el remito. Por favor intente nuevamente.');
    }
  };

  const printRemitoFallback = (remitoHtml) => {
    const w = window.open('', '_blank');
    const cssHref = '/src/print.css';
    const fonts = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Work+Sans:wght@300;400;500;600&display=swap');";
    w.document.open();
    w.document.write(`
      <html>
        <head>
          <title>Remito</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>${fonts}</style>
          <link rel="stylesheet" href="${cssHref}" />
        </head>
        <body>
          ${remitoHtml}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); /* don't close immediately to allow user to cancel */ }, 300);
  };

  const imprimirRemito = () => {
    const rem = document.getElementById('remito-para-imprimir');
    if (rem) {
      printRemitoFallback(rem.outerHTML);
    } else {
      window.print();
    }
  };

  const enviarWhatsApp = () => {
    const mensaje = `*Remito N° ${numeroRemito}*
${empresa.nombre}

*Cliente:* ${cliente.nombre} ${cliente.apellido}
*Dirección:* ${cliente.direccion}

*Productos:*
${productos.map(p => `• ${p.cantidad} x ${p.descripcion} - $${(p.cantidad * p.precioUnitario).toFixed(2)}`).join('\n')}

*TOTAL: $${calcularTotal().toFixed(2)}*

Fecha: ${new Date().toLocaleDateString('es-AR')}`;

    const telefono = cliente.telefono ? cliente.telefono.replace(/\D/g, '') : '';
    const url = telefono 
      ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
  };

  const enviarEmail = () => {
    const subject = `Remito N° ${numeroRemito} - ${empresa.nombre}`;
    const body = `Estimado/a ${cliente.nombre} ${cliente.apellido},

Adjunto encontrará el remito N° ${numeroRemito} correspondiente a su pedido de bidones de agua.

DETALLE DEL PEDIDO:
${productos.map(p => `• ${p.cantidad} x ${p.descripcion} - $${(p.cantidad * p.precioUnitario).toFixed(2)}`).join('\n')}

TOTAL: $${calcularTotal().toFixed(2)}

Dirección de entrega: ${cliente.direccion}
Fecha: ${new Date().toLocaleDateString('es-AR')}

Saludos cordiales,
${empresa.nombre}
${empresa.telefono}
${empresa.email}`;
    
    const emailCliente = cliente.email || '';
    window.location.href = `mailto:${emailCliente}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const seleccionarCliente = (clienteSeleccionado) => {
    setCliente(clienteSeleccionado);
    setError('');
  };

  const verRemitoHistorial = (remito) => {
    setCliente(remito.cliente);
    setProductos(remito.productos);
    setNumeroRemito(remito.numero);
    setMostrarRemito(true);
    setMostrarHistorial(false);
  };

  const nuevoRemito = () => {
    setMostrarRemito(false);
    setCliente({ nombre: '', apellido: '', direccion: '', email: '', telefono: '' });
    setProductos([]);
    setError('');
    
    const numActual = parseInt(numeroRemito.split('-')[1]);
    setNumeroRemito(`0001-${(numActual + 1).toString().padStart(8, '0')}`);
  };

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '64px', width: '64px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (mostrarHistorial) {
    // Agrupar remitos por cliente
    const grouped = historialRemitos.reduce((acc, r) => {
      const nombre = (r.cliente.nombre || 'Sin Nombre').trim();
      const apellido = (r.cliente.apellido || '').trim();
      const key = `${apellido}, ${nombre}`.trim().replace(/^,\s*/, '');
      if (!acc[key]) acc[key] = { cliente: r.cliente, remitos: [] };
      acc[key].remitos.push(r);
      return acc;
    }, {});

    // Ordenar grupos alfabéticamente por nombre del cliente (apellido, nombre)
    // y ordenar remitos de cada grupo por fecha descendente (más reciente primero)
    const grupos = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base', ignorePunctuation: true }))
      .map(k => ({
        key: k,
        ...grouped[k],
        remitos: grouped[k].remitos.sort((a, b) => {
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          return fechaB - fechaA; // Descendente: más reciente primero
        })
      }));

    // Filtrar grupos según búsqueda
    const gruposFiltrados = busquedaCliente.trim() 
      ? grupos.filter(g => {
          const termino = busquedaCliente.toLowerCase();
          const nombreCompleto = g.key.toLowerCase();
          const nombre = (g.cliente.nombre || '').toLowerCase();
          const apellido = (g.cliente.apellido || '').toLowerCase();
          const direccion = (g.cliente.direccion || '').toLowerCase();
          return nombreCompleto.includes(termino) || 
                 nombre.includes(termino) || 
                 apellido.includes(termino) ||
                 direccion.includes(termino);
        })
      : grupos;

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)', padding: '48px 16px' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Work+Sans:wght@300;400;500;600&display=swap');
        `}</style>

        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', fontFamily: 'Playfair Display, serif' }}>
              Historial de Remitos por Cliente (A-Z)
            </h1>
            <button
              onClick={() => { setMostrarHistorial(false); setBusquedaCliente(''); }}
              style={{ padding: '12px 24px', background: '#4b5563', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}
            >
              <X size={20} />
              Cerrar
            </button>
          </div>

          {/* Buscador */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="🔍 Buscar cliente por nombre, apellido o dirección..."
                style={{ 
                  width: '100%', 
                  padding: '16px 20px', 
                  paddingRight: busquedaCliente ? '50px' : '20px',
                  border: '2px solid #93c5fd', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  outline: 'none',
                  background: 'white',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
                }}
              />
              {busquedaCliente && (
                <button
                  onClick={() => setBusquedaCliente('')}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: '#ef4444', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '28px', 
                    height: '28px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {busquedaCliente && (
              <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
                {gruposFiltrados.length === 0 
                  ? `❌ No se encontraron clientes con "${busquedaCliente}"`
                  : `✅ ${gruposFiltrados.length} cliente(s) encontrado(s)`
                }
              </p>
            )}
          </div>

          {gruposFiltrados.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '48px', textAlign: 'center' }}>
              <History size={64} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
              <p style={{ color: '#6b7280', fontSize: '18px' }}>
                {busquedaCliente ? 'No se encontraron clientes con ese criterio' : 'No hay remitos generados aún'}
              </p>
              {busquedaCliente && (
                <button
                  onClick={() => setBusquedaCliente('')}
                  style={{ marginTop: '16px', padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {gruposFiltrados.map((g) => (
                <div key={g.key} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 6px 18px rgba(0,0,0,0.06)', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e6edf8', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                        📋 {g.key}
                      </p>
                      {g.cliente.direccion && <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{g.cliente.direccion}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', color: '#6b7280' }}>{g.remitos.length} remito(s)</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {g.remitos.map((remito, idx) => (
                      <div key={remito.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: idx === 0 ? '#f0fdf4' : '#f8fafc', border: idx === 0 ? '1px solid #86efac' : '1px solid #e6f0ff' }}>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}>
                            Remito N° {remito.numero}
                            {idx === 0 && <span style={{ marginLeft: '8px', fontSize: '11px', background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>Más reciente</span>}
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '13px' }}>{new Date(remito.fecha).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(remito.fecha).toLocaleTimeString('es-AR')}</p>
                          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}><strong>Items:</strong> {remito.productos.length}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>${remito.total.toFixed(2)}</p>
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => verRemitoHistorial(remito)} style={{ padding: '8px 12px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Ver</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mostrarRemito) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Work+Sans:wght@300;400;500;600&display=swap');

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div className="no-print" style={{ position: 'fixed', top: '16px', right: '16px', display: 'flex', gap: '12px', zIndex: 50, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '600px' }}>
          <button onClick={nuevoRemito} style={{ padding: '12px 24px', background: '#4b5563', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '14px', fontWeight: '500' }}>
            ← Nuevo Remito
          </button>
          <button onClick={imprimirRemito} style={{ padding: '12px 24px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            <Printer size={20} />
            Imprimir / PDF
          </button>
          <button onClick={enviarWhatsApp} style={{ padding: '12px 24px', background: '#16a34a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            <MessageCircle size={20} />
            WhatsApp
          </button>
          <button onClick={enviarEmail} style={{ padding: '12px 24px', background: '#ea580c', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            <Mail size={20} />
            Email
          </button>
        </div>

        <div className="no-print" style={{ maxWidth: '1024px', margin: '80px auto 24px', padding: '0 16px' }}>
          <div style={{ background: '#dbeafe', border: '2px solid #93c5fd', borderRadius: '12px', padding: '16px' }}>
            <p style={{ color: '#1e40af', textAlign: 'center', fontWeight: '500', fontSize: '14px' }}>
              💡 <strong>Para guardar como PDF:</strong> Presiona Ctrl+P, luego selecciona "Guardar como PDF"
            </p>
          </div>
        </div>

        <div style={{ padding: '48px 16px' }}>
          <div id="remito-para-imprimir" style={{ maxWidth: '21cm', margin: '0 auto', background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', borderRadius: '8px', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', padding: '16px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {empresa.logo && (
                    <img src={empresa.logo} alt="Logo" style={{ height: '50px', width: '50px', objectFit: 'contain', background: 'white', borderRadius: '6px', padding: '6px', border: '2px solid white' }} />
                  )}
                  <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '3px', fontFamily: 'Playfair Display, serif', lineHeight: '1.1' }}>
                      {empresa.nombre}
                    </h1>
                    <p style={{ color: '#bfdbfe', fontSize: '9px', margin: '1.5px 0', lineHeight: '1.3' }}>
                      {empresa.direccion}
                    </p>
                    <p style={{ color: '#bfdbfe', fontSize: '9px', margin: '1.5px 0', lineHeight: '1.3' }}>
                      Tel: {empresa.telefono} | {empresa.email}
                    </p>
                    <p style={{ color: '#bfdbfe', fontSize: '9px', margin: '1.5px 0', lineHeight: '1.3' }}>
                      CUIT: {empresa.cuit}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', padding: '10px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.15)' }}>
                  <p style={{ fontSize: '8px', color: '#bfdbfe', marginBottom: '2px', letterSpacing: '0.5px' }}>REMITO</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'Work Sans, sans-serif' }}>
                    N° {numeroRemito}
                  </p>
                  <p style={{ fontSize: '8px', color: '#bfdbfe', marginTop: '4px' }}>
                    {new Date().toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div style={{ padding: '14px 28px', background: 'linear-gradient(to right, #f8fafc, #dbeafe)', borderBottom: '2px solid #93c5fd' }}>
              <h2 style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <User size={13} style={{ color: '#2563eb' }} />
                Datos del Cliente
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '8px', color: '#6b7280', marginBottom: '3px', fontWeight: '500' }}>Nombre y Apellido</p>
                  <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>
                    {cliente.nombre} {cliente.apellido}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '8px', color: '#6b7280', marginBottom: '3px', fontWeight: '500' }}>Dirección de Entrega</p>
                  <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '12px' }}>{cliente.direccion}</p>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div style={{ padding: '16px 28px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Package size={13} style={{ color: '#2563eb' }} />
                Detalle de Productos
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #2563eb', background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '8px 8px', color: '#1f2937', fontWeight: '600', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CANT.</th>
                    <th style={{ textAlign: 'left', padding: '8px 8px', color: '#1f2937', fontWeight: '600', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DESCRIPCIÓN</th>
                    <th style={{ textAlign: 'right', padding: '8px 8px', color: '#1f2937', fontWeight: '600', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>P. UNIT.</th>
                    <th style={{ textAlign: 'right', padding: '8px 8px', color: '#1f2937', fontWeight: '600', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto, index) => (
                    <tr key={producto.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '9px 8px', fontWeight: '600', color: '#1f2937', fontSize: '10px' }}>{producto.cantidad}</td>
                      <td style={{ padding: '9px 8px', color: '#4b5563', fontSize: '10px' }}>{producto.descripcion}</td>
                      <td style={{ padding: '9px 8px', textAlign: 'right', color: '#4b5563', fontSize: '10px' }}>
                        ${producto.precioUnitario.toFixed(2)}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: '600', color: '#1f2937', fontSize: '10px' }}>
                        ${(producto.cantidad * producto.precioUnitario).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', padding: '12px 26px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', minWidth: '170px' }}>
                  <p style={{ fontSize: '9px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Total</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Work Sans, sans-serif', lineHeight: '1' }}>
                    ${calcularTotal().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: '#f9fafb', padding: '12px 28px', borderTop: '2px solid #e5e7eb' }}>
              <p style={{ fontSize: '8px', color: '#6b7280', textAlign: 'center', marginBottom: '12px', lineHeight: '1.4', fontStyle: 'italic' }}>
                Este documento NO es válido como factura fiscal. Es un comprobante de entrega de mercadería.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '6px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ borderTop: '1.5px solid #9ca3af', paddingTop: '5px', marginTop: '22px', display: 'inline-block', minWidth: '160px' }}>
                    <p style={{ fontSize: '8px', color: '#6b7280', fontWeight: '500' }}>
                      Firma del Cliente
                    </p>
                    <p style={{ fontSize: '7px', color: '#9ca3af', marginTop: '2px' }}>
                      Aclaración
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ borderTop: '1.5px solid #9ca3af', paddingTop: '5px', marginTop: '22px', display: 'inline-block', minWidth: '160px' }}>
                    <p style={{ fontSize: '8px', color: '#6b7280', fontWeight: '500' }}>
                      Firma Autorizada
                    </p>
                    <p style={{ fontSize: '7px', color: '#9ca3af', marginTop: '2px' }}>
                      {empresa.nombre}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #ddd6fe 100%)', padding: '48px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Work+Sans:wght@300;400;500;600&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
          box-sizing: border-box;
        }
      `}</style>

      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div></div>
            <button
              onClick={() => setMostrarHistorial(true)}
              style={{ padding: '12px 24px', background: '#7c3aed', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}
            >
              <History size={20} />
              Ver Historial ({historialRemitos.length})
            </button>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>
            Sistema de Remitos
          </h1>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Gestión de entregas de bidones de agua</p>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>💾 Todos los datos se guardan automáticamente | 🖨️ Imprime o guarda como PDF</p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle style={{ color: '#dc2626' }} size={24} />
            <p style={{ color: '#991b1b', fontWeight: '500' }}>{error}</p>
          </div>
        )}

        {/* Datos de la Empresa */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '32px', marginBottom: '32px', border: '1px solid #dbeafe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Building2 style={{ color: '#2563eb' }} size={28} />
              Datos de la Empresa
            </h2>
            <button
              onClick={() => editandoEmpresa ? guardarEmpresa() : setEditandoEmpresa(true)}
              style={{ padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {editandoEmpresa ? <><Save size={18} /> Guardar</> : <><Edit2 size={18} /> Editar</>}
            </button>
          </div>
          
          {editandoEmpresa ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Nombre</label>
                  <input
                    type="text"
                    value={empresa.nombre}
                    onChange={(e) => setEmpresa({...empresa, nombre: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>CUIT</label>
                  <input
                    type="text"
                    value={empresa.cuit}
                    onChange={(e) => setEmpresa({...empresa, cuit: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Dirección</label>
                  <input
                    type="text"
                    value={empresa.direccion}
                    onChange={(e) => setEmpresa({...empresa, direccion: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Teléfono</label>
                  <input
                    type="text"
                    value={empresa.telefono}
                    onChange={(e) => setEmpresa({...empresa, telefono: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Email</label>
                  <input
                    type="email"
                    value={empresa.email}
                    onChange={(e) => setEmpresa({...empresa, email: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Logo de la Empresa</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {empresa.logo && (
                    <img src={empresa.logo} alt="Logo" style={{ height: '80px', width: '80px', objectFit: 'contain', border: '2px solid #d1d5db', borderRadius: '8px', padding: '8px' }} />
                  )}
                  <label style={{ padding: '12px 24px', background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Upload size={18} />
                    {empresa.logo ? 'Cambiar Logo' : 'Subir Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={subirLogo}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {empresa.logo && (
                    <button
                      onClick={() => setEmpresa({...empresa, logo: ''})}
                      style={{ padding: '12px 16px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                      Eliminar Logo
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>Formatos aceptados: JPG, PNG, GIF (máx. 2MB)</p>
              </div>
            </div>
          ) : (
            <div style={{ background: 'linear-gradient(to right, #dbeafe, #e0e7ff)', padding: '24px', borderRadius: '12px', border: '2px solid #93c5fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {empresa.logo && (
                  <img src={empresa.logo} alt="Logo" style={{ height: '96px', width: '96px', objectFit: 'contain', border: '2px solid #3b82f6', borderRadius: '8px', padding: '8px', background: 'white' }} />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Razón Social</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '16px' }}>{empresa.nombre}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>CUIT</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '16px' }}>{empresa.cuit}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Dirección</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '16px' }}>{empresa.direccion}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Contacto</p>
                    <p style={{ fontWeight: '600', color: '#1f2937' }}>{empresa.telefono}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937' }}>{empresa.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          {/* Datos del Cliente */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '32px', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User style={{ color: '#2563eb' }} size={28} />
              Datos del Cliente
            </h2>
            
            {clientesGuardados.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Clientes anteriores</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const clienteSelec = JSON.parse(e.target.value);
                      seleccionarCliente(clienteSelec);
                    }
                  }}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {[...clientesGuardados]
                    .sort((a, b) => {
                      const nombreA = `${a.apellido || ''} ${a.nombre || ''}`.trim().toLowerCase();
                      const nombreB = `${b.apellido || ''} ${b.nombre || ''}`.trim().toLowerCase();
                      return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
                    })
                    .map((c, index) => (
                      <option key={index} value={JSON.stringify(c)}>
                        {c.apellido}, {c.nombre} - {c.direccion}
                      </option>
                    ))}

                </select>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Nombre *</label>
                <input
                  type="text"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({...cliente, nombre: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  placeholder="Ingrese el nombre"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Apellido *</label>
                <input
                  type="text"
                  value={cliente.apellido}
                  onChange={(e) => setCliente({...cliente, apellido: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  placeholder="Ingrese el apellido"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Dirección *</label>
                <input
                  type="text"
                  value={cliente.direccion}
                  onChange={(e) => setCliente({...cliente, direccion: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  placeholder="Calle, número, ciudad"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Teléfono (para WhatsApp)</label>
                <input
                  type="tel"
                  value={cliente.telefono}
                  onChange={(e) => setCliente({...cliente, telefono: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Email (opcional)</label>
                <input
                  type="email"
                  value={cliente.email}
                  onChange={(e) => setCliente({...cliente, email: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Agregar Productos */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '32px', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Package style={{ color: '#2563eb' }} size={28} />
              Agregar Productos
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={nuevoProducto.cantidad}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, cantidad: parseInt(e.target.value) || 1})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Descripción</label>
                <input
                  type="text"
                  value={nuevoProducto.descripcion}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Precio Unitario ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nuevoProducto.precioUnitario}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, precioUnitario: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <button
                onClick={agregarProducto}
                style={{ width: '100%', padding: '16px 24px', background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', fontWeight: '500' }}
              >
                <Plus size={20} />
                Agregar Producto
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Productos */}
        {productos.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '32px', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>Productos Agregados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productos.map((producto) => (
                <div key={producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #dbeafe, #e0e7ff)', padding: '20px', borderRadius: '12px', border: '2px solid #93c5fd' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '16px' }}>
                      {producto.cantidad} x {producto.descripcion}
                    </p>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>
                      ${producto.precioUnitario.toFixed(2)} c/u = <span style={{ fontWeight: '600', color: '#2563eb' }}>${(producto.cantidad * producto.precioUnitario).toFixed(2)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarProducto(producto.id)}
                    style={{ padding: '8px 16px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                </div>
              ))}

            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', color: 'white', padding: '16px 32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                <p style={{ fontSize: '14px', marginBottom: '4px' }}>Total</p>
                <p style={{ fontSize: '30px', fontWeight: 'bold' }}>${calcularTotal().toFixed(2)}</p>
              </div>
              <button
                onClick={generarRemito}
                style={{ padding: '16px 40px', background: 'linear-gradient(to right, #10b981, #059669)', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', fontSize: '16px', fontWeight: '600' }}
              >
                Generar Remito
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SistemaRemitos;