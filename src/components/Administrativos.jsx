import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Edit,
  Plus
} from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import {
  API_ADMIN_BASE_URL,
} from '../config';

const Dashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('administrativos');
  const [administrativos, setAdministrativos] = useState([]);
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  // Fetch all administrativos
  const fetchAdministrativos = () => {
    fetch(`${API_ADMIN_BASE_URL}/ListarTodosAdministrativos`)
      .then(res => res.json())
      .then(data => setAdministrativos(data))
      .catch(() => setAdministrativos([]));
  };

  useEffect(() => {
    fetchAdministrativos();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    navigate('/');
    window.location.reload();
  };

  const handleInput = e => {
    setNuevo({ ...nuevo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');
    if (!nuevo.cedula || !nuevo.nombres || !nuevo.apellidos || !nuevo.telefono || !nuevo.email || !nuevo.direccion) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }
    try {
      const res = await fetch(`${API_ADMIN_BASE_URL}/RegistrarAdministrativo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevo,
          fechaIngreso: new Date().toISOString() // Fecha actual de la computadora
        }),
      });
      if (!res.ok) {
        setFormError('Error al registrar administrativo.');
        return;
      }
      setShowForm(false);
      setNuevo({
        cedula: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        email: '',
        direccion: ''
      });
      fetchAdministrativos();
    } catch (err) {
      setFormError('Error de red o servidor.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarMenu activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} />
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar administrativo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">AD</span>
                  </div>
                  <span className="text-gray-700 font-medium">Admin</span>
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

        {/* Dashboard Content */}
        <div className="p-6 overflow-y-auto h-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Administrativos</h2>
          <div className="flex justify-end mb-4">
            <button
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-5 h-5 mr-2" /> Registrar Administrativo
            </button>
          </div>

          {/* Formulario para nuevo administrativo */}
          {showForm && (
            <form
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6"
              onSubmit={handleSubmit}
            >
              {formError && <div className="text-red-600 mb-2">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Cédula</label>
                  <input
                    type="text"
                    name="cedula"
                    value={nuevo.cedula}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Nombres</label>
                  <input
                    type="text"
                    name="nombres"
                    value={nuevo.nombres}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={nuevo.apellidos}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={nuevo.telefono}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={nuevo.email}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={nuevo.direccion}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  onClick={() => {
                    setShowForm(false);
                    setFormError('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {administrativos
                  .filter(a =>
                    a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
                    a.cedula?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((a, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap">{a.cedula}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{a.nombre || a.nombres}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{a.correo || a.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center">
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {administrativos.length === 0 && (
              <div className="text-center text-gray-500 py-8">No hay administrativos registrados.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;