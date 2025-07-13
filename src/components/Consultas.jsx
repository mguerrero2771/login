import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import { Search, Bell, ChevronDown, X, CheckCircle } from 'lucide-react';
import {
  API_BASE_URL,
  API_CITAS_BASE_URL,
  API_NOTIFICACIONES,
} from '../config';

const Consultas = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('consultas');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [subModule, setSubModule] = useState('consultas');
  const [userName, setUserName] = useState('Médico');

  const [consultas, setConsultas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [citasProgramadas, setCitasProgramadas] = useState([]);
  const [loadingConsultas, setLoadingConsultas] = useState(false);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [errorConsultas, setErrorConsultas] = useState('');
  const [errorCitas, setErrorCitas] = useState('');
  const [selectedCita, setSelectedCita] = useState(null);
  const [updatingCita, setUpdatingCita] = useState(null);

  const [showConsultaForm, setShowConsultaForm] = useState(false);
  const [consultaForm, setConsultaForm] = useState({
    idCita: '',
    notas: '',
    precioBase: '',
    aceptoTratamiento: false,
    paciente: '',
    fecha: '',
    motivo: ''
  });
  const [formError, setFormError] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'MD';
    const parts = name.split(' ');
    let initials = '';
    if (parts.length > 0) initials += parts[0][0];
    if (parts.length > 1) initials += parts[1][0];
    return initials.toUpperCase();
  };

  // Fetch consultations
  useEffect(() => {
     // Obtener el nombre del médico del localStorage
    const storedName = localStorage.getItem('medicoNombre');
    if (storedName) {
      setUserName(storedName);
    } else {
      // Si no está en localStorage, intentar obtener de userData
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const nombreCompleto = user.nombre || `${user.nombres || ''} ${user.apellidos || ''}`.trim();
          if (nombreCompleto) {
            setUserName(nombreCompleto);
          }
        } catch (error) {
          console.error('Error al parsear userData:', error);
        }
      }
    }
    const fetchConsultas = async () => {
      const token = localStorage.getItem('token');
      try {
        setLoadingConsultas(true);
        const response = await fetch(`${API_BASE_URL}/Consultas/ListarTodasconsultas`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (data && data.esCorrecto && Array.isArray(data.valor)) {
          setConsultas(data.valor);
        } else {
          setErrorConsultas('No se encontraron consultas');
        }
      } catch (err) {
        setErrorConsultas('Error al obtener consultas: ' + err.message);
      } finally {
        setLoadingConsultas(false);
      }
    };

    if (subModule === 'consultas') fetchConsultas();
  }, [subModule]);

  // Fetch appointments
  useEffect(() => {
    const fetchCitas = async () => {
      const token = localStorage.getItem('token');
      const cedula = localStorage.getItem('cedula');
      if (!cedula) {
        setErrorCitas('No se encontró la cédula del médico');
        return;
      }

      try {
        setLoadingCitas(true);
        const response = await fetch(`${API_CITAS_BASE_URL}/ObtenerCitasxCedula/${cedula}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (data.esCorrecto && Array.isArray(data.valor)) {
          setCitas(data.valor);
          // Filtrar solo las citas con estado "programada"
          const citasProgr = data.valor.filter(cita => 
            cita.estado?.toLowerCase() === 'programada' || 
            cita.estado?.toLowerCase() === 'programado'
          );
          setCitasProgramadas(citasProgr);
        } else {
          setErrorCitas('No se encontraron citas');
        }
      } catch (err) {
        setErrorCitas('Error al obtener citas: ' + err.message);
      } finally {
        setLoadingCitas(false);
      }
    };

    fetchCitas();
  }, []);

  const handleSelectCita = (cita) => {
    setSelectedCita(cita);
    setConsultaForm({
      ...consultaForm,
      idCita: cita.idCita || '',
      paciente: cita.cedulaPaciente || '',
      fecha: cita.fechaCita || '',
      motivo: cita.motivo || ''
    });
    setShowConsultaForm(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  const handleConsultaInput = (e) => {
    const { name, value, type, checked } = e.target;
    setConsultaForm({
      ...consultaForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleConsultaSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!consultaForm.idCita || !consultaForm.precioBase) {
      setFormError('ID Cita y Precio Base son obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/Consultas/RegistrarConsulta`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          idConsulta: 0,
          idCita: Number(consultaForm.idCita),
          fecha: consultaForm.fecha || new Date().toISOString(),
          notas: consultaForm.notas,
          precioBase: Number(consultaForm.precioBase),
          aceptoTratamiento: consultaForm.aceptoTratamiento
        })
      });
      
      const data = await res.json();
      if (!res.ok || !data.esCorrecto) {
        throw new Error(data.mensaje || 'Error al registrar consulta');
      }

      // Reset form and update state
      setShowConsultaForm(false);
      setConsultaForm({
        idCita: '',
        notas: '',
        precioBase: '',
        aceptoTratamiento: false,
        paciente: '',
        fecha: '',
        motivo: ''
      });
      setSelectedCita(null);

      // Update appointments status to "completada"
      await actualizarEstadoCita(consultaForm.idCita, 'completada');

      // Refresh consultations list
      const updated = await fetch(`${API_BASE_URL}/Consultas/ListarTodasconsultas`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      const updatedData = await updated.json();
      if (updatedData && updatedData.esCorrecto && Array.isArray(updatedData.valor)) {
        setConsultas(updatedData.valor);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const actualizarEstadoCita = async (idCita, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/Citas/ActualizarEstadoCitaxId/${idCita}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const data = await res.json();
      if (!res.ok || !data.esCorrecto) {
        throw new Error(data.mensaje || 'Error al actualizar estado');
      }
      
      // Actualizar el estado en todas las listas
      setCitas(prev => prev.map(c => c.idCita === idCita ? { ...c, estado: nuevoEstado } : c));
      
      // Remover de citas programadas si el estado cambió a completada
      if (nuevoEstado === 'completada') {
        setCitasProgramadas(prev => prev.filter(c => c.idCita !== idCita));
      }
      
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  // Función para marcar cita como completada directamente
  const marcarCitaComoCompletada = async (idCita) => {
    setUpdatingCita(idCita);
    try {
      const resultado = await actualizarEstadoCita(idCita, 'completada');
      if (resultado) {
        // Mostrar mensaje de éxito
        alert('Cita marcada como completada exitosamente');
      } else {
        alert('Error al actualizar el estado de la cita');
      }
    } catch (error) {
      alert('Error al actualizar el estado de la cita');
    } finally {
      setUpdatingCita(null);
    }
  };

  const actualizarConsulta = async (consultaActualizada) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/Consultas/ActualizarConsulta`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(consultaActualizada)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar consulta:', error);
      return { esCorrecto: false, mensaje: 'Error al actualizar consulta' };
    }
  };

  const handleAceptoTratamientoChange = async (consulta, isChecked) => {
    const consultaActualizada = {
      ...consulta,
      aceptoTratamiento: isChecked
    };
    
    const resultado = await actualizarConsulta(consultaActualizada);
    
    if (resultado.esCorrecto) {
      setConsultas(prevConsultas => 
        prevConsultas.map(c => 
          c.idConsulta === consulta.idConsulta 
            ? { ...c, aceptoTratamiento: isChecked } 
            : c
        )
      );
    } else {
      alert(resultado.mensaje || 'Error al actualizar');
    }
  };

  const getEstadoBadgeStyle = (estado) => {
    const estadoLower = estado?.toLowerCase() || 'pendiente';
    switch (estadoLower) {
      case 'completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'programada':
      case 'programado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Combine consultations with their corresponding appointments
  const consultasConCita = consultas.map((consulta) => {
    const cita = citas.find(c => c.idCita === consulta.idCita);
    return { ...consulta, cita: cita || {} };
  });

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_NOTIFICACIONES}/ListarNotificaciones`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json'
        }
      });
      let text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        text = text.replace(/,\s*([\]}])/g, '$1');
        data = JSON.parse(text);
      }
      if (!data.esCorrecto || !Array.isArray(data.valor)) {
        setNotificationsError('No se pudieron obtener las notificaciones.');
        setNotifications([]);
      } else {
        setNotifications(data.valor);
      }
    } catch (err) {
      setNotificationsError('Error al obtener notificaciones: ' + err.message);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleBellClick = () => {
    setNotificationsOpen((open) => {
      if (!open) fetchNotifications();
      return !open;
    });
  };

  return (
      <div className="flex h-screen bg-gray-100">
      <SidebarMenu activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} />
      <main className="flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  onClick={handleBellClick}
                >
                  <Bell className="w-6 h-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b font-semibold text-gray-700">Notificaciones</div>
                    {notificationsLoading && (
                      <div className="p-4 text-gray-500">Cargando...</div>
                    )}
                    {notificationsError && (
                      <div className="p-4 text-red-600">{notificationsError}</div>
                    )}
                    {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                      <div className="p-4 text-gray-500">No hay notificaciones.</div>
                    )}
                    {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                      <ul>
                        {notifications.map((n, idx) => (
                          <li key={idx} className="px-4 py-2 border-b last:border-b-0 hover:bg-gray-50">
                            <div className="font-medium">{n.titulo || 'Sin título'}</div>
                            <div className="text-sm text-gray-600">{n.mensaje || n.descripcion || 'Sin mensaje'}</div>
                            <div className="text-xs text-gray-400">{new Date(n.fecha).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              
              {/* Usuario con dropdown */}
              <div className="relative">
                <div
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2"
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {getInitials(userName)}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{userName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        {/* Appointments table for selection - Solo citas programadas */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Citas Programadas</h2>
            <div className="text-sm text-gray-600">
              {citasProgramadas.length} citas programadas
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            {loadingCitas && <p className="text-center py-4">Cargando citas...</p>}
            {errorCitas && <p className="text-red-600 text-center py-4">{errorCitas}</p>}
            {!loadingCitas && !errorCitas && citasProgramadas.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay citas programadas disponibles</p>
            )}
            {!loadingCitas && !errorCitas && citasProgramadas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Paciente</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Médico</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Fecha</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Hora</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Motivo</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Estado</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasProgramadas.map((cita, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{cita.idCita || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{cita.cedulaPaciente || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{cita.cedulaMedico || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{cita.fechaCita || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{cita.horaCita || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{cita.motivo || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoBadgeStyle(cita.estado)}`}>
                            {cita.estado || 'Programada'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs transition-colors"
                              onClick={() => handleSelectCita(cita)}
                            >
                              Crear Consulta
                            </button>
                            <button
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700 text-xs transition-colors flex items-center"
                              onClick={() => marcarCitaComoCompletada(cita.idCita)}
                              disabled={updatingCita === cita.idCita}
                            >
                              {updatingCita === cita.idCita ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Completar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Consultation form modal */}
        {showConsultaForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Registrar Consulta</h2>
                <button
                  onClick={() => {
                    setShowConsultaForm(false);
                    setSelectedCita(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleConsultaSubmit} className="p-6">
                {formError && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">ID Cita</label>
                    <input
                      type="number"
                      name="idCita"
                      value={consultaForm.idCita}
                      readOnly
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Paciente</label>
                    <input
                      type="text"
                      name="paciente"
                      value={consultaForm.paciente}
                      readOnly
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Fecha</label>
                    <input
                      type="text"
                      name="fecha"
                      value={consultaForm.fecha}
                      readOnly
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Motivo</label>
                    <input
                      type="text"
                      name="motivo"
                      value={consultaForm.motivo}
                      readOnly
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Precio Base *</label>
                    <input
                      type="number"
                      name="precioBase"
                      value={consultaForm.precioBase}
                      onChange={handleConsultaInput}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Notas</label>
                    <input
                      type="text"
                      name="notas"
                      value={consultaForm.notas}
                      onChange={handleConsultaInput}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="aceptoTratamiento"
                      checked={consultaForm.aceptoTratamiento}
                      onChange={handleConsultaInput}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Acepto Tratamiento</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConsultaForm(false);
                      setSelectedCita(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Guardar Consulta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Consultations table */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Consultas Registradas</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            {loadingConsultas && <p className="text-center py-4">Cargando consultas...</p>}
            {errorConsultas && <p className="text-red-600 text-center py-4">{errorConsultas}</p>}
            {!loadingConsultas && !errorConsultas && consultas.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay consultas registradas</p>
            )}
            {!loadingConsultas && !errorConsultas && consultas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Paciente</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Fecha</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Motivo</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Precio</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Notas</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">Aceptó Tratamiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultasConCita.map((consulta, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{consulta.idConsulta || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{consulta.cita?.cedulaPaciente || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {consulta.fecha ? new Date(consulta.fecha).toLocaleDateString() : '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{consulta.cita?.motivo || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">${consulta.precioBase || '0'}</td>
                        <td className="border border-gray-300 px-4 py-2">{consulta.notas || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={consulta.aceptoTratamiento || false}
                            onChange={(e) => handleAceptoTratamientoChange(consulta, e.target.checked)}
                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Consultas;