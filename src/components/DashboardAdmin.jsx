import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Home, User, Users, Stethoscope, Calendar, LogOut, Plus, Edit, Save, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  API_BASE_URL
} from '../config';
import Notificaciones from './Notificaciones';

function DashboardAdmin() {
  const [tab, setTab] = useState("dashboard");
  const [usuarios, setUsuarios] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState({
    usuarios: 1,
    medicos: 1,
    pacientes: 1,
    citas: 1
  });
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const datePickerRef = useRef(null);

  // Nuevos estados para el manejo de usuarios
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState({
    CedulaUsuario: '',
    NombreUsuario: '',
    PasswordHash: '',
    Activo: true,
    Rol: 'Usuario'
  });

  // Nuevos estados para el manejo de médicos
  const [modalMedicoAbierto, setModalMedicoAbierto] = useState(false);
  const [modoEdicionMedico, setModoEdicionMedico] = useState(false);
  const [medicoActual, setMedicoActual] = useState({
    Cedula: '',
    Nombres: '',
    Apellidos: '',
    Especialidad: '',
    Telefono: '',
    Email: '',
    Direccion: '',
    FechaIngreso: new Date().toISOString().split('T')[0]
  });

  // Nuevos estados para el manejo de pacientes
  const [modalPacienteAbierto, setModalPacienteAbierto] = useState(false);
  const [modoEdicionPaciente, setModoEdicionPaciente] = useState(false);
  const [pacienteActual, setPacienteActual] = useState({
    Cedula: '',
    Nombres: '',
    Apellidos: '',
    Telefono: '',
    Email: '',
    Direccion: '',
    FechaNacimiento: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0],
    FechaRegistro: new Date().toISOString().split('T')[0],
    Sexo: 'Masculino'
  });

  // Estados para manejo de citas
  const [modalCitaAbierto, setModalCitaAbierto] = useState(false);
  const [modoEdicionCita, setModoEdicionCita] = useState(false);
  const [citaActual, setCitaActual] = useState({
    IdCita: null,
    CedulaPaciente: '',
    CedulaMedico: '',
    FechaCita: new Date().toISOString().split('T')[0],
    HoraCita: '09:00',
    Motivo: '',
    Estado: 'Pendiente',
    AgendadoPor: localStorage.getItem('userId') || ''
  });

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setMostrarNotificacion(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (tab === "usuarios") fetchUsuarios();
    if (tab === "medicos") fetchMedicos();
    if (tab === "pacientes") fetchPacientes();
    fetchCitas(); // Siempre carga las citas
  }, [tab, currentPage]);

  const fetchUsuarios = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/Usuarios/ListarTodosUsuarios`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setUsuarios(Array.isArray(data.valor) ? data.valor : []);
  };

  const fetchMedicos = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/Medicos/ListarTodosMedicos`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setMedicos(Array.isArray(data.valor) ? data.valor : []);
  };

  const fetchPacientes = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/Pacientes/ListarTodosPacientes`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setPacientes(Array.isArray(data.valor) ? data.valor : []);
  };

  const fetchCitas = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/Citas/ListarTodasCitas`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    const todas = Array.isArray(data.valor) ? data.valor : [];
    setCitas(todas);

    const hoy = new Date().toISOString().split("T")[0];
    const citasDeHoy = todas.filter((c) => c.fechaCita?.split("T")[0] === hoy);
    setCitasHoy(citasDeHoy);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { key: "usuarios", label: "Usuarios", icon: <User size={18} /> },
    { key: "medicos", label: "Médicos", icon: <Stethoscope size={18} /> },
    { key: "pacientes", label: "Pacientes", icon: <Users size={18} /> },
    { key: "citas", label: "Citas", icon: <Calendar size={18} /> },
    { key: "notificaciones", label: "Notificaciones", icon: <Bell size={18} /> }, // <-- NUEVO
  ];

  // Notificaciones
  const getNotificacionesQuemadas = () => {
    const totalCitas = citas.length;
    const citasPendientes = citasHoy.filter(c => c.estado === "Pendiente").length;
    const citasCompletadas = citasHoy.filter(c => c.estado === "Completada").length;
    const citasHoyTotal = citasHoy.length;

    return [
      {
        id: 1,
        titulo: "Citas programadas para hoy",
        descripcion: `Tienes ${citasHoyTotal} citas programadas para el día de hoy`,
        tiempo: "Hace 5 minutos",
        tipo: "info",
        icono: "📅"
      },
      {
        id: 2,
        titulo: "Citas pendientes",
        descripcion: `${citasPendientes} citas están pendientes de confirmación`,
        tiempo: "Hace 10 minutos",
        tipo: "warning",
        icono: "⏳"
      },
      {
        id: 3,
        titulo: "Sistema actualizado",
        descripcion: `Base de datos sincronizada con ${totalCitas} citas totales`,
        tiempo: "Hace 15 minutos",
        tipo: "success",
        icono: "✅"
      }
    ];
  };

  const notificacionesQuemadas = getNotificacionesQuemadas();
  const totalNotificaciones = notificacionesQuemadas.length;

  // Datos para gráficos
  const getStatsData = () => {
    return [
      { name: 'Usuarios', value: usuarios.length, color: '#3B82F6' },
      { name: 'Médicos', value: medicos.length, color: '#10B981' },
      { name: 'Pacientes', value: pacientes.length, color: '#F59E0B' },
      { name: 'Citas', value: citas.length, color: '#8B5CF6' }
    ];
  };

  // Datos para gráfico de citas por fecha
  const getCitasPorFecha = () => {
    const { startDate, endDate } = dateRange[0];
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const citasDia = citas.filter(c => {
        const fechaCita = c.fechaCita ? new Date(c.fechaCita) : null;
        return fechaCita && isSameDay(fechaCita, day);
      });
      
      return {
        date: format(day, 'dd MMM', { locale: es }),
        citas: citasDia.length,
        completadas: citasDia.filter(c => c.estado === "Completada").length,
        pendientes: citasDia.filter(c => c.estado === "Pendiente").length
      };
    });
  };

  // Paginación
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return items.slice(startIndex, startIndex + perPage);
  };

  const changePage = (module, direction) => {
    setCurrentPage(prev => ({
      ...prev,
      [module]: direction === 'next' ? prev[module] + 1 : prev[module] - 1
    }));
  };

  // Funciones para manejo de citas
  const abrirModalNuevaCita = () => {
    setCitaActual({
      IdCita: null,
      CedulaPaciente: '',
      CedulaMedico: '',
      FechaCita: new Date().toISOString().split('T')[0],
      HoraCita: '09:00',
      Motivo: '',
      Estado: 'Pendiente',
      AgendadoPor: localStorage.getItem('userId') || ''
    });
    setModoEdicionCita(false);
    setModalCitaAbierto(true);
  };

  const abrirModalEditarCita = (cita) => {
    setCitaActual({
      IdCita: cita.idCita,
      CedulaPaciente: cita.cedulaPaciente,
      CedulaMedico: cita.cedulaMedico,
      FechaCita: cita.fechaCita ? cita.fechaCita.split('T')[0] : new Date().toISOString().split('T')[0],
      HoraCita: cita.horaCita || '09:00',
      Motivo: cita.motivo || '',
      Estado: cita.estado || 'Pendiente',
      AgendadoPor: cita.agendadoPor || localStorage.getItem('userId') || ''
    });
    setModoEdicionCita(true);
    setModalCitaAbierto(true);
  };

  const manejarCambioCita = (e) => {
    const { name, value } = e.target;
    setCitaActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const enviarFormularioCita = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      let response;
      const citaParaEnviar = {
        ...citaActual,
        IdCita: citaActual.IdCita ? parseInt(citaActual.IdCita) : 0
      };

      if (modoEdicionCita) {
        response = await fetch(`${API_BASE_URL}/Citas/ActualizarCita`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(citaParaEnviar)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/Citas/RegistrarCita`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(citaParaEnviar)
        });
      }

      const data = await response.json();
      
      if (data.esCorrecto) {
        alert(modoEdicionCita ? "Cita actualizada correctamente" : "Cita agendada correctamente");
        setModalCitaAbierto(false);
        fetchCitas();
      } else {
        alert(data.mensaje || "Error al procesar la solicitud");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al procesar la solicitud");
    }
  };

  const manejarCancelarCita = async (idCita) => {
    if (window.confirm("¿Estás seguro que deseas cancelar esta cita?")) {
      const token = localStorage.getItem("token");
      try {
        const cita = citas.find(c => c.idCita === idCita);
        if (!cita) {
          alert("No se encontró la cita");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/Citas/ActualizarCita`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...cita,
            Estado: 'programada' // Cambiamos el estado a "programada" para cancelar
          })
        });
        
        const data = await response.json();
        if (data.esCorrecto) {
          alert("Cita cancelada correctamente");
          fetchCitas();
        } else {
          alert(data.mensaje || "Error al cancelar la cita");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Ocurrió un error al cancelar la cita");
      }
    }
  };

  // Funciones para manejo de pacientes
  const abrirModalNuevoPaciente = () => {
    setPacienteActual({
      Cedula: '',
      Nombres: '',
      Apellidos: '',
      Telefono: '',
      Email: '',
      Direccion: '',
      FechaNacimiento: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0],
      FechaRegistro: new Date().toISOString().split('T')[0],
      Sexo: 'Masculino'
    });
    setModoEdicionPaciente(false);
    setModalPacienteAbierto(true);
  };

  const abrirModalEditarPaciente = (paciente) => {
    setPacienteActual({
      Cedula: paciente.cedula,
      Nombres: paciente.nombres,
      Apellidos: paciente.apellidos,
      Telefono: paciente.telefono,
      Email: paciente.email,
      Direccion: paciente.direccion,
      FechaNacimiento: paciente.fechaNacimiento ? paciente.fechaNacimiento.split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0],
      FechaRegistro: paciente.fechaRegistro ? paciente.fechaRegistro.split('T')[0] : new Date().toISOString().split('T')[0],
      Sexo: paciente.sexo || 'Masculino'
    });
    setModoEdicionPaciente(true);
    setModalPacienteAbierto(true);
  };

  const manejarCambioPaciente = (e) => {
    const { name, value } = e.target;
    setPacienteActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const enviarFormularioPaciente = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      let response;
      if (modoEdicionPaciente) {
        response = await fetch(`${API_BASE_URL}/Pacientes/ActualizarPaciente`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(pacienteActual)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/Pacientes/RegistrarPaciente`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(pacienteActual)
        });
      }

      const data = await response.json();
      
      if (data.esCorrecto) {
        alert(modoEdicionPaciente ? "Paciente actualizado correctamente" : "Paciente creado correctamente");
        setModalPacienteAbierto(false);
        fetchPacientes();
      } else {
        alert(data.mensaje || "Error al procesar la solicitud");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al procesar la solicitud");
    }
  };

  // Funciones para manejo de médicos
  const abrirModalNuevoMedico = () => {
    setMedicoActual({
      Cedula: '',
      Nombres: '',
      Apellidos: '',
      Especialidad: '',
      Telefono: '',
      Email: '',
      Direccion: '',
      FechaIngreso: new Date().toISOString().split('T')[0]
    });
    setModoEdicionMedico(false);
    setModalMedicoAbierto(true);
  };

  const abrirModalEditarMedico = (medico) => {
    setMedicoActual({
      Cedula: medico.cedula,
      Nombres: medico.nombres,
      Apellidos: medico.apellidos,
      Especialidad: medico.especialidad,
      Telefono: medico.telefono,
      Email: medico.email,
      Direccion: medico.direccion,
      FechaIngreso: medico.fechaIngreso ? medico.fechaIngreso.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setModoEdicionMedico(true);
    setModalMedicoAbierto(true);
  };

  const manejarCambioMedico = (e) => {
    const { name, value } = e.target;
    setMedicoActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const enviarFormularioMedico = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      let response;
      if (modoEdicionMedico) {
        response = await fetch(`${API_BASE_URL}/Medicos/ActualizarMedico`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(medicoActual)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/Medicos/Registrarmedico`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(medicoActual)
        });
      }

      const data = await response.json();
      
      if (data.esCorrecto) {
        alert(modoEdicionMedico ? "Médico actualizado correctamente" : "Médico creado correctamente");
        setModalMedicoAbierto(false);
        fetchMedicos();
      } else {
        alert(data.mensaje || "Error al procesar la solicitud");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al procesar la solicitud");
    }
  };

  // Funciones para manejo de usuarios
  const abrirModalNuevoUsuario = () => {
    setUsuarioActual({
      CedulaUsuario: '',
      NombreUsuario: '',
      PasswordHash: '',
      Activo: true,
      Rol: 'Usuario'
    });
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirModalEditarUsuario = (usuario) => {
    setUsuarioActual({
      CedulaUsuario: usuario.cedulaUsuario,
      NombreUsuario: usuario.nombreUsuario,
      PasswordHash: '', // No mostramos la contraseña por seguridad
      Activo: usuario.activo,
      Rol: usuario.rol
    });
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setUsuarioActual(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      let response;
      if (modoEdicion) {
        response = await fetch(`${API_BASE_URL}/Usuarios/ActualizarUsuario`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            CedulaUsuario: usuarioActual.CedulaUsuario,
            NombreUsuario: usuarioActual.NombreUsuario,
            Activo: usuarioActual.Activo,
            Rol: usuarioActual.Rol,
          })
        });
      } else {
        response = await fetch(`${API_BASE_URL}/Usuarios/RegistrarUsuario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(usuarioActual)
        });
      }

      const data = await response.json();
      
      if (data.esCorrecto) {
        alert(modoEdicion ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
        setModalAbierto(false);
        fetchUsuarios();
      } else {
        alert(data.mensaje || "Error al procesar la solicitud");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al procesar la solicitud");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <span>Admin</span>
          </h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => setTab(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
                    tab === item.key 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-700 hover:bg-blue-100"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => item.key === tab)?.label || "Dashboard"}
            </h1>
            
            <div className="flex items-center gap-6">
              {/* Filtro de fecha cuando esté en citas */}
              {tab === "citas" && (
                <div className="relative" ref={datePickerRef}>
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Calendar size={16} />
                    <span>
                      {format(dateRange[0].startDate, 'dd MMM yyyy')} - {format(dateRange[0].endDate, 'dd MMM yyyy')}
                    </span>
                  </button>
                  
                  {showDatePicker && (
                    <div className="absolute right-0 mt-2 z-50">
                      <DateRangePicker
                        onChange={item => setDateRange([item.selection])}
                        showSelectionPreview={true}
                        moveRangeOnFirstSelection={false}
                        months={2}
                        ranges={dateRange}
                        direction="horizontal"
                        locale={es}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notificaciones */}
              <div className="relative" ref={notificationRef}>
                <button
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMostrarNotificacion(!mostrarNotificacion)}
                >
                  <Bell className="text-blue-600 w-6 h-6" />
                  {totalNotificaciones > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {totalNotificaciones}
                    </span>
                  )}
                </button>

                {mostrarNotificacion && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-800">Notificaciones</h3>
                      <p className="text-sm text-gray-600">{totalNotificaciones} notificaciones</p>
                    </div>

                    <div className="p-4 border-b border-gray-200 bg-blue-50">
                      <div className="text-sm text-gray-800 font-medium space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">📅 Citas para hoy:</span>
                          <span className="text-blue-600">{citasHoy.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">⏳ Pendientes:</span>
                          <span className="text-yellow-600">
                            {citasHoy.filter((c) => c.estado === "Pendiente").length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {notificacionesQuemadas.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{notif.icono}</span>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 text-sm">
                                {notif.titulo}
                              </h4>
                              <p className="text-gray-600 text-xs mt-1">
                                {notif.descripcion}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {notif.tiempo}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Dashboard */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {getStatsData().map((stat) => (
                  <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                      >
                        {stat.name === 'Usuarios' && <Users size={24} />}
                        {stat.name === 'Médicos' && <Stethoscope size={24} />}
                        {stat.name === 'Pacientes' && <User size={24} />}
                        {stat.name === 'Citas' && <Calendar size={24} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de estadísticas */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">Resumen General</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getStatsData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico de citas recientes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">Citas Recientes</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={getCitasPorFecha()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="citas" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="completadas" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="pendientes" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Citas de hoy */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Citas para hoy</h3>
                {citasHoy.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {citasHoy.map((cita) => (
                          <tr key={cita.idCita}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cita.cedulaPaciente}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cita.cedulaMedico}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cita.horaCita}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                cita.estado === "Completada" ? "bg-green-100 text-green-800" :
                                cita.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {cita.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay citas programadas para hoy</p>
                )}
              </div>
            </div>
          )}

          {/* Usuarios */}
          {tab === "usuarios" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
                <button 
                  onClick={abrirModalNuevoUsuario}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Agregar Usuario</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginate(usuarios, currentPage.usuarios, itemsPerPage).map((u) => (
                      <tr key={u.cedulaUsuario}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.cedulaUsuario}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.nombreUsuario}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.rol}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => abrirModalEditarUsuario(u)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            <span>Editar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <button 
                  onClick={() => changePage('usuarios', 'prev')}
                  disabled={currentPage.usuarios === 1}
                  className={`px-4 py-2 border rounded-md ${currentPage.usuarios === 1 ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                <span>Página {currentPage.usuarios} de {Math.ceil(usuarios.length / itemsPerPage)}</span>
                <button 
                  onClick={() => changePage('usuarios', 'next')}
                  disabled={currentPage.usuarios === Math.ceil(usuarios.length / itemsPerPage)}
                  className={`px-4 py-2 border rounded-md ${currentPage.usuarios === Math.ceil(usuarios.length / itemsPerPage) ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Siguiente
                </button>
              </div>

              {/* Modal para agregar/editar usuario */}
              {modalAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        {modoEdicion ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
                      </h3>
                      <button 
                        onClick={() => setModalAbierto(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={enviarFormulario}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                          <input
                            type="text"
                            name="CedulaUsuario"
                            value={usuarioActual.CedulaUsuario}
                            onChange={manejarCambio}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            disabled={modoEdicion}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            name="NombreUsuario"
                            value={usuarioActual.NombreUsuario}
                            onChange={manejarCambio}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        {!modoEdicion && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input
                              type="password"
                              name="PasswordHash"
                              value={usuarioActual.PasswordHash}
                              onChange={manejarCambio}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required={!modoEdicion}
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                          <select
                            name="Rol"
                            value={usuarioActual.Rol}
                            onChange={manejarCambio}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="Usuario">Usuario</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Medico">Médico</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="Activo"
                            checked={usuarioActual.Activo}
                            onChange={manejarCambio}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">Usuario Activo</label>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setModalAbierto(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {modoEdicion ? 'Actualizar' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Médicos */}
          {tab === "medicos" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Gestión de Médicos</h2>
                <button 
                  onClick={abrirModalNuevoMedico}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Agregar Médico</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginate(medicos, currentPage.medicos, itemsPerPage).map((m) => (
                      <tr key={m.cedula}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.cedula}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${m.nombres} ${m.apellidos}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.especialidad}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.telefono}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => abrirModalEditarMedico(m)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            <span>Editar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <button 
                  onClick={() => changePage('medicos', 'prev')}
                  disabled={currentPage.medicos === 1}
                  className={`px-4 py-2 border rounded-md ${currentPage.medicos === 1 ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                <span>Página {currentPage.medicos} de {Math.ceil(medicos.length / itemsPerPage)}</span>
                <button 
                  onClick={() => changePage('medicos', 'next')}
                  disabled={currentPage.medicos === Math.ceil(medicos.length / itemsPerPage)}
                  className={`px-4 py-2 border rounded-md ${currentPage.medicos === Math.ceil(medicos.length / itemsPerPage) ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Siguiente
                </button>
              </div>

              {/* Modal para agregar/editar médico */}
              {modalMedicoAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        {modoEdicionMedico ? 'Editar Médico' : 'Agregar Nuevo Médico'}
                      </h3>
                      <button 
                        onClick={() => setModalMedicoAbierto(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={enviarFormularioMedico}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                          <input
                            type="text"
                            name="Cedula"
                            value={medicoActual.Cedula}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            disabled={modoEdicionMedico}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                          <input
                            type="text"
                            name="Nombres"
                            value={medicoActual.Nombres}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                          <input
                            type="text"
                            name="Apellidos"
                            value={medicoActual.Apellidos}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                          <input
                            type="text"
                            name="Especialidad"
                            value={medicoActual.Especialidad}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                          <input
                            type="tel"
                            name="Telefono"
                            value={medicoActual.Telefono}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            name="Email"
                            value={medicoActual.Email}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                          <input
                            type="text"
                            name="Direccion"
                            value={medicoActual.Direccion}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                          <input
                            type="date"
                            name="FechaIngreso"
                            value={medicoActual.FechaIngreso}
                            onChange={manejarCambioMedico}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setModalMedicoAbierto(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {modoEdicionMedico ? 'Actualizar' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pacientes */}
          {tab === "pacientes" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Gestión de Pacientes</h2>
                <button 
                  onClick={abrirModalNuevoPaciente}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Agregar Paciente</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Nac.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginate(pacientes, currentPage.pacientes, itemsPerPage).map((p) => (
                      <tr key={p.cedula}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.cedula}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${p.nombres} ${p.apellidos}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {p.fechaNacimiento ? format(new Date(p.fechaNacimiento), 'dd/MM/yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.telefono}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => abrirModalEditarPaciente(p)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            <span>Editar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <button 
                  onClick={() => changePage('pacientes', 'prev')}
                  disabled={currentPage.pacientes === 1}
                  className={`px-4 py-2 border rounded-md ${currentPage.pacientes === 1 ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                <span>Página {currentPage.pacientes} de {Math.ceil(pacientes.length / itemsPerPage)}</span>
                <button 
                  onClick={() => changePage('pacientes', 'next')}
                  disabled={currentPage.pacientes === Math.ceil(pacientes.length / itemsPerPage)}
                  className={`px-4 py-2 border rounded-md ${currentPage.pacientes === Math.ceil(pacientes.length / itemsPerPage) ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Siguiente
                </button>
              </div>

              {/* Modal para agregar/editar paciente */}
              {modalPacienteAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        {modoEdicionPaciente ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}
                      </h3>
                      <button 
                        onClick={() => setModalPacienteAbierto(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={enviarFormularioPaciente}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                          <input
                            type="text"
                            name="Cedula"
                            value={pacienteActual.Cedula}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            disabled={modoEdicionPaciente}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                          <input
                            type="text"
                            name="Nombres"
                            value={pacienteActual.Nombres}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                          <input
                            type="text"
                            name="Apellidos"
                            value={pacienteActual.Apellidos}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                          <select
                            name="Sexo"
                            value={pacienteActual.Sexo}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                          <input
                            type="tel"
                            name="Telefono"
                            value={pacienteActual.Telefono}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            name="Email"
                            value={pacienteActual.Email}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                          <input
                            type="date"
                            name="FechaNacimiento"
                            value={pacienteActual.FechaNacimiento}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Registro</label>
                          <input
                            type="date"
                            name="FechaRegistro"
                            value={pacienteActual.FechaRegistro}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                          <input
                            type="text"
                            name="Direccion"
                            value={pacienteActual.Direccion}
                            onChange={manejarCambioPaciente}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setModalPacienteAbierto(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {modoEdicionPaciente ? 'Actualizar' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Citas */}
          {tab === "citas" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Gestión de Citas</h2>
                <button 
                  onClick={abrirModalNuevaCita}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Agendar Cita</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginate(citas, currentPage.citas, itemsPerPage).map((cita) => (
                      <tr key={cita.idCita}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cita.idCita}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pacientes.find(p => p.cedula === cita.cedulaPaciente)?.nombres || cita.cedulaPaciente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {medicos.find(m => m.cedula === cita.cedulaMedico)?.nombres || cita.cedulaMedico}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cita.fechaCita ? format(new Date(cita.fechaCita), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cita.estado === "Completada" ? "bg-green-100 text-green-800" :
                            cita.estado === "Confirmada" ? "bg-blue-100 text-blue-800" :
                            cita.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {cita.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => abrirModalEditarCita(cita)}
                            className="text-blue-600 hover:text-blue-900 mr-3 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            <span>Editar</span>
                          </button>
                          {cita.estado !== 'Cancelada' && cita.estado !== 'Completada' && (
                            <button 
                              onClick={() => manejarCancelarCita(cita.idCita)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <X size={14} />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <button 
                  onClick={() => changePage('citas', 'prev')}
                  disabled={currentPage.citas === 1}
                  className={`px-4 py-2 border rounded-md ${currentPage.citas === 1 ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                <span>Página {currentPage.citas} de {Math.ceil(citas.length / itemsPerPage)}</span>
                <button 
                  onClick={() => changePage('citas', 'next')}
                  disabled={currentPage.citas === Math.ceil(citas.length / itemsPerPage)}
                  className={`px-4 py-2 border rounded-md ${currentPage.citas === Math.ceil(citas.length / itemsPerPage) ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Siguiente
                </button>
              </div>

              {/* Modal para agregar/editar cita */}
              {modalCitaAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        {modoEdicionCita ? 'Editar Cita' : 'Agendar Nueva Cita'}
                      </h3>
                      <button 
                        onClick={() => setModalCitaAbierto(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={enviarFormularioCita}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {modoEdicionCita && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Cita</label>
                            <input
                              type="text"
                              value={citaActual.IdCita}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                              disabled
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                          <select
                            name="CedulaPaciente"
                            value={citaActual.CedulaPaciente}
                            onChange={manejarCambioCita}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="">Seleccione un paciente</option>
                            {pacientes.map(paciente => (
                              <option key={paciente.cedula} value={paciente.cedula}>
                                {paciente.nombres} {paciente.apellidos} ({paciente.cedula})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
                          <select
                            name="CedulaMedico"
                            value={citaActual.CedulaMedico}
                            onChange={manejarCambioCita}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="">Seleccione un médico</option>
                            {medicos.map(medico => (
                              <option key={medico.cedula} value={medico.cedula}>
                                {medico.nombres} {medico.apellidos} ({medico.especialidad})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                          <input
                            type="date"
                            name="FechaCita"
                            value={citaActual.FechaCita}
                            onChange={manejarCambioCita}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                          <input
                            type="time"
                            name="HoraCita"
                            value={citaActual.HoraCita}
                            onChange={manejarCambioCita}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                            min="08:00"
                            max="18:00"
                            step="900"
                          />
                        </div>
                        
                        {modoEdicionCita && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                              name="Estado"
                              value={citaActual.Estado}
                              onChange={manejarCambioCita}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            >
                              <option value="programada">programada</option>
                              <option value="completada">completada</option>
                              <option value="cancelada">cancelada</option>
                            </select>
                          </div>
                        )}
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                          <textarea
                            name="Motivo"
                            value={citaActual.Motivo}
                            onChange={manejarCambioCita}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setModalCitaAbierto(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {modoEdicionCita ? 'Actualizar' : 'Agendar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardAdmin;