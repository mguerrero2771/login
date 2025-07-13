import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import {
  API_BASE_URL,
  API_RECUPERAR_CLAVE_URL
} from '../config';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    cedula: '',
    contraseña: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [recoveryCedula, setRecoveryCedula] = useState('');
  const [recoveryResult, setRecoveryResult] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Solo permitir números en el campo de cédula
    if (name === 'cedula') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async () => {
    // Validaciones mejoradas
    if (!formData.cedula || !formData.contraseña) {
      setMessage({
        type: 'error',
        text: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    if (formData.cedula.length > 10) {
      setMessage({
        type: 'error',
        text: 'La cédula debe tener al menos 10 dígitos'
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/Usuarios/Login`, { // <-- Usa la URL centralizada
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          cedula: formData.cedula,
          contraseña: formData.contraseña
        })
      });

      let result;
      try {
        result = await response.json();
      } catch {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          result = {};
        }
      }

      console.log('HTTP status:', response.status, response.statusText);
      console.log('Respuesta del backend:', result);
      
      if (response.ok && result.mensaje) {
        setMessage({
          type: 'success',
          text: '¡Inicio de sesión exitoso! Redirigiendo...'
        });
        localStorage.setItem('token', result.mensaje);
        localStorage.setItem('cedula', formData.cedula);
        console.log('Cédula guardada:', formData.cedula);

        // Pequeño delay para mostrar el mensaje de éxito
        setTimeout(async () => {
          try {
            console.log('Consultando rol para:', formData.cedula);
            const rolRes = await fetch(
              `${API_BASE_URL}/Usuarios/ObtenerRolxCedula/${formData.cedula}` // <-- Usa la URL centralizada
            );
            const rolData = await rolRes.json();
            console.log('Respuesta del rol:', rolData);
            
            if (rolData.valor && rolData.valor.toLowerCase() === 'administrador') {
              navigate('/dashboard-admin');
            } else {
              navigate('/dashboard');
            }
          } catch (e) {
            setMessage({
              type: 'error',
              text: 'Error al verificar permisos de usuario'
            });
            console.error('Error al obtener el rol:', e);
            return;
          }
          
          if (onLoginSuccess) {
            onLoginSuccess({ token: result.mensaje, cedula: formData.cedula });
          }
        }, 1000);
      } else {
        // Manejo mejorado de errores del servidor
        if (response.status === 401) {
          setMessage({
            type: 'error',
            text: 'Credenciales incorrectas. Verifica tu cédula y contraseña'
          });
        } else if (response.status === 404) {
          setMessage({
            type: 'error',
            text: 'Usuario no encontrado. Verifica tu cédula'
          });
        } else if (response.status >= 500) {
          setMessage({
            type: 'error',
            text: 'Error interno del servidor. Intenta más tarde'
          });
        } else {
          setMessage({
            type: 'error',
            text: result.mensaje || 'Error al iniciar sesión'
          });
        }
      }
    } catch (error) {
      console.error('Error en el login:', error);
      
      // Manejo mejorado de errores de conexión
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({
          type: 'error',
          text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet'
        });
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setMessage({
          type: 'error',
          text: 'Servidor no disponible. Intenta más tarde'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Error inesperado. Intenta nuevamente'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    setRecoveryResult('');
    if (!recoveryCedula) {
      setRecoveryResult('Por favor, ingresa la cédula.');
      return;
    }
    setRecoveryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${API_RECUPERAR_CLAVE_URL}/${recoveryCedula}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (res.ok && data.valor) {
        setRecoveryResult(`Tu contraseña es: ${data.valor}`);
      } else if (data.mensaje) {
        setRecoveryResult(data.mensaje);
      } else {
        setRecoveryResult('No se pudo recuperar la contraseña.');
      }
    } catch (e) {
      setRecoveryResult('Error al conectar con el servidor.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Sección del formulario */}
            <div className="lg:w-1/2 p-8 lg:p-12">
              <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Iniciar Sesión
                  </h1>
                  <p className="text-gray-600">
                    Accede a tu cuenta médica
                  </p>
                </div>

                {/* Formulario */}
                <div className="space-y-6">
                  {/* Campo Cédula */}
                  <div>
                    <label htmlFor="cedula" className="block text-sm font-semibold text-gray-700 mb-2">
                      Cédula
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="cedula"
                        name="cedula"
                        value={formData.cedula}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Ejemplo: 1234567890"
                        disabled={loading}
                        maxLength="10"
                      />
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div>
                    <label htmlFor="contraseña" className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="contraseña"
                        name="contraseña"
                        value={formData.contraseña}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Ingresa tu contraseña"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Mensajes mejorados */}
                  {message.text && (
                    <div className={`flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-sm transition-all duration-300 ${
                      message.type === 'error' 
                        ? 'bg-red-50 border-red-400 text-red-800' 
                        : 'bg-green-50 border-green-400 text-green-800'
                    }`}>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        message.type === 'error' 
                          ? 'bg-red-100' 
                          : 'bg-green-100'
                      }`}>
                        {message.type === 'error' ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-relaxed">
                          {message.text}
                        </p>
                        {message.type === 'error' && (
                          <p className="text-xs opacity-75 mt-1">
                            Si el problema persiste, contacta al administrador
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botón de Login */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-teal-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Iniciando sesión...
                      </div>
                    ) : (
                      'INICIAR SESIÓN'
                    )}
                  </button>
                </div>

                {/* Enlaces */}
                <div className="mt-6 space-y-3 text-center">
                  <p className="text-sm text-gray-600">
                    ¿Olvidaste tu contraseña?{' '}
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors underline"
                      onClick={() => setShowModal(true)}
                    >
                      Recuperar contraseña
                    </button>
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <Link to="/registro" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Sección de la imagen */}
            <div className="lg:w-1/2 bg-gradient-to-br from-blue-50 to-teal-50 relative overflow-hidden">
              {/* Imagen de fondo */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80")'
                }}
              />
              
              {/* Overlay con iconos médicos */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  {/* Iconos médicos flotantes */}
                  <div className="relative">
                    <div className="absolute -top-10 -left-10 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    
                    <div className="absolute -top-5 -right-8 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    
                    <div className="absolute -bottom-8 -left-5 w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                      </svg>
                    </div>
                    
                    <div className="bg-white/30 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
                      <h2 className="text-2xl font-bold mb-4">Sistema Médico</h2>
                      <p className="text-lg opacity-90">
                        Gestiona tu salud con tecnología avanzada
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de recuperación de contraseña */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">Recuperar Contraseña</h2>
            <label className="block mb-2 text-gray-700">Cédula</label>
            <input
              type="text"
              value={recoveryCedula}
              onChange={e => setRecoveryCedula(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              placeholder="Ingresa tu cédula"
              maxLength={10}
              disabled={recoveryLoading}
            />
            <button
              onClick={handlePasswordRecovery}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mb-3"
              disabled={recoveryLoading}
            >
              {recoveryLoading ? 'Consultando...' : 'Recuperar'}
            </button>
            {recoveryResult && (
              <div className="p-3 rounded-lg text-center text-sm bg-gray-50 border border-gray-200 text-gray-800 mb-2">
                {recoveryResult}
              </div>
            )}
            <button
              onClick={() => {
                setShowModal(false);
                setRecoveryCedula('');
                setRecoveryResult('');
              }}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

Login.propTypes = {
  onLoginSuccess: PropTypes.func
};

export default Login;