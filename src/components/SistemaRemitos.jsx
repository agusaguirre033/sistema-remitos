import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Plus, Trash2, Edit2, Save, User, Package, Upload, History, X, AlertCircle, FileText, Users, Boxes, Settings, Eye, EyeOff, Download, Phone, MapPin, BadgeCheck, ArrowLeft, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import '../print.css';
import './SistemaRemitos.css';
import {
  getEmpresa, saveEmpresa,
  getClientes, saveClienteIfNew,
  getRemitos, saveRemito,
  getUltimoNumeroRemito, saveUltimoNumeroRemito
} from '../utils/db';
import { supabase } from '../lib/supabase';

const SistemaRemitos = () => {
  const [empresa, setEmpresa] = useState({
    nombre: 'Agua Mar MR',
    responsable: 'Miguel Angel Roht',
    direccion: 'Soldado Maciel 114, Coronel Suárez, Provincia de Buenos Aires',
    telefono: '2926-495879',
    email: 'aguamarmr@gmail.com',
    cuit: '20-23632165-8',
    logo: '/logo.png'
  });

  const [cliente, setCliente] = useState({
    nombre: '',
    apellido: '',
    direccion: '',
    email: '',
    telefono: '',
    cuit: '',
    condicionFiscal: '',
    observaciones: ''
  });
  const [nombreClienteInput, setNombreClienteInput] = useState('');

  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    producto: 'Bidón de Agua 20 L',
    cantidad: 1,
    descripcion: 'Agua mineral natural sin gas',
    precioUnitario: 0
  });

  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [numeroRemito, setNumeroRemito] = useState('0001-00000001');
  const [fechaRemito, setFechaRemito] = useState(new Date().toISOString());
  const [mostrarRemito, setMostrarRemito] = useState(false);
  const [historialRemitos, setHistorialRemitos] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [clientesGuardados, setClientesGuardados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [guardandoRemito, setGuardandoRemito] = useState(false);
  const [estadoConexion, setEstadoConexion] = useState('verificando');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [filtroHistorial, setFiltroHistorial] = useState('az');
  const [clientesExpandidos, setClientesExpandidos] = useState({});
  const [seccionActiva, setSeccionActiva] = useState('remitos');
  const [sesion, setSesion] = useState({ autenticado: false, usuario: '', username: '', rol: '', permisos: {} });
  const [authInicializado, setAuthInicializado] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: true });
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    aceptaTerminos: false,
  });
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [authBusy, setAuthBusy] = useState({ login: false, register: false, recover: false, reset: false });
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [resetErrors, setResetErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showPassword, setShowPassword] = useState({ login: false, register: false, reset: false, resetConfirm: false });
  const [passwordStrength, setPasswordStrength] = useState({ register: 0, reset: 0 });

  const permisosPorRol = useCallback((rol) => (rol === 'admin'
    ? { remitos: true, clientes: true, productos: true, historial: true, config: true }
    : { remitos: true, clientes: true, productos: true, historial: true, config: false }), []);

  const mapearSesionDesdeUser = useCallback((user) => {
    if (!user) {
      setSesion({ autenticado: false, usuario: '', username: '', rol: '', permisos: {} });
      return;
    }

    const rol = user.user_metadata?.rol || 'admin';
    const nombre = user.user_metadata?.nombre || user.email || 'Usuario';
    setSesion({
      autenticado: true,
      usuario: nombre,
      username: user.email || '',
      rol,
      permisos: permisosPorRol(rol),
    });
  }, [permisosPorRol]);

  const validarContraseñaFuerte = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) strength++;
    return Math.min(strength, 5);
  };

  const esFuerte = (pwd) => validarContraseñaFuerte(pwd) >= 4;

  const pushToast = (type, text) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const toastUI = (
    <div className="app-toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className={`app-toast ${toast.type}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      mapearSesionDesdeUser(data.session?.user || null);
      setAuthInicializado(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sessionData) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecoveryFlow(true);
      }
      mapearSesionDesdeUser(sessionData?.user || null);
      setAuthInicializado(true);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [mapearSesionDesdeUser]);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setIsRecoveryFlow(true);
      setAuthTab('login');
    }
  }, []);

  useEffect(() => {
    if (!sesion.autenticado) {
      setCargando(false);
      return;
    }
    cargarDatos();
  }, [sesion.autenticado]);

  const cargarDatos = async () => {
    try {
      const [empresaData, historialData, clientesData, ultimoNumero] = await Promise.all([
        getEmpresa(),
        getRemitos(),
        getClientes(),
        getUltimoNumeroRemito(),
      ]);

      if (empresaData) setEmpresa(empresaData);
      if (historialData.length > 0) setHistorialRemitos(historialData);
      if (clientesData.length > 0) setClientesGuardados(clientesData);

      const num = ultimoNumero + 1;
      setNumeroRemito(`0001-${num.toString().padStart(8, '0')}`);
      setEstadoConexion('ok');
    } catch (error) {
      console.error('Error cargando datos:', error);
      setEstadoConexion('error');
      setError('❌ No se pudo conectar con la base de datos. Verificá Supabase y volvé a intentar.');
    } finally {
      setCargando(false);
    }
  };

  const guardarEmpresa = async () => {
    if (!(sesion.autenticado && sesion.rol === 'admin')) {
      setError('⚠️ Iniciá sesión como administrador para editar la empresa.');
      return;
    }

    try {
      await saveEmpresa(empresa);
      setEditandoEmpresa(false);
      setMensajeExito('Datos de empresa guardados correctamente.');
      pushToast('success', 'Datos de empresa guardados correctamente.');
    } catch (error) {
      console.error('Error al guardar empresa:', error);
      setError('❌ Error al guardar los datos de la empresa.');
      pushToast('error', 'Error al guardar los datos de la empresa.');
    }
  };

  const subirLogo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        setError('⚠️ El archivo es muy grande. Por favor usa una imagen de menos de 2MB.');
        pushToast('error', 'El archivo es muy grande. Máximo permitido: 2MB.');
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
    if (nuevoProducto.cantidad > 0 && nuevoProducto.producto.trim() && nuevoProducto.descripcion.trim() && nuevoProducto.precioUnitario >= 0) {
      setProductos([...productos, { ...nuevoProducto, id: Date.now() }]);
      setNuevoProducto({
        producto: 'Bidón de Agua 20 L',
        cantidad: 1,
        descripcion: 'Agua mineral natural sin gas',
        precioUnitario: 0
      });
      setError('');
      setMensajeExito('');
    } else {
      setError('⚠️ Revisá el producto: cantidad mayor a 0, producto, descripción y precio válido.');
    }
  };
  

  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const calcularTotal = () => {
    return productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);
  };

  const guardarCliente = async () => {
    if (cliente.nombre && cliente.apellido) {
      try {
        const clienteNormalizado = {
          nombre: cliente.nombre.trim(),
          apellido: cliente.apellido.trim(),
          direccion: cliente.direccion.trim(),
          email: (cliente.email || '').trim(),
          telefono: (cliente.telefono || '').trim(),
          cuit: (cliente.cuit || '').trim(),
          condicionFiscal: (cliente.condicionFiscal || '').trim(),
          observaciones: (cliente.observaciones || '').trim(),
        };

        await saveClienteIfNew(clienteNormalizado);
        // Actualizar lista local si no existía
        const existe = clientesGuardados.find(
          c => c.nombre === clienteNormalizado.nombre && c.apellido === clienteNormalizado.apellido
        );
        if (!existe) {
          setClientesGuardados(prev => [...prev, clienteNormalizado]);
        }
      } catch (error) {
        console.error('Error al guardar cliente:', error);
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
    if (cliente.email && cliente.email.trim()) {
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email.trim());
      if (!emailValido) {
        setError('⚠️ El email del cliente no es válido');
        return false;
      }
    }
    if (productos.length === 0) {
      setError('⚠️ Por favor agregue al menos un producto');
      return false;
    }
    return true;
  };

  const generarRemito = async () => {
    setError('');
    setMensajeExito('');

    if (!validarDatos()) {
      return false;
    }

    try {
      setGuardandoRemito(true);
      await guardarCliente();

      const nuevoRemito = {
        id: Date.now(),
        numero: numeroRemito,
        fecha: new Date().toISOString(),
        cliente: { ...cliente },
        productos: [...productos],
        total: calcularTotal(),
      };

      await saveRemito(nuevoRemito);

      const numActual = parseInt(numeroRemito.split('-')[1]);
      await saveUltimoNumeroRemito(numActual);

      setHistorialRemitos(prev => [nuevoRemito, ...prev]);
      setFechaRemito(nuevoRemito.fecha);
      setEstadoConexion('ok');
      setMensajeExito('✅ Remito guardado en la nube correctamente.');
      setMostrarRemito(true);
      return true;
    } catch (error) {
      console.error('Error al generar remito:', error);
      setEstadoConexion('error');
      setError('❌ Error al guardar el remito. Verificá la conexión a la base de datos.');
      return false;
    } finally {
      setGuardandoRemito(false);
    }
  };

  const generarEImprimir = async () => {
    const ok = await generarRemito();
    if (ok) {
      // Ejecutar print directo evita que el navegador bloquee el diálogo.
      window.print();
    }
  };

  const descargarPDF = () => {
    const elemento = document.getElementById('remito-para-imprimir');
    if (!elemento) return;
    
    const opciones = {
      margin: 0,
      filename: `Remito-${numeroRemito.replace(/\//g, '-')}.pdf`,
      image: { type: 'png', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    
    html2pdf().set(opciones).from(elemento).save();
  };

  const imprimirRemito = () => {
    try {
      const remitoNode = document.getElementById('remito-para-imprimir');
      if (!remitoNode) {
        pushToast('error', 'No se encontró el remito para imprimir.');
        return;
      }

      const printStyles = `
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #171717;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .rv-canvas {
          display: flex;
          justify-content: center;
          padding: 0;
          margin: 0;
          background: #ffffff;
        }
        #remito-para-imprimir {
          width: 210mm;
          min-height: 297mm;
          padding: 12mm 14mm 11mm;
          margin: 0 auto;
          background: #ffffff;
          color: #171717;
        }
        .rv-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 6mm;
        }
        .rv-logo-main {
          width: 70mm;
          max-width: 90%;
          object-fit: contain;
        }
        .rv-rule {
          border: 0;
          border-top: 0.3mm solid #dcdcdc;
          margin: 4.5mm 0;
        }
        .rv-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6mm;
        }
        .rv-block h2,
        .rv-block h3,
        .rv-client h4 {
          margin: 0;
        }
        .rv-block p {
          margin: 1.4mm 0;
          font-size: 3.35mm;
          line-height: 1.35;
        }
        .rv-doc-block {
          border-left: 0.3mm solid #dddddd;
          padding-left: 6mm;
        }
        .rv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 3.25mm;
        }
        .rv-table th,
        .rv-table td {
          border: 0.3mm solid #dddddd;
          padding: 2mm 2.2mm;
          text-align: left;
          line-height: 1.28;
        }
        .rv-table th {
          background: #fafafa;
          font-size: 2.8mm;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-weight: 700;
        }
        .rv-total-row {
          display: flex;
          justify-content: flex-end;
          gap: 8mm;
          margin-top: 4mm;
          font-size: 6mm;
          font-weight: 700;
        }
        .rv-sign {
          margin-top: 8mm;
          text-align: center;
          color: #555555;
          font-size: 3.1mm;
        }
        @media print {
          html, body { width: 210mm; }
        }
      `;

      const baseHref = `${window.location.origin}/`;
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.position = 'fixed';
      frame.style.right = '0';
      frame.style.bottom = '0';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      frame.style.visibility = 'hidden';
      document.body.appendChild(frame);

      const frameDoc = frame.contentDocument || frame.contentWindow?.document;
      if (!frameDoc || !frame.contentWindow) {
        document.body.removeChild(frame);
        pushToast('error', 'No se pudo preparar la impresión.');
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <!doctype html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <base href="${baseHref}" />
            <title>Impresión de Remito</title>
            <style>${printStyles}</style>
          </head>
          <body>
            <div class="rv-canvas">
              ${remitoNode.outerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        } finally {
          setTimeout(() => {
            if (frame.parentNode) {
              frame.parentNode.removeChild(frame);
            }
          }, 1000);
        }
      }, 150);
    } catch (error) {
      console.error('Error al imprimir:', error);
      pushToast('error', 'No se pudo abrir el diálogo de impresión.');
    }
  };

  const seleccionarCliente = (clienteSeleccionado) => {
    setCliente({
      nombre: clienteSeleccionado.nombre || '',
      apellido: clienteSeleccionado.apellido || '',
      direccion: clienteSeleccionado.direccion || '',
      email: clienteSeleccionado.email || '',
      telefono: clienteSeleccionado.telefono || '',
      cuit: clienteSeleccionado.cuit || '',
      condicionFiscal: clienteSeleccionado.condicionFiscal || '',
      observaciones: clienteSeleccionado.observaciones || '',
    });
    setNombreClienteInput(`${clienteSeleccionado.nombre || ''} ${clienteSeleccionado.apellido || ''}`.trim());
    setError('');
  };

  const verRemitoHistorial = (remito) => {
    setCliente(remito.cliente);
    setNombreClienteInput(`${remito.cliente.nombre || ''} ${remito.cliente.apellido || ''}`.trim());
    setProductos(remito.productos);
    setNumeroRemito(remito.numero);
    setFechaRemito(remito.fecha || new Date().toISOString());
    setMostrarRemito(true);
    setMostrarHistorial(false);
  };

  const nuevoRemito = () => {
    setMostrarRemito(false);
    setCliente({ nombre: '', apellido: '', direccion: '', email: '', telefono: '', cuit: '', condicionFiscal: '', observaciones: '' });
    setNombreClienteInput('');
    setFechaRemito(new Date().toISOString());
    setProductos([]);
    setError('');
    setMensajeExito('');
    
    const numActual = parseInt(numeroRemito.split('-')[1]);
    setNumeroRemito(`0001-${(numActual + 1).toString().padStart(8, '0')}`);
  };

  const esAdmin = sesion.autenticado && sesion.rol === 'admin';
  const tienePermiso = (seccion) => {
    if (!sesion.autenticado) return false;
    if (sesion.rol === 'admin') return true;
    return !!sesion.permisos?.[seccion];
  };

  const handleMenuClick = (key) => {
    if (!tienePermiso(key)) {
      setError('⚠️ Tu perfil no tiene permisos para esa sección.');
      return;
    }

    setSeccionActiva(key);

    if (key === 'historial') {
      setMostrarHistorial(true);
      return;
    }

    if (key === 'config') {
      if (!esAdmin) {
        setError('⚠️ La sección Configuración es solo para administradores.');
        return;
      }
    }
  };

  const validarEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');

  const iniciarSesion = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!loginForm.email.trim()) errors.email = 'Este campo es obligatorio.';
    else if (!validarEmail(loginForm.email.trim())) errors.email = 'Ingresá un email válido.';
    if (!loginForm.password) errors.password = 'Este campo es obligatorio.';
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAuthError('');
    setAuthBusy((prev) => ({ ...prev, login: true }));
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      if (loginError || !data?.user) {
        setAuthError('Email o contraseña incorrectos.');
        return;
      }

      setLoginForm((prev) => ({ ...prev, password: '' }));
      setAuthMessage('Ingresaste correctamente.');
      pushToast('success', 'Ingresaste correctamente.');
    } finally {
      setAuthBusy((prev) => ({ ...prev, login: false }));
    }
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!registerForm.nombre.trim()) errors.nombre = 'Este campo es obligatorio.';
    if (!registerForm.email.trim()) errors.email = 'Este campo es obligatorio.';
    else if (!validarEmail(registerForm.email.trim())) errors.email = 'Ingresá un email válido.';
    if (!registerForm.telefono.trim()) errors.telefono = 'Este campo es obligatorio.';
    if (!registerForm.password) errors.password = 'Este campo es obligatorio.';
    else if (registerForm.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    else if (!esFuerte(registerForm.password)) errors.password = 'Usa mayúscula, número y símbolo. (ej: Agua2024!)';
    if (!registerForm.confirmPassword) errors.confirmPassword = 'Este campo es obligatorio.';
    else if (registerForm.password !== registerForm.confirmPassword) errors.confirmPassword = 'La contraseña no coincide.';
    if (!registerForm.aceptaTerminos) errors.aceptaTerminos = 'Debés aceptar términos y condiciones.';

    setRegisterErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAuthError('');
    setAuthBusy((prev) => ({ ...prev, register: true }));

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registerForm.email.trim(),
        password: registerForm.password,
        options: {
          data: {
            nombre: registerForm.nombre.trim(),
            telefono: registerForm.telefono.trim(),
            rol: 'admin',
          },
        },
      });

      if (signUpError) {
        setAuthError(signUpError.message || 'No se pudo crear la cuenta.');
        return;
      }

      if (!data?.session) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: registerForm.email.trim(),
          password: registerForm.password,
        });

        if (loginError) {
          setAuthMessage('Cuenta creada correctamente. Iniciá sesión para continuar.');
          setAuthTab('login');
          pushToast('success', 'Cuenta creada correctamente.');
          return;
        }
      }

      setAuthMessage('Cuenta creada correctamente.');
      pushToast('success', 'Cuenta creada correctamente.');
    } finally {
      setAuthBusy((prev) => ({ ...prev, register: false }));
    }
  };

  const recuperarPassword = async () => {
    setAuthError('');
    const email = forgotEmail.trim();
    if (!validarEmail(email)) {
      setAuthError('Ingresá un email válido para recuperar contraseña.');
      return;
    }

    setAuthBusy((prev) => ({ ...prev, recover: true }));
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (resetError) {
        setAuthError('No se pudo iniciar recuperación de contraseña.');
        return;
      }

      setAuthMessage('Si el email está registrado, recibirás instrucciones para recuperar tu contraseña.');
      pushToast('success', 'Solicitud de recuperación enviada.');
    } finally {
      setAuthBusy((prev) => ({ ...prev, recover: false }));
    }
  };

  const actualizarPasswordRecuperacion = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!resetForm.password) errors.password = 'Este campo es obligatorio.';
    else if (resetForm.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    else if (!esFuerte(resetForm.password)) errors.password = 'Usa mayúscula, número y símbolo. (ej: Agua2024!)';
    if (!resetForm.confirmPassword) errors.confirmPassword = 'Este campo es obligatorio.';
    else if (resetForm.password !== resetForm.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
    setResetErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAuthError('');
    setAuthBusy((prev) => ({ ...prev, reset: true }));
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: resetForm.password });
      if (updateError) {
        setAuthError('No se pudo actualizar la contraseña.');
        return;
      }

      await supabase.auth.signOut();
      setIsRecoveryFlow(false);
      setResetForm({ password: '', confirmPassword: '' });
      setAuthTab('login');
      setAuthMessage('Contraseña actualizada correctamente. Iniciá sesión.');
      pushToast('success', 'Contraseña actualizada correctamente.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setAuthBusy((prev) => ({ ...prev, reset: false }));
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setSesion({ autenticado: false, usuario: '', username: '', rol: '', permisos: {} });
    setSeccionActiva('remitos');
    setMensajeExito('Sesión cerrada correctamente.');
    pushToast('success', 'Sesión cerrada correctamente.');
  };

  const menuItems = [
    { key: 'remitos', icon: <FileText size={18} />, label: 'Remitos', active: true },
    { key: 'clientes', icon: <Users size={18} />, label: 'Clientes' },
    { key: 'productos', icon: <Boxes size={18} />, label: 'Productos' },
    { key: 'historial', icon: <History size={18} />, label: 'Historial' },
    { key: 'config', icon: <Settings size={18} />, label: 'Configuración' },
  ];

  const nombreClienteCompleto = nombreClienteInput || `${cliente.nombre} ${cliente.apellido}`.trim();
  const formatoMoneda = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO);
    if (Number.isNaN(fecha.getTime())) return '-';

    const fechaLegible = fecha
      .toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace('.', '');
    const horaLegible = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${fechaLegible} · ${horaLegible}`;
  };

  const buildClienteKey = (clienteData = {}) => {
    const nombre = (clienteData.nombre || '').trim();
    const apellido = (clienteData.apellido || '').trim();
    const razonSocial = (clienteData.razonSocial || '').trim();
    const etiqueta = [apellido, nombre].filter(Boolean).join(', ') || razonSocial || 'Cliente sin nombre';
    const direccion = (clienteData.direccion || '').trim().toLowerCase();
    const telefono = (clienteData.telefono || '').trim();
    return `${etiqueta}__${direccion}__${telefono}`;
  };

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '64px', width: '64px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Cargando sistema...</p>
        </div>
        {toastUI}
      </div>
    );
  }

  if (!authInicializado) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f4f4' }}>
        <p style={{ color: '#4b5563', fontSize: '18px' }}>Inicializando acceso...</p>
        {toastUI}
      </div>
    );
  }

  if (!sesion.autenticado) {
    return (
      <div className="auth-layout">
        <section className="auth-left">
          {empresa.logo && <img src={empresa.logo} alt="Aguas Mar MR" className="auth-logo" />}
          <h1>Bienvenido a Aguas Mar MR</h1>
          <p>Sistema de remitos diseñado para simplificar la carga, gestión, impresión y descarga de remitos.</p>

          <div className="auth-benefits">
            <div>
              <h3>Gestión simple</h3>
              <p>Permite crear remitos de manera rápida y ordenada.</p>
            </div>
            <div>
              <h3>Remitos profesionales</h3>
              <p>Genera documentación clara, prolija y lista para imprimir o descargar.</p>
            </div>
            <div>
              <h3>Acceso seguro</h3>
              <p>Protege los datos de la empresa, clientes y remitos.</p>
            </div>
          </div>
        </section>

        <section className="auth-right">
          <div className="auth-card">
            {!isRecoveryFlow && (
              <div className="auth-tabs">
                <button type="button" className={authTab === 'login' ? 'active' : ''} onClick={() => setAuthTab('login')}>Iniciar sesión</button>
                <button type="button" className={authTab === 'register' ? 'active' : ''} onClick={() => setAuthTab('register')}>Registrarse</button>
              </div>
            )}

            {isRecoveryFlow ? (
              <form className="auth-form" onSubmit={actualizarPasswordRecuperacion}>
                <h2>Nueva contraseña</h2>
                <label>Nueva contraseña</label>
                <div className="auth-password-input-wrapper">
                  <input type={showPassword.reset ? "text" : "password"} disabled={authBusy.reset} value={resetForm.password} onChange={(e) => { setResetForm({ ...resetForm, password: e.target.value }); setPasswordStrength({ ...passwordStrength, reset: validarContraseñaFuerte(e.target.value) }); }} placeholder="Ingresá tu nueva contraseña" />
                  <button type="button" tabIndex="-1" onClick={() => setShowPassword({ ...showPassword, reset: !showPassword.reset })} className="auth-password-toggle">
                    {showPassword.reset ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {resetForm.password && <div className="auth-password-strength"><span className={`strength-bar strength-${passwordStrength.reset}`}></span></div>}
                {resetErrors.password && <span className="auth-error-inline">{resetErrors.password}</span>}

                <label>Confirmar contraseña</label>
                <div className="auth-password-input-wrapper">
                  <input type={showPassword.resetConfirm ? "text" : "password"} disabled={authBusy.reset} value={resetForm.confirmPassword} onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })} placeholder="Confirmá la nueva contraseña" />
                  <button type="button" tabIndex="-1" onClick={() => setShowPassword({ ...showPassword, resetConfirm: !showPassword.resetConfirm })} className="auth-password-toggle">
                    {showPassword.resetConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {resetErrors.confirmPassword && <span className="auth-error-inline">{resetErrors.confirmPassword}</span>}

                <button type="submit" className="auth-btn-primary" disabled={authBusy.reset}>
                  {authBusy.reset ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            ) : authTab === 'register' ? (
              <form className="auth-form" onSubmit={registrarUsuario}>
                <h2>Crear cuenta</h2>
                <label>Nombre y apellido</label>
                <input type="text" disabled={authBusy.register} value={registerForm.nombre} onChange={(e) => setRegisterForm({ ...registerForm, nombre: e.target.value })} placeholder="Ingresá tu nombre y apellido" />
                {registerErrors.nombre && <span className="auth-error-inline">{registerErrors.nombre}</span>}

                <label>Email</label>
                <input type="email" disabled={authBusy.register} value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="Ingresá tu email" />
                {registerErrors.email && <span className="auth-error-inline">{registerErrors.email}</span>}

                <label>Teléfono</label>
                <input type="text" disabled={authBusy.register} value={registerForm.telefono} onChange={(e) => setRegisterForm({ ...registerForm, telefono: e.target.value })} placeholder="Ingresá tu teléfono" />
                {registerErrors.telefono && <span className="auth-error-inline">{registerErrors.telefono}</span>}

                <label>Contraseña</label>
                <div className="auth-password-input-wrapper">
                  <input type={showPassword.register ? "text" : "password"} disabled={authBusy.register} value={registerForm.password} onChange={(e) => { setRegisterForm({ ...registerForm, password: e.target.value }); setPasswordStrength({ ...passwordStrength, register: validarContraseñaFuerte(e.target.value) }); }} placeholder="Creá una contraseña segura" />
                  <button type="button" tabIndex="-1" onClick={() => setShowPassword({ ...showPassword, register: !showPassword.register })} className="auth-password-toggle">
                    {showPassword.register ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {registerForm.password && <div className="auth-password-strength"><span className={`strength-bar strength-${passwordStrength.register}`}></span></div>}
                {registerErrors.password && <span className="auth-error-inline">{registerErrors.password}</span>}

                <label>Confirmar contraseña</label>
                <div className="auth-password-input-wrapper">
                  <input type={showPassword.register ? "text" : "password"} disabled={authBusy.register} value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} placeholder="Confirmá tu contraseña" />
                  <button type="button" tabIndex="-1" onClick={() => setShowPassword({ ...showPassword, register: !showPassword.register })} className="auth-password-toggle">
                    {showPassword.register ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <label className="auth-checkbox">
                  <input type="checkbox" disabled={authBusy.register} checked={registerForm.aceptaTerminos} onChange={(e) => setRegisterForm({ ...registerForm, aceptaTerminos: e.target.checked })} />
                  Acepto los términos y condiciones
                </label>
                {registerErrors.aceptaTerminos && <span className="auth-error-inline">{registerErrors.aceptaTerminos}</span>}

                <button type="submit" className="auth-btn-primary" disabled={authBusy.register}>{authBusy.register ? 'Creando...' : 'Crear cuenta'}</button>
                <p className="auth-switch">¿Ya tenés cuenta? <button type="button" onClick={() => setAuthTab('login')}>Iniciar sesión</button></p>
              </form>
            ) : (
              <form className="auth-form" onSubmit={iniciarSesion}>
                <h2>Iniciar sesión</h2>
                <label>Email</label>
                <input type="email" disabled={authBusy.login} value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="Ingresá tu email" />
                {loginErrors.email && <span className="auth-error-inline">{loginErrors.email}</span>}

                <label>Contraseña</label>
                <div className="auth-password-input-wrapper">
                  <input type={showPassword.login ? "text" : "password"} disabled={authBusy.login} value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Ingresá tu contraseña" />
                  <button type="button" tabIndex="-1" onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })} className="auth-password-toggle">
                    {showPassword.login ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginErrors.password && <span className="auth-error-inline">{loginErrors.password}</span>}

                <label className="auth-checkbox">
                  <input type="checkbox" disabled={authBusy.login} checked={loginForm.remember} onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })} />
                  Recordarme
                </label>

                <div className="auth-forgot">
                  <input type="email" disabled={authBusy.recover || authBusy.login} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Email para recuperar contraseña" />
                  <button type="button" disabled={authBusy.recover || authBusy.login} onClick={recuperarPassword}>{authBusy.recover ? 'Enviando...' : 'Olvidé mi contraseña'}</button>
                </div>

                <button type="submit" className="auth-btn-primary" disabled={authBusy.login}>{authBusy.login ? 'Ingresando...' : 'Iniciar sesión'}</button>
                <p className="auth-switch">¿No tenés cuenta? <button type="button" onClick={() => setAuthTab('register')}>Registrarse</button></p>
              </form>
            )}

            {authError && <p className="auth-error-box">{authError}</p>}
            {authMessage && <p className="auth-success-box">{authMessage}</p>}
          </div>
          {toastUI}
        </section>
      </div>
    );
  }

  if (mostrarHistorial) {
    const grouped = historialRemitos.reduce((acc, remito) => {
      const clienteData = remito.cliente || {};
      const key = buildClienteKey(clienteData);

      if (!acc[key]) {
        const nombre = (clienteData.nombre || '').trim();
        const apellido = (clienteData.apellido || '').trim();
        const razonSocial = (clienteData.razonSocial || '').trim();

        acc[key] = {
          key,
          displayName: [apellido, nombre].filter(Boolean).join(', ') || razonSocial || 'Cliente sin nombre',
          cliente: clienteData,
          remitos: [],
          maxFecha: 0,
        };
      }

      acc[key].remitos.push(remito);
      const fecha = new Date(remito.fecha).getTime();
      if (!Number.isNaN(fecha) && fecha > acc[key].maxFecha) {
        acc[key].maxFecha = fecha;
      }

      return acc;
    }, {});

    let grupos = Object.values(grouped).map((grupo) => {
      const remitosOrdenados = [...grupo.remitos].sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaB - fechaA;
      });

      return {
        ...grupo,
        remitos: remitosOrdenados,
      };
    });

    const terminoBusqueda = busquedaCliente.trim().toLowerCase();
    if (terminoBusqueda) {
      grupos = grupos.filter((grupo) => {
        const clienteData = grupo.cliente || {};
        const campos = [
          grupo.displayName,
          clienteData.nombre,
          clienteData.apellido,
          clienteData.razonSocial,
          clienteData.direccion,
          clienteData.telefono,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());

        return campos.some((texto) => texto.includes(terminoBusqueda));
      });
    }

    if (filtroHistorial === 'recientes') {
      grupos.sort((a, b) => b.maxFecha - a.maxFecha);
    } else {
      grupos.sort((a, b) => a.displayName.localeCompare(b.displayName, 'es', { sensitivity: 'base', ignorePunctuation: true }));
    }

    const gruposMostrados = filtroHistorial === 'deuda'
      ? grupos
          .map((grupo) => ({
            ...grupo,
            remitos: grupo.remitos.filter((remito) => Number(remito?.saldoPendiente ?? remito?.deuda ?? 0) > 0),
          }))
          .filter((grupo) => grupo.remitos.length > 0)
      : grupos;

    const toggleCliente = (clienteKey) => {
      setClientesExpandidos((prev) => ({
        ...prev,
        [clienteKey]: !prev[clienteKey],
      }));
    };

    const volverAlSistema = () => {
      setMostrarHistorial(false);
      setSeccionActiva('remitos');
      setBusquedaCliente('');
      setFiltroHistorial('az');
    };

    const abrirNuevoRemitoDesdeHistorial = () => {
      setMostrarHistorial(false);
      setSeccionActiva('remitos');
      nuevoRemito();
    };

    const sinResultadosBusqueda = historialRemitos.length > 0 && busquedaCliente.trim() && gruposMostrados.length === 0;
    const sinResultadosFiltro = historialRemitos.length > 0 && !busquedaCliente.trim() && gruposMostrados.length === 0;
    const sinRemitos = historialRemitos.length === 0;

    return (
      <div className="rm-layout">
        <aside className="rm-sidebar">
          <div className="rm-sidebar-logo-wrap">
            {empresa.logo ? (
              <img src={empresa.logo} alt="Logo Aguas Mar MR" className="rm-sidebar-logo" />
            ) : (
              <div className="rm-sidebar-logo-placeholder">Logo</div>
            )}
          </div>

          <nav className="rm-sidebar-nav">
            {menuItems.map((item) => {
              const permitido = tienePermiso(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`rm-nav-item ${seccionActiva === item.key ? 'is-active' : ''} ${!permitido ? 'is-disabled' : ''}`}
                  onClick={() => handleMenuClick(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button type="button" className="rm-sidebar-user" onClick={cerrarSesion}>
            <div className="rm-user-avatar">MR</div>
            <span>Miguel Angel Roht</span>
          </button>
        </aside>

        <main className="rm-main rm-history-main">
          <div className="rm-history-shell">
            <header className="rm-history-header">
              <div>
                <h1>Historial de Remitos por Cliente</h1>
                <p>Los remitos se agrupan por cliente y se muestran en orden alfabético.</p>
              </div>

              <div className="rm-history-actions">
                <button type="button" className="rm-btn rm-btn-ghost" onClick={volverAlSistema}>
                  <ArrowLeft size={16} />
                  Volver
                </button>
                <button type="button" className="rm-btn rm-btn-primary" onClick={abrirNuevoRemitoDesdeHistorial}>
                  <Plus size={16} />
                  Nuevo Remito
                </button>
              </div>
            </header>

            <div className="rm-history-search-wrap">
              <Search size={18} aria-hidden="true" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar cliente por nombre, apellido o dirección"
              />
            </div>

            <div className="rm-history-filters">
              <button
                type="button"
                className={`rm-history-filter ${filtroHistorial === 'az' ? 'is-active' : ''}`}
                onClick={() => setFiltroHistorial('az')}
              >
                A-Z
              </button>
              <button
                type="button"
                className={`rm-history-filter ${filtroHistorial === 'recientes' ? 'is-active' : ''}`}
                onClick={() => setFiltroHistorial('recientes')}
              >
                <Calendar size={15} />
                Más recientes
              </button>
              <button
                type="button"
                className={`rm-history-filter ${filtroHistorial === 'deuda' ? 'is-active' : ''}`}
                onClick={() => setFiltroHistorial('deuda')}
              >
                Con deuda
              </button>
            </div>

            {sinRemitos && (
              <section className="rm-history-empty">
                <h3>Todavía no hay remitos cargados.</h3>
                <p>Cuando generes un remito, aparecerá en este historial agrupado por cliente.</p>
                <button type="button" className="rm-btn rm-btn-primary" onClick={abrirNuevoRemitoDesdeHistorial}>Crear primer remito</button>
              </section>
            )}

            {sinResultadosBusqueda && (
              <section className="rm-history-empty">
                <h3>No se encontraron clientes con esa búsqueda.</h3>
                <p>Revisá el nombre, apellido o dirección ingresada.</p>
              </section>
            )}

            {sinResultadosFiltro && (
              <section className="rm-history-empty">
                <h3>No hay clientes para este filtro.</h3>
                <p>Probá con A-Z o Más recientes para ver todos los remitos cargados.</p>
              </section>
            )}

            {!sinRemitos && !sinResultadosBusqueda && !sinResultadosFiltro && (
              <section className="rm-history-list">
                {gruposMostrados.map((grupo) => {
                  const isExpanded = clientesExpandidos[grupo.key] !== false;
                  return (
                    <article className="rm-history-client-card" key={grupo.key}>
                      <button type="button" className="rm-history-client-head" onClick={() => toggleCliente(grupo.key)}>
                        <div className="rm-history-client-meta">
                          <div className="rm-history-client-icon">
                            <User size={20} />
                          </div>
                          <div>
                            <h2>{grupo.displayName}</h2>
                            <p>{grupo.cliente?.direccion || 'Sin dirección cargada'}</p>
                          </div>
                        </div>
                        <div className="rm-history-client-right">
                          <span className="rm-history-count">{grupo.remitos.length} {grupo.remitos.length === 1 ? 'remito' : 'remitos'}</span>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="rm-history-remitos">
                          {grupo.remitos.map((remito, idx) => {
                            const cantidadItems = Array.isArray(remito.productos) ? remito.productos.length : 0;
                            return (
                              <div className="rm-history-remito-row" key={remito.id || `${remito.numero}-${idx}`}>
                                <div className="rm-history-remito-main">
                                  <div className="rm-history-remito-title-wrap">
                                    <strong>Remito N° {remito.numero}</strong>
                                    {idx === 0 && <span className="rm-history-badge-latest">Más reciente</span>}
                                  </div>
                                </div>

                                <div className="rm-history-remito-date">{formatearFechaHora(remito.fecha)}</div>

                                <div className="rm-history-remito-items">
                                  <Package size={15} />
                                  <span>{cantidadItems} {cantidadItems === 1 ? 'item' : 'items'}</span>
                                </div>

                                <div className="rm-history-remito-total">{formatoMoneda.format(Number(remito.total || 0))}</div>

                                <button type="button" className="rm-btn rm-btn-primary rm-history-view-btn" onClick={() => verRemitoHistorial(remito)}>
                                  Ver
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            )}
          </div>
        </main>
        {toastUI}
      </div>
    );
  }

  if (mostrarRemito) {
    return (
      <div className="rv-page">
        <header className="rv-topbar no-print">
          <div className="rv-topbar-left">
            {empresa.logo && <img src={empresa.logo} alt="Logo" className="rv-topbar-logo" />}
            <h1>Vista de Remito</h1>
          </div>
          <div className="rv-topbar-actions">
            <button type="button" className="rv-btn" onClick={() => setMostrarRemito(false)}>
              <ArrowLeft size={16} />
              Volver al sistema
            </button>
            <button type="button" className="rv-btn" onClick={descargarPDF}>
              <Download size={16} />
              Descargar PDF
            </button>
            <button type="button" className="rv-btn" onClick={imprimirRemito}>
              <Printer size={16} />
              Imprimir
            </button>
          </div>
        </header>

        <div className="rv-canvas">
          <article id="remito-para-imprimir" className="rv-sheet">
            <div className="rv-logo-wrap">
              {empresa.logo && <img src={empresa.logo} alt="Logo principal" className="rv-logo-main" />}
            </div>

            <hr className="rv-rule" />

            <section className="rv-grid-2">
              <div className="rv-block">
                <h2>{empresa.nombre}</h2>
                <p>{empresa.responsable}</p>
                <p>{empresa.direccion}</p>
                <p>Teléfono: {empresa.telefono}</p>
                <p>CUIT: {empresa.cuit}</p>
              </div>
              <div className="rv-block rv-doc-block">
                <h3>REMITO</h3>
                <p><strong>N°</strong> {numeroRemito}</p>
                <p><strong>Fecha</strong> {new Date(fechaRemito).toLocaleDateString('es-AR')}</p>
              </div>
            </section>

            <hr className="rv-rule" />

            <section className="rv-client">
              <h4>Datos del Cliente</h4>
              <div className="rv-grid-2">
                <div className="rv-block">
                  <p><strong>Nombre y Apellido / Razón Social:</strong> {nombreClienteCompleto || '-'}</p>
                  <p><strong>Domicilio:</strong> {cliente.direccion || '-'}</p>
                </div>
                <div className="rv-block">
                  <p><strong>Teléfono:</strong> {cliente.telefono || '-'}</p>
                  <p><strong>Email:</strong> {cliente.email || '-'}</p>
                </div>
              </div>
            </section>

            <hr className="rv-rule" />

            <section>
              <table className="rv-table">
                <thead>
                  <tr>
                    <th>Cantidad</th>
                    <th>Producto</th>
                    <th>Descripción</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>{producto.cantidad}</td>
                      <td>{producto.producto || '-'}</td>
                      <td>{producto.descripcion}</td>
                      <td>${producto.precioUnitario.toFixed(2)}</td>
                      <td>${(producto.cantidad * producto.precioUnitario).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <div className="rv-total-row">
              <span>TOTAL</span>
              <strong>${calcularTotal().toFixed(2)}</strong>
            </div>

            <hr className="rv-rule" />
            <p className="rv-sign">Firma y Aclaración</p>
          </article>
        </div>
        {toastUI}
      </div>
    );
  }

  return (
    <div className="rm-layout">
      <aside className="rm-sidebar">
        <div className="rm-sidebar-logo-wrap">
          {empresa.logo ? (
            <img src={empresa.logo} alt="Logo Aguas Mar MR" className="rm-sidebar-logo" />
          ) : (
            <div className="rm-sidebar-logo-placeholder">Logo</div>
          )}
        </div>

        <nav className="rm-sidebar-nav">
          {menuItems.map((item) => {
            const permitido = tienePermiso(item.key);
            return (
              <button
                key={item.key}
                type="button"
                className={`rm-nav-item ${seccionActiva === item.key ? 'is-active' : ''} ${!permitido ? 'is-disabled' : ''}`}
                onClick={() => handleMenuClick(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" className="rm-sidebar-user" onClick={cerrarSesion}>
          <div className="rm-user-avatar">MR</div>
          <span>
            {sesion.autenticado
              ? `${sesion.rol === 'admin' ? 'Admin' : 'Usuario'}: ${sesion.usuario}`
              : 'Sin sesión'}
          </span>
        </button>
      </aside>

      <main className="rm-main">
        <div className="rm-topbar">
          <div>
            <h1>Sistema de Remitos</h1>
            <p>Gestioná y generá remitos de forma simple y profesional.</p>
          </div>
          <button type="button" className="rm-btn rm-btn-primary" onClick={nuevoRemito}>
            <Plus size={18} />
            Nuevo Remito
          </button>
        </div>

        {error && (
          <div className="rm-alert rm-alert-error">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        {mensajeExito && (
          <div className="rm-alert rm-alert-success">
            <BadgeCheck size={18} />
            <p>{mensajeExito}</p>
          </div>
        )}

        {sesion.autenticado && seccionActiva === 'config' && (
          <section className="rm-card rm-config-card">
            <div className="rm-card-header">
              <h2>Configuración</h2>
            </div>
            <p className="rm-config-warning">
              Perfil actual: <strong>{sesion.rol === 'admin' ? 'Administrador' : 'Usuario común'}</strong>.
              La gestión de usuarios y permisos ahora se administra con Supabase Auth.
            </p>
          </section>
        )}

        {sesion.autenticado && seccionActiva !== 'config' && (
        <>
        <section className="rm-card rm-company-card">
          <div className="rm-card-header">
            <h2>Datos de la Empresa</h2>
            <button
              type="button"
              className="rm-btn rm-btn-ghost"
              onClick={() => {
                if (!(sesion.autenticado && sesion.rol === 'admin')) {
                  setError('⚠️ Solo un administrador puede editar la empresa.');
                  return;
                }
                editandoEmpresa ? guardarEmpresa() : setEditandoEmpresa(true);
              }}
            >
              {editandoEmpresa ? <><Save size={16} /> Guardar</> : <><Edit2 size={16} /> Editar</>}
            </button>
          </div>

          {editandoEmpresa ? (
            <div className="rm-company-edit-grid">
              <div>
                <label>Nombre</label>
                <input value={empresa.nombre} onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })} />
              </div>
              <div>
                <label>Responsable</label>
                <input value={empresa.responsable || ''} onChange={(e) => setEmpresa({ ...empresa, responsable: e.target.value })} />
              </div>
              <div>
                <label>CUIT</label>
                <input value={empresa.cuit} onChange={(e) => setEmpresa({ ...empresa, cuit: e.target.value })} />
              </div>
              <div>
                <label>Teléfono</label>
                <input value={empresa.telefono} onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })} />
              </div>
              <div className="span-2">
                <label>Dirección</label>
                <input value={empresa.direccion} onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })} />
              </div>
              <div className="span-2">
                <label>Email</label>
                <input type="email" value={empresa.email} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} />
              </div>
              <div className="span-2 rm-logo-row">
                {empresa.logo && <img src={empresa.logo} alt="Logo" className="rm-logo-preview" />}
                <label className="rm-btn rm-btn-ghost rm-upload-btn">
                  <Upload size={16} />
                  {empresa.logo ? 'Cambiar logo' : 'Subir logo'}
                  <input type="file" accept="image/*" onChange={subirLogo} />
                </label>
                {empresa.logo && (
                  <button type="button" className="rm-btn rm-btn-danger" onClick={() => setEmpresa({ ...empresa, logo: '' })}>
                    Eliminar logo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rm-company-inline">
              <div className="rm-company-logo-box">
                {empresa.logo && <img src={empresa.logo} alt="Logo" className="rm-company-logo" />}
              </div>
              <div className="rm-company-info">
                <h3>{empresa.nombre}</h3>
                <p>{empresa.responsable || 'Responsable'}</p>
                <p><BadgeCheck size={14} /> CUIT: {empresa.cuit}</p>
                <p><MapPin size={14} /> {empresa.direccion}</p>
                <p><Phone size={14} /> Teléfono: {empresa.telefono}</p>
              </div>
            </div>
          )}
        </section>

        <div className="rm-content-grid">
          <div className="rm-left-column">
            <section className="rm-card">
              <div className="rm-card-header">
                <h2>Datos del Cliente</h2>
              </div>

              {clientesGuardados.length > 0 && (
                <div className="rm-form-block">
                  <label>Clientes guardados</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const clienteSelec = JSON.parse(e.target.value);
                        seleccionarCliente(clienteSelec);
                      }
                    }}
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

              <div className="rm-form-grid">
                <div className="span-2">
                  <label>Nombre y Apellido / Razón Social *</label>
                  <input
                    type="text"
                    value={nombreClienteInput}
                    onChange={(e) => {
                      const nombreCompleto = e.target.value;
                      setNombreClienteInput(nombreCompleto);
                      const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
                      const nombre = partes.shift() || '';
                      const apellido = partes.join(' ');
                      setCliente({ ...cliente, nombre, apellido });
                    }}
                    placeholder="Ingrese nombre o razón social"
                  />
                </div>

                <div className="span-2">
                  <label>Domicilio *</label>
                  <input
                    type="text"
                    value={cliente.direccion}
                    onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                    placeholder="Ingrese domicilio"
                  />
                </div>

                <div>
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={cliente.telefono}
                    onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                    placeholder="Ingrese teléfono"
                  />
                </div>

                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={cliente.email}
                    onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                    placeholder="Ingrese email"
                  />
                </div>

                <div>
                  <label>CUIT</label>
                  <input
                    type="text"
                    value={cliente.cuit || ''}
                    onChange={(e) => setCliente({ ...cliente, cuit: e.target.value })}
                    placeholder="CUIT"
                  />
                </div>

                <div>
                  <label>Condición Fiscal</label>
                  <input
                    type="text"
                    value={cliente.condicionFiscal || ''}
                    onChange={(e) => setCliente({ ...cliente, condicionFiscal: e.target.value })}
                    placeholder="Ej: Responsable Inscripto"
                  />
                </div>

                <div className="span-2">
                  <label>Observaciones</label>
                  <textarea
                    value={cliente.observaciones || ''}
                    onChange={(e) => setCliente({ ...cliente, observaciones: e.target.value })}
                    placeholder="Ingrese observaciones (opcional)"
                  />
                </div>
              </div>
            </section>

            <section className="rm-card">
              <div className="rm-card-header">
                <h2>Agregar Productos</h2>
              </div>

              <div className="rm-product-entry-grid">
                <div>
                  <label>Producto</label>
                  <input
                    type="text"
                    value={nuevoProducto.producto}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, producto: e.target.value })}
                  />
                </div>
                <div>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoProducto.cantidad}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div>
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={nuevoProducto.descripcion}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
                  />
                </div>
                <div>
                  <label>Precio Unit.</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoProducto.precioUnitario}
                    onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioUnitario: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <button type="button" className="rm-btn rm-btn-secondary" onClick={agregarProducto}>
                <Plus size={16} />
                Agregar producto
              </button>

              <div className="rm-table-wrap">
                <table className="rm-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Descripción</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="rm-empty-row">No hay productos cargados</td>
                      </tr>
                    ) : (
                      productos.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.producto || 'Producto'}</td>
                          <td>{producto.cantidad}</td>
                          <td>{producto.descripcion}</td>
                          <td>${producto.precioUnitario.toFixed(2)}</td>
                          <td>${(producto.cantidad * producto.precioUnitario).toFixed(2)}</td>
                          <td>
                            <button type="button" className="rm-icon-btn" onClick={() => eliminarProducto(producto.id)}>
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rm-total-row">
                <span>Total General</span>
                <strong>${calcularTotal().toFixed(2)}</strong>
              </div>
            </section>
          </div>

          <aside className="rm-summary">
            <div className="rm-card rm-summary-card">
              <h2>Resumen del Remito</h2>
              <div className="rm-summary-line">
                <span>N° Remito</span>
                <strong>{numeroRemito}</strong>
              </div>
              <div className="rm-summary-line">
                <span>Fecha</span>
                <strong>{new Date().toLocaleDateString('es-AR')}</strong>
              </div>
              <div className="rm-summary-line">
                <span>Cliente</span>
                <strong>{nombreClienteCompleto || '—'}</strong>
              </div>
              <div className="rm-summary-line total">
                <span>Total</span>
                <strong>${calcularTotal().toFixed(2)}</strong>
              </div>

              <button type="button" className="rm-btn rm-btn-primary block" onClick={generarRemito} disabled={guardandoRemito}>
                <Eye size={16} />
                {guardandoRemito ? 'Guardando...' : 'Ver remito'}
              </button>
              <button type="button" className="rm-btn rm-btn-ghost block" onClick={generarEImprimir}>
                <Download size={16} />
                Descargar PDF
              </button>
              <button type="button" className="rm-btn rm-btn-ghost block" onClick={generarEImprimir}>
                <Printer size={16} />
                Imprimir
              </button>

              <p className="rm-connection-state">
                {estadoConexion === 'ok' ? 'Conectado a Supabase' : estadoConexion === 'error' ? 'Sin conexión a Supabase' : 'Verificando conexión...'}
              </p>

              {sesion.autenticado && (
                <button type="button" className="rm-btn rm-btn-ghost block" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              )}

              <div className="rm-session-badge">
                {sesion.autenticado ? `Perfil actual: ${sesion.rol === 'admin' ? 'Administrador' : 'Usuario común'}` : 'Sin sesión iniciada'}
              </div>
            </div>
          </aside>
        </div>
        </>
        )}

      </main>
      {toastUI}
    </div>
  );
};

export default SistemaRemitos;