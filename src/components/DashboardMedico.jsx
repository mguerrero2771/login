import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Calendar,
  UserCheck,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import {
  API_BASE_URL,
  API_NOTIFICACIONES
} from '../config';

// Reemplaza las constantes de endpoint por variables usando la base centralizada:
const ENDPOINT_PACIENTES = `${API_BASE_URL}/Pacientes/ListarTodosPacientes`;
const ENDPOINT_CITAS = `${API_BASE_URL}/Citas/ListarTodasCitas`;
const ENDPOINT_MEDICOS = `${API_BASE_URL}/Medicos/ListarTodosMedicos`;

const Dashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pacientesCount, setPacientesCount] = useState(0);
  const [citasCount, setCitasCount] = useState(0);
  const [citasPendientes, setCitasPendientes] = useState(0);
  const [urgenciasCount, setUrgenciasCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [userName, setUserName] = useState('Usuario');
  const [loading, setLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(false);
  const navigate = useNavigate();

  // Función para obtener y guardar los datos del médico
  const fetchAndSetMedicoData = async () => {
    try {
      const token = localStorage.getItem('token');
        console.log(token);
      const userData = localStorage.getItem('userData');
      
      if (!userData) {
        console.warn('No hay datos de usuario en localStorage');
        return;
      }
      
      const user = JSON.parse(userData);
      const cedula = user.cedula || user.cédula || user.username || '';
      
      if (!cedula) {
        console.warn('No se encontró cédula en los datos del usuario');
        return;
      }

      // Obtener todos los médicos
      const res = await fetch(ENDPOINT_MEDICOS, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.esCorrecto && Array.isArray(data.valor)) {
        // Buscar el médico que coincide con la cédula del usuario logueado
        const medico = data.valor.find(m => 
          (m.cedulaMedico?.toString() === cedula.toString()) || 
          (m.cedula?.toString() === cedula.toString())
        );
        
        if (medico) {
          const nombreCompleto = `${medico.nombres || ''} ${medico.apellidos || ''}`.trim();
          if (nombreCompleto) {
            setUserName(nombreCompleto);
            // Guardar en localStorage para usar en otras páginas
            localStorage.setItem('medicoNombre', nombreCompleto);
            
            // Actualizar userData en localStorage si es necesario
            const updatedUserData = {
              ...user,
              nombre: nombreCompleto,
              nombres: medico.nombres,
              apellidos: medico.apellidos,
              especialidad: medico.especialidad
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
          } else {
            console.warn('Médico encontrado pero sin nombre completo');
          }
        } else {
          console.warn(`No se encontró médico con cédula ${cedula}`);
        }
      } else {
        console.warn('Respuesta de API no válida para médicos');
      }
    } catch (error) {
      console.error('Error al obtener datos del médico:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(ENDPOINT_PACIENTES, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const text = await res.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error al parsear respuesta de pacientes:', parseError);
        setPacientesCount(0);
        setRecentPatients([]);
        return;
      }

      if (data.esCorrecto && Array.isArray(data.valor)) {
        setPacientesCount(data.valor.length);
        const sorted = [...data.valor].sort((a, b) => {
          const fechaA = new Date(a.fechaCreacion || a.fechaNacimiento || 0);
          const fechaB = new Date(b.fechaCreacion || b.fechaNacimiento || 0);
          return fechaB - fechaA;
        });
        setRecentPatients(sorted.slice(0, 5).map(p => ({
          name: `${p.nombres} ${p.apellidos}`,
          age: p.edad || (p.fechaNacimiento ? (new Date().getFullYear() - new Date(p.fechaNacimiento).getFullYear()) : ''),
          lastVisit: p.fechaCreacion ? p.fechaCreacion.split('T')[0] : (p.fechaNacimiento ? p.fechaNacimiento.split('T')[0] : ''),
          status: 'Activo'
        })));
      } else {
        setPacientesCount(0);
        setRecentPatients([]);
      }
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      setPacientesCount(0);
      setRecentPatients([]);
    }
  };

  const fetchCitas = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      let cedula = '';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          cedula = user.cedula || user.cédula || user.username || '';
        } catch {
          cedula = '';
        }
      }
      
      if (!cedula) {
        console.warn('No se encontró cédula para obtener citas');
        setCitasCount(0);
        setPacientesCount(0);
        setCitasPendientes(0);
        setUrgenciasCount(0);
        setUpcomingAppointments([]);
        return;
      }

      const ENDPOINT_CITAS_CEDULA = `${API_BASE_URL}/Citas/ObtenerCitasxCedula/${cedula}`;
      const res = await fetch(ENDPOINT_CITAS_CEDULA, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const text = await res.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error al parsear respuesta de citas:', parseError);
        setCitasCount(0);
        setPacientesCount(0);
        setCitasPendientes(0);
        setUrgenciasCount(0);
        setUpcomingAppointments([]);
        return;
      }

      if (data.esCorrecto && Array.isArray(data.valor)) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const normalizarFecha = (f) => {
          const d = new Date(f);
          d.setHours(0, 0, 0, 0);
          return d;
        };

        const citasHoy = data.valor.filter(c => {
          const estado = (c.estado || '').toLowerCase();
          const fecha = normalizarFecha(c.fecha || c.fechaCita);
          return (
            estado === 'programada' &&
            fecha.getTime() === hoy.getTime()
          );
        });

        const citasPendientesArr = data.valor.filter(c => {
          const estado = (c.estado || '').toLowerCase();
          const fecha = normalizarFecha(c.fecha || c.fechaCita);
          return (
            (estado === 'pendiente' && fecha.getTime() >= hoy.getTime()) ||
            (estado === 'programada' && fecha.getTime() > hoy.getTime())
          );
        });

        const citasCompletadas = data.valor.filter(c => (c.estado || '').toLowerCase() === 'completada');

        setCitasCount(citasHoy.length);
        setCitasPendientes(citasPendientesArr.length);
        setUrgenciasCount(citasCompletadas.length);

        const sortedHoy = [...citasHoy].sort((a, b) => {
          const horaA = a.hora || a.horaCita || '00:00';
          const horaB = b.hora || b.horaCita || '00:00';
          return horaA.localeCompare(horaB);
        });

        setUpcomingAppointments(sortedHoy.slice(0, 5).map(c => ({
          time: c.hora || c.horaCita || '',
          patient: c.nombrePaciente || c.cedulaPaciente || 'Paciente',
          doctor: c.nombreMedico || c.cedulaMedico || 'Médico',
          type: c.tipo || c.tipoConsulta || c.motivo || ''
        })));
      } else {
        setCitasCount(0);
        setPacientesCount(0);
        setCitasPendientes(0);
        setUrgenciasCount(0);
        setUpcomingAppointments([]);
      }
    } catch (error) {
      console.error('Error al obtener citas:', error);
      setCitasCount(0);
      setPacientesCount(0);
      setCitasPendientes(0);
      setUrgenciasCount(0);
      setUpcomingAppointments([]);
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

  const handleNotificacionesClick = async () => {
    setNotificacionesOpen(open => !open);
    if (!notificacionesOpen) {
      setLoadingNotificaciones(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_NOTIFICACIONES, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Accept': 'application/json'
          }
        });
        if (!res.ok) throw new Error('Error al obtener notificaciones');
        const data = await res.json();
        if (data && data.esCorrecto && Array.isArray(data.valor)) {
          setNotificaciones(data.valor);
        } else {
          setNotificaciones([]);
        }
      } catch {
        setNotificaciones([]);
      } finally {
        setLoadingNotificaciones(false);
      }
    }
  };

  useEffect(() => {
    // Primero intenta obtener el nombre del localStorage
    const storedName = localStorage.getItem('medicoNombre');
    if (storedName) {
      setUserName(storedName);
      setLoading(false);
    } else {
      // Si no está en localStorage, lo obtiene de la API
      fetchAndSetMedicoData();
    }

    // Obtener datos de pacientes y citas
    fetchPacientes();
    fetchCitas();
  }, []);

  const stats = [
    { title: 'Citas Hoy', value: citasCount, icon: Calendar, color: 'bg-green-500' },
    { title: 'Pacientes', value: pacientesCount, icon: User, color: 'bg-blue-500' },
    { title: 'Citas Pendientes', value: citasPendientes, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Completadas', value: urgenciasCount, icon: CheckCircle, color: 'bg-green-500' }
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <SidebarMenu activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} />
        <main className="flex-1 overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-700">Cargando datos del médico...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarMenu activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} />
      <main className="flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={handleNotificacionesClick}
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificaciones.length}
                </span>
                {notificacionesOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b font-semibold text-gray-700">Notificaciones</div>
                    {loadingNotificaciones ? (
                      <div className="p-4 text-gray-500">Cargando...</div>
                    ) : notificaciones.length === 0 ? (
                      <div className="p-4 text-gray-500">No hay notificaciones</div>
                    ) : (
                      <ul>
                        {notificaciones.map((n, idx) => (
                          <li key={idx} className="px-4 py-2 border-b last:border-b-0 hover:bg-gray-50">
                            <div className="font-medium text-gray-900">{n.titulo || n.tituloNotificacion || 'Notificación'}</div>
                            <div className="text-sm text-gray-600">{n.mensaje || n.mensajeNotificacion || ''}</div>
                            <div className="text-xs text-gray-400">{n.fecha || n.fechaNotificacion || ''}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </button>
              <div className="relative">
                <div
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2"
                  onClick={() => setUserMenuOpen(open => !open)}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Citas Programadas Hoy:</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{appointment.patient}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctor} • {appointment.type}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-sm font-medium text-gray-900">{appointment.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No hay citas programadas para hoy
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Pacientes Recientes</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentPatients.length > 0 ? (
                    recentPatients.map((patient, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                          <p className="text-sm text-gray-500">
                            {patient.age} años • Última visita: {patient.lastVisit}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {patient.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No hay pacientes recientes
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;