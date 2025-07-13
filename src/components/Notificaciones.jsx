import React, { useEffect, useState } from 'react';
import { Bell, Plus, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';

import { API_BASE_URL } from '../config';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nueva, setNueva] = useState({ titulo: '', mensaje: '' });
  const [activeMenuItem, setActiveMenuItem] = useState('notificaciones');
  const navigate = useNavigate();

  const API_BASE = API_BASE_URL;

  // Fetch all notifications
  useEffect(() => {
    fetch(`${API_BASE}/ListarTodasNotificaciones`)
      .then(res => res.json())
      .then(data => setNotificaciones(data))
      .catch(() => setNotificaciones([]));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    navigate('/');
    window.location.reload();
  };

  const handleInput = e => {
    setNueva({ ...nueva, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch(`${API_BASE}/RegistrarNotificacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nueva),
    });
    setShowForm(false);
    setNueva({ titulo: '', mensaje: '' });
    // Refresca la lista
    fetch(`${API_BASE}/ListarTodasNotificaciones`)
      .then(res => res.json())
      .then(data => setNotificaciones(data));
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
                  placeholder="Buscar notificación..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
        <div className="flex flex-col flex-1">
          <div className="p-6 overflow-y-auto h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
              <button
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-5 h-5 mr-2" /> Nueva Notificación
              </button>
            </div>

            {/* Formulario para nueva notificación */}
            {showForm && (
              <form
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6"
                onSubmit={handleSubmit}
              >
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Título</label>
                  <input
                    type="text"
                    name="titulo"
                    value={nueva.titulo}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Mensaje</label>
                  <textarea
                    name="mensaje"
                    value={nueva.mensaje}
                    onChange={handleInput}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    onClick={() => setShowForm(false)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensaje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notificaciones
                    .filter(n =>
                      n.titulo?.toLowerCase().includes(search.toLowerCase()) ||
                      n.mensaje?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((n, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">{n.titulo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{n.mensaje}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{n.fecha || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {notificaciones.length === 0 && (
                <div className="text-center text-gray-500 py-8">No hay notificaciones registradas.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notificaciones;