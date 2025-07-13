import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API_BASE_URL,
  API_USUARIOS_BASE_URL
} from '../config';
const Registro = () => {
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    especialidad: '',
    telefono: '',
    email: '',
    direccion: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.cedula ||
      !formData.nombres ||
      !formData.apellidos ||
      !formData.especialidad ||
      !formData.telefono ||
      !formData.email ||
      !formData.direccion ||
      !formData.password
    ) {
      setMessage({ type: 'error', text: 'Completa todos los campos.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      // 1. Registrar médico
      const medicoRes = await fetch(`${API_BASE_URL}/Medicos/Registrarmedico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          cedula: formData.cedula,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          especialidad: formData.especialidad,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          fechaIngreso: new Date().toISOString()
        })
      });
      const medicoResult = await medicoRes.json();
      if (!medicoRes.ok) {
        setMessage({ type: 'error', text: medicoResult.error || 'Error al registrar médico.' });
        setLoading(false);
      console.error('Error al registrar médico:', medicoResult);
        return;
      }

      // 2. Registrar usuario
      const usuarioRes = await fetch(`${API_USUARIOS_BASE_URL}/RegistrarUsuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          cedulaUsuario: formData.cedula,
          nombreUsuario: formData.nombres + ' ' + formData.apellidos,
          passwordHash: formData.password,
          activo: true,
          bloqueadoHasta: null,
          rol: 'medico'
        })
      });
      const usuarioResult = await usuarioRes.json();
      if (usuarioRes.ok && usuarioResult) {
        setMessage({ type: 'success', text: 'Registro exitoso. Ahora puedes iniciar sesión.' });
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage({ type: 'error', text: usuarioResult.error || 'Error al registrar usuario.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta más tarde.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-12 flex flex-col justify-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Registro de Médico</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-2">
              Cédula
            </label>
            <input
              type="text"
              id="cedula"
              name="cedula"
              value={formData.cedula}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Ingresa tu cédula"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-2">
              Nombres
            </label>
            <input
              type="text"
              id="nombres"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Ingresa tus nombres"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-2">
              Apellidos
            </label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Ingresa tus apellidos"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-2">
              Especialidad
            </label>
            <input
              type="text"
              id="especialidad"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Ej: Cardiología"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Ingresa tu teléfono"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Ingresa tu email"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Ingresa tu dirección"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="Crea una contraseña"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mt-4"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <span
              className="text-indigo-600 hover:text-indigo-500 font-medium cursor-pointer"
              onClick={() => navigate('/')}
            >
              Inicia sesión
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;