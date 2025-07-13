import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, ChevronRight, ChevronUp,
  Calendar, User, Stethoscope, TrendingUp, ClipboardList
} from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import {
  API_BASE_URL,
  API_CITAS_BASE_URL
} from '../config';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PacientesStats = () => {
  const [pacientes, setPacientes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('estadisticas');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedYear, setExpandedYear] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [userName, setUserName] = useState('Usuario');
  const [pacienteDetalle, setPacienteDetalle] = useState(null);
  const [consultasPaciente, setConsultasPaciente] = useState([]);
  const [activeTab, setActiveTab] = useState('consultas');
  const navigate = useNavigate();

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        // Pacientes
        const pacientesRes = await fetch(`${API_BASE_URL}/Pacientes/ListarTodosPacientes`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : undefined, 'Accept': 'application/json' }
        });
        const pacientesData = await pacientesRes.json();
        setPacientes(pacientesData.valor || []);

        // Consultas
        const consultasRes = await fetch(`${API_BASE_URL}/Consultas/ListarTodasconsultas`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : undefined, 'Accept': 'application/json' }
        });
        const consultasData = await consultasRes.json();
        setConsultas(consultasData.valor || []);
      } catch (err) {
        setError('Error al obtener los datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Efecto para cargar datos cuando se selecciona un paciente
  useEffect(() => {
    if (selectedPatient) {
      setLoading(true);
      setError('');
      // Busca el detalle del paciente
      const paciente = pacientes.find(p => p.cedula === selectedPatient) || null;
      setPacienteDetalle(paciente);

      // Filtra todas las consultas por cédula del paciente
      const consultasDePaciente = consultas.filter(c => c.cedulaPaciente === selectedPatient);
      setConsultasPaciente(consultasDePaciente);

      setLoading(false);
    } else {
      setPacienteDetalle(null);
      setConsultasPaciente([]);
      setError('');
    }
  }, [selectedPatient, pacientes, consultas]);

  // Estadísticas filtradas por paciente
  // Consultas por mes (filtrado)
  const consultasPorMes = (() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const counts = Array(12).fill(0);

    const consultasAFiltrar = selectedPatient ? consultasPaciente : consultas;

    consultasAFiltrar.forEach(c => {
      if (c.fecha) {
        const mes = new Date(c.fecha).getMonth();
        counts[mes]++;
      }
    });

    return meses.map((mes, i) => ({ mes, consultas: counts[i] }));
  })();

  // Motivos más comunes (filtrado)
  const motivosComunes = (() => {
    const map = {};
    const consultasAFiltrar = selectedPatient ? consultasPaciente : consultas;

    consultasAFiltrar.forEach(c => {
      if (c.motivo) {
        map[c.motivo] = (map[c.motivo] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  // Evolución del paciente seleccionado (número de consultas por mes)
  const evolucionPaciente = (() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const counts = Array(12).fill(0);
    const consultasAFiltrar = selectedPatient ? consultasPaciente : consultas;

    consultasAFiltrar.forEach(c => {
      if (c.fecha) {
        const mes = new Date(c.fecha).getMonth();
        counts[mes]++;
      }
    });
    return meses.map((mes, i) => ({ mes, consultas: counts[i] }));
  })();

  // Condiciones comunes (filtrado)
  const condicionesComunes = (() => {
    const map = {};
    const consultasAFiltrar = selectedPatient ? consultasPaciente : consultas;

    consultasAFiltrar.forEach(c => {
      if (c.condicion || c.diagnostico) {
        const key = c.condicion || c.diagnostico;
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, casos]) => ({ name, casos }));
  })();

  // Obtener nombre del usuario
  useEffect(() => {
    const storedName = localStorage.getItem('medicoNombre');
    if (storedName) {
      setUserName(storedName);
    } else {
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
    localStorage.removeItem('cedula');
    navigate('/login');
    window.location.reload();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Agrupa pacientes por año de nacimiento
  const pacientesPorAnio = pacientes.reduce((acc, paciente) => {
    const anio = paciente.fechaNacimiento ? paciente.fechaNacimiento.slice(0, 4) : 'Sin fecha';
    if (!acc[anio]) acc[anio] = [];
    acc[anio].push(paciente);
    return acc;
  }, {});

  const anios = Object.keys(pacientesPorAnio).sort((a, b) => b.localeCompare(a));

  // Función para calcular la edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Distribución por edad (agrupada en rangos)
  const edadDistribucion = (() => {
    const rangos = [
      { name: '0-12', min: 0, max: 12 },
      { name: '13-18', min: 13, max: 18 },
      { name: '19-30', min: 19, max: 30 },
      { name: '31-45', min: 31, max: 45 },
      { name: '46-60', min: 46, max: 60 },
      { name: '61+', min: 61, max: 200 }
    ];
    const counts = Array(rangos.length).fill(0);

    (selectedPatient
      ? pacientes.filter(p => p.cedula === selectedPatient)
      : pacientes
    ).forEach(p => {
      const edad = calcularEdad(p.fechaNacimiento);
      rangos.forEach((rango, idx) => {
        if (edad >= rango.min && edad <= rango.max) {
          counts[idx]++;
        }
      });
    });

    return rangos.map((rango, idx) => ({
      name: rango.name,
      value: counts[idx]
    })).filter(r => r.value > 0);
  })();

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
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              
              <div className="relative">
                <div
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
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

        {/* Contenido principal */}
        <div className="p-6 overflow-y-auto h-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas de Pacientes</h2>
          
          {/* Indicadores de carga y error */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <p>Cargando datos del paciente...</p>
                <div className="mt-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button onClick={() => setError('')} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <title>Close</title>
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
              </button>
            </div>
          )}
          
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rango de tiempo</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1m">Último mes</option>
                  <option value="3m">Últimos 3 meses</option>
                  <option value="6m">Últimos 6 meses</option>
                  <option value="1y">Último año</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select
                  value={selectedPatient || ''}
                  onChange={(e) => setSelectedPatient(e.target.value || null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los pacientes</option>
                  {pacientes.map(p => (
                    <option key={p.cedula} value={p.cedula}>
                      {p.nombres} {p.apellidos} ({p.cedula})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Gráficos y estadísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Consultas por mes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Consultas por Mes
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consultasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="consultas" fill="#3B82F6" name="Consultas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribución por edad */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Distribución por Edad
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={edadDistribucion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {edadDistribucion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Segunda fila de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Motivos comunes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                  Motivos de Consulta Comunes
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={motivosComunes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {motivosComunes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Condiciones comunes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2 text-red-600" />
                  Condiciones Comunes
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={condicionesComunes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="casos" fill="#EF4444" name="Casos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Evolución del paciente (si está seleccionado) */}
          {selectedPatient && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Evolución del Paciente (Consultas por Mes)
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucionPaciente}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="consultas" stroke="#10B981" name="Consultas" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detalle del paciente seleccionado */}
          {selectedPatient && pacienteDetalle && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {pacienteDetalle.nombres} {pacienteDetalle.apellidos}
                  <span className="text-gray-600 ml-2 text-sm font-normal">({pacienteDetalle.cedula})</span>
                </h3>
                <div className="text-sm text-gray-500">
                  Edad: {calcularEdad(pacienteDetalle.fechaNacimiento)} años | 
                  Sexo: {pacienteDetalle.sexo} | 
                  Teléfono: {pacienteDetalle.telefono}
                </div>
              </div>

              {/* Solo pestaña de consultas */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  <button 
                    onClick={() => setActiveTab('consultas')}
                    className={`border-b-2 px-4 py-2 text-sm font-medium border-blue-500 text-blue-600`}
                  >
                    Consultas ({consultasPaciente.length})
                  </button>
                </nav>
              </div>

              {/* Contenido de la pestaña */}
              <div className="space-y-4">
                {consultasPaciente.length > 0 ? (
                  consultasPaciente.map((consulta, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {formatDate(consulta.fecha)} - {consulta.motivo || 'Consulta sin motivo especificado'}
                          </h4>
                          {consulta.diagnostico && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Diagnóstico:</span> {consulta.diagnostico}
                            </p>
                          )}
                          {consulta.condicion && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Condición:</span> {consulta.condicion}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {consulta.medico && `Atendido por: ${consulta.medico}`}
                        </div>
                      </div>
                      {consulta.notas && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Notas:</span> {consulta.notas}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay consultas registradas para este paciente</p>
                )}
              </div>
            </div>
          )}

          {/* Lista de pacientes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Lista de Pacientes ({pacientes.length})
            </h3>

            {loading && <p>Cargando pacientes...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && anios.length === 0 && (
              <p>No hay pacientes registrados.</p>
            )}
            {!loading && !error && anios.length > 0 && (
              <div
                className="overflow-y-auto pr-2"
                style={{ maxHeight: 'calc(100vh - 300px)' }} // Altura dinámica según pantalla
              >
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
                      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
                        <table className="min-w-full border mt-2">
                          <thead className="sticky top-0 bg-white z-10">
                            <tr>
                              <th className="border px-4 py-2">Cédula</th>
                              <th className="border px-4 py-2">Nombres</th>
                              <th className="border px-4 py-2">Apellidos</th>
                              <th className="border px-4 py-2">Edad</th>
                              <th className="border px-4 py-2">Sexo</th>
                              <th className="border px-4 py-2">Última Consulta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pacientesPorAnio[anio].map((p, idx) => (
                              <tr 
                                key={idx} 
                                className={`hover:bg-gray-50 cursor-pointer ${selectedPatient === p.cedula ? 'bg-blue-50' : ''}`}
                                onClick={() => setSelectedPatient(p.cedula)}
                              >
                                <td className="border px-4 py-2">{p.cedula}</td>
                                <td className="border px-4 py-2">{p.nombres}</td>
                                <td className="border px-4 py-2">{p.apellidos}</td>
                                <td className="border px-4 py-2">{calcularEdad(p.fechaNacimiento)}</td>
                                <td className="border px-4 py-2">{p.sexo}</td>
                                <td className="border px-4 py-2">{formatDate(p.ultimaConsulta)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PacientesStats;