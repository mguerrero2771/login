import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Calendar as CalendarIcon,
  UserCheck,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Stethoscope
} from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  API_CITAS_BASE_URL,
  API_NOTIFICACIONES
} from '../config';

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('citas');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userName, setUserName] = useState('Usuario');
  const [vistaActual, setVistaActual] = useState('calendario'); // 'calendario' o 'tabla'
  const [paginaActual, setPaginaActual] = useState(1);
  const [citasPorPagina] = useState(10);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const navigate = useNavigate();

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

    // Obtener citas
    const token = localStorage.getItem('token');
    const cedula = localStorage.getItem('cedula');
    const fetchCitas = async () => {
      setLoading(true);
      setError('');
      try {
        if (!cedula) {
          setError('No se encontró la cédula del usuario en localStorage.');
          setLoading(false);
          return;
        }
        
        const url = `${API_CITAS_BASE_URL}/ObtenerCitasxCedula/${encodeURIComponent(cedula)}`; // <-- Usa la URL centralizada
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Accept': 'application/json'
          }
        });
        
        const text = await response.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (e) {
          setError('La respuesta no es un JSON válido. Detalle: ' + e.message);
          setLoading(false);
          return;
        }
        
        if (data.esCorrecto && Array.isArray(data.valor)) {
          setCitas(data.valor);
        } else if (data.error) {
          setError('Error del backend: ' + data.error);
        } else {
          setError('No se encontraron citas o la respuesta no es válida.');
        }
      } catch (err) {
        setError('Error al obtener las citas: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCitas();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('medicoNombre');
    navigate('/');
    window.location.reload();
  };

  const handleBellClick = () => {
    setNotificationsOpen((open) => {
      if (!open) fetchNotifications();
      return !open;
    });
  };

  // Generar iniciales para el avatar
  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.split(' ');
    let initials = '';
    if (parts.length > 0) initials += parts[0][0];
    if (parts.length > 1) initials += parts[1][0];
    return initials.toUpperCase();
  };

  // Función para obtener el color según el estado
  const getColorByEstado = (estado) => {
    if (!estado) return 'bg-gray-400';
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('completada') || estadoLower.includes('realizada')) {
      return 'bg-green-500';
    } else if (estadoLower.includes('programada') || estadoLower.includes('agendada')) {
      return 'bg-blue-500';
    } else if (estadoLower.includes('cancelada')) {
      return 'bg-red-500';
    } else if (estadoLower.includes('pendiente')) {
      return 'bg-yellow-500';
    }
    return 'bg-gray-400';
  };

  // Función para obtener el estado formateado
  const getEstadoFormateado = (estado) => {
    if (!estado) return 'Sin estado';
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('completada') || estadoLower.includes('realizada')) {
      return 'Completada';
    } else if (estadoLower.includes('programada') || estadoLower.includes('agendada')) {
      return 'Programada';
    } else if (estadoLower.includes('cancelada')) {
      return 'Cancelada';
    } else if (estadoLower.includes('pendiente')) {
      return 'Pendiente';
    }
    return estado;
  };

  const citasPorFecha = citas.reduce((acc, cita) => {
    if (!cita.fechaCita) return acc;
    const fecha = cita.fechaCita.split('T')[0];
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(cita);
    return acc;
  }, {});

  const citasDelDia = citasPorFecha[
    selectedDate.toISOString().split('T')[0]
  ] || [];

  // Calcular paginación
  const totalPaginas = Math.ceil(citas.length / citasPorPagina);
  const indiceInicio = (paginaActual - 1) * citasPorPagina;
  const indiceFin = indiceInicio + citasPorPagina;
  const citasPaginadas = citas.slice(indiceInicio, indiceFin);

  // Función para cambiar página
  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  // Generar números de página
  const generarNumerosPagina = () => {
    const numeros = [];
    const maxPaginasVisibles = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(totalPaginas, inicio + maxPaginasVisibles - 1);
    
    if (fin - inicio + 1 < maxPaginasVisibles) {
      inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      numeros.push(i);
    }
    return numeros;
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
                            <div className="text-xs text-gray-400">{n.fecha || ''}</div>
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

        <div className="p-6 overflow-y-auto h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Citas</h2>
            
            {/* Botones para cambiar vista */}
            <div className="flex space-x-2">
              <button
                onClick={() => setVistaActual('calendario')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  vistaActual === 'calendario' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Vista Calendario
              </button>
              <button
                onClick={() => setVistaActual('tabla')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  vistaActual === 'tabla' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Vista Tabla
              </button>
            </div>
          </div>

          {loading && <p>Cargando citas...</p>}
          {error && <p className="text-red-600">{error}</p>}
          
          {!loading && !error && (
            <>
              {/* Vista Calendario */}
              {vistaActual === 'calendario' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-1/2">
                      <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        tileContent={({ date, view }) => {
                          const fecha = date.toISOString().split('T')[0];
                          const citasDelDia = citasPorFecha[fecha] || [];
                          
                          if (citasDelDia.length > 0) {
                            // Obtener los estados únicos del día
                            const estadosUnicos = [...new Set(citasDelDia.map(cita => cita.estado))];
                            
                            return (
                              <div className="flex justify-center space-x-1">
                                {estadosUnicos.map((estado, idx) => (
                                  <span 
                                    key={idx}
                                    className={`inline-block w-2 h-2 rounded-full mt-1 ${getColorByEstado(estado)}`}
                                  ></span>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      {/* Leyenda de colores */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Leyenda:</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            <span>Completada</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                            <span>Programada</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                            <span>Pendiente</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                            <span>Cancelada</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-1/2">
                      <h3 className="text-lg font-semibold mb-4">
                        Citas para {selectedDate.toLocaleDateString()}
                      </h3>
                      {citasDelDia.length === 0 ? (
                        <p className="text-gray-500">No hay citas para este día.</p>
                      ) : (
                        <div className="space-y-3">
                          {citasDelDia.map((cita, idx) => (
                            <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  {cita.horaCita || 'Sin hora'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getColorByEstado(cita.estado)}`}>
                                  {getEstadoFormateado(cita.estado)}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div><strong>Paciente:</strong> {cita.cedulaPaciente || '-'}</div>
                                <div><strong>Médico:</strong> {cita.cedulaMedico || '-'}</div>
                                <div><strong>Motivo:</strong> {cita.motivo || '-'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Vista Tabla */}
              {vistaActual === 'tabla' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hora
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paciente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Médico
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {citasPaginadas.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                              No hay citas registradas
                            </td>
                          </tr>
                        ) : (
                          citasPaginadas.map((cita, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {cita.fechaCita ? new Date(cita.fechaCita).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {cita.horaCita || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {cita.cedulaPaciente || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {cita.cedulaMedico || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {cita.motivo || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getColorByEstado(cita.estado)}`}>
                                  {getEstadoFormateado(cita.estado)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Paginación */}
                  {citas.length > citasPorPagina && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex justify-between flex-1 sm:hidden">
                          <button
                            onClick={() => cambiarPagina(paginaActual - 1)}
                            disabled={paginaActual === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                              paginaActual === 1 
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                : 'text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                          >
                            Anterior
                          </button>
                          <button
                            onClick={() => cambiarPagina(paginaActual + 1)}
                            disabled={paginaActual === totalPaginas}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                              paginaActual === totalPaginas 
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                : 'text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                          >
                            Siguiente
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Mostrando <span className="font-medium">{indiceInicio + 1}</span> a{' '}
                              <span className="font-medium">{Math.min(indiceFin, citas.length)}</span> de{' '}
                              <span className="font-medium">{citas.length}</span> citas
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => cambiarPagina(paginaActual - 1)}
                                disabled={paginaActual === 1}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                  paginaActual === 1 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <span className="sr-only">Anterior</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              
                              {generarNumerosPagina().map((numero) => (
                                <button
                                  key={numero}
                                  onClick={() => cambiarPagina(numero)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    numero === paginaActual
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {numero}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => cambiarPagina(paginaActual + 1)}
                                disabled={paginaActual === totalPaginas}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                  paginaActual === totalPaginas 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <span className="sr-only">Siguiente</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Citas;