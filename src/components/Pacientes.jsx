import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  ChevronRightIcon
} from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import {
  API_BASE_URL,
  API_CITAS_BASE_URL,
  API_NOTIFICACIONES
} from '../config';

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [filteredPacientes, setFilteredPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('pacientes');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedYear, setExpandedYear] = useState(null);
  const [userName, setUserName] = useState('Usuario');
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);


// Obtener el nombre del médico del localStorage
useEffect(() => {
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
}, []);

  const navigate = useNavigate();

  // Generar iniciales para el avatar
  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.split(' ');
    let initials = '';
    if (parts.length > 0) initials += parts[0][0];
    if (parts.length > 1) initials += parts[1][0];
    return initials.toUpperCase();
  };


  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('medicoNombre');
    navigate('/');
    window.location.reload();
  };

  // Función para obtener notificaciones
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

  // Manejar apertura del dropdown
  const handleBellClick = () => {
    setNotificationsOpen((open) => {
      if (!open) fetchNotifications();
      return !open;
    });
  };

  // Función para buscar pacientes
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term === '') {
      setFilteredPacientes(pacientes);
      setCurrentPage(1);
      return;
    }
    
    const filtered = pacientes.filter(paciente => {
      const searchLower = term.toLowerCase();
      return (
        paciente.nombres.toLowerCase().includes(searchLower) ||
        paciente.apellidos.toLowerCase().includes(searchLower) ||
        paciente.cedula.toString().includes(term)
      );
    });
    
    setFilteredPacientes(filtered);
    setCurrentPage(1);
  };

  // Agrupar pacientes por año de nacimiento
  const groupPacientesByYear = (pacientesList) => {
    return pacientesList.reduce((acc, paciente) => {
      const anio = paciente.fechaNacimiento ? paciente.fechaNacimiento.slice(0, 4) : 'Sin fecha';
      if (!acc[anio]) acc[anio] = [];
      acc[anio].push(paciente);
      return acc;
    }, {});
  };

  // Obtener pacientes filtrados y paginados
  useEffect(() => {
    const fetchPacientesFiltrados = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const cedula = localStorage.getItem('cedula');
        if (!cedula) {
          setError('No se encontró la cédula del médico en localStorage.');
          setLoading(false);
          return;
        }

        // 1. Obtener citas del médico
        const citasRes = await fetch(`${API_CITAS_BASE_URL}/ObtenerCitasxCedula/${cedula}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Accept': 'application/json'
          }
        });
        let citasText = await citasRes.text();
        let citasData;
        try {
          citasData = JSON.parse(citasText);
        } catch (e) {
          citasText = citasText.replace(/,\s*([\]}])/g, '$1');
          citasData = JSON.parse(citasText);
        }
        if (!citasData.esCorrecto || !Array.isArray(citasData.valor)) {
          setError('No se pudieron obtener las citas del médico.');
          setLoading(false);
          return;
        }
        
        // 2. Extraer cédulas de pacientes de las citas
        const cedulasPacientes = new Set(
          citasData.valor
            .map(cita => cita.cedulaPaciente)
            .filter(Boolean)
        );

        // 3. Obtener todos los pacientes
        const pacientesRes = await fetch(`${API_BASE_URL}/Pacientes/ListarTodosPacientes`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Accept': 'application/json'
          }
        });
        let pacientesText = await pacientesRes.text();
        let pacientesData;
        try {
          pacientesData = JSON.parse(pacientesText);
        } catch (e) {
          pacientesText = pacientesText.replace(/,\s*([\]}])/g, '$1');
          pacientesData = JSON.parse(pacientesText);
        }
        if (!pacientesData.esCorrecto || !Array.isArray(pacientesData.valor)) {
          setError('No se pudieron obtener los pacientes.');
          setLoading(false);
          return;
        }

        // 4. Filtrar pacientes por cédulas de pacientes con citas
        const pacientesFiltrados = pacientesData.valor.filter(p =>
          cedulasPacientes.has(p.cedula)
        );

        setPacientes(pacientesFiltrados);
        setFilteredPacientes(pacientesFiltrados);
      } catch (err) {
        setError('Error al obtener los pacientes: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPacientesFiltrados();
  }, []);

  // Obtener datos paginados
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPacientes.slice(startIndex, endIndex);
  };

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage);

  // Cambiar página
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Agrupar pacientes por año de nacimiento (para los datos actuales)
  const pacientesPorAnio = groupPacientesByYear(getPaginatedData());
  const anios = Object.keys(pacientesPorAnio).sort((a, b) => b.localeCompare(a));

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
                  placeholder="Buscar por nombre o cédula..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notificaciones */}
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

        {/* Pacientes Content */}
        <div className="p-6 overflow-y-auto h-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pacientes</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {loading && <p>Cargando pacientes...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && filteredPacientes.length === 0 && (
              <p>No se encontraron pacientes.</p>
            )}
            {!loading && !error && filteredPacientes.length > 0 && (
              <div>
                {/* Mostrar información de paginación */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredPacientes.length)}-
                    {Math.min(currentPage * itemsPerPage, filteredPacientes.length)} de {filteredPacientes.length} pacientes
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronFirst className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-2">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLast className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Tabla de pacientes */}
                {anios.map((anio) => (
                  <div key={anio} className="mb-4">
                    <button
                      className="flex items-center w-full text-left text-lg font-semibold text-blue-700 hover:underline focus:outline-none"
                      onClick={() => setExpandedYear(expandedYear === anio ? null : anio)}
                    >
                      {expandedYear === anio ? <ChevronUp className="w-5 h-5 mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
                      Pacientes nacidos en {anio} ({pacientesPorAnio[anio].length})
                    </button>
                    {expandedYear === anio && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border mt-2">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border px-4 py-2 text-left">Cédula</th>
                              <th className="border px-4 py-2 text-left">Nombres</th>
                              <th className="border px-4 py-2 text-left">Apellidos</th>
                              <th className="border px-4 py-2 text-left">Fecha Nacimiento</th>
                              <th className="border px-4 py-2 text-left">Sexo</th>
                              <th className="border px-4 py-2 text-left">Teléfono</th>
                              <th className="border px-4 py-2 text-left">Email</th>
                              <th className="border px-4 py-2 text-left">Dirección</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pacientesPorAnio[anio].map((p, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border px-4 py-2">{p.cedula}</td>
                                <td className="border px-4 py-2">{p.nombres}</td>
                                <td className="border px-4 py-2">{p.apellidos}</td>
                                <td className="border px-4 py-2">{p.fechaNacimiento}</td>
                                <td className="border px-4 py-2">{p.sexo}</td>
                                <td className="border px-4 py-2">{p.telefono}</td>
                                <td className="border px-4 py-2">{p.email}</td>
                                <td className="border px-4 py-2">{p.direccion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {/* Paginación inferior */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronFirst className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-8 h-8 rounded-md ${currentPage === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLast className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pacientes;