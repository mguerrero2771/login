import React, { useState, useEffect } from 'react'; 
import { FileText, AlertCircle, Stethoscope, Save, RefreshCw, Brain } from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import {
  API_BASE_URL,
  API_ADMIN_BASE_URL,
  API_CITAS_BASE_URL // <-- Agrega esta línea
} from '../config';
const Diagnostico = () => {
  // Estados principales
  const [consultas, setConsultas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [error, setError] = useState(null);
  const [errorCitas, setErrorCitas] = useState(null);
  const [activeTab, setActiveTab] = useState('consultas');
  const [tratamientos, setTratamientos] = useState([]);
  const [showMediktorModal, setShowMediktorModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Estados para el formulario de tratamiento
  const [tratamientoForm, setTratamientoForm] = useState({
    descripcion: '',
    sesiones: ''
  });

  const API_BASE = API_BASE_URL;
  const ENDPOINT_CONSULTAS = `${API_BASE}/Consultas/ListarTodasconsultas`;
  const ENDPOINT_CITAS = `${API_CITAS_BASE_URL}/ObtenerCitasxCedula/`;
  const MEDIKTOR_URL = 'https://my.mediktor.com/es';

  // Cargar consultas y citas al montar el componente
  useEffect(() => {
    fetchConsultas();
    fetchCitas();
  }, []);

  // Manejar la aceptación automática de términos
  useEffect(() => {
    if (showMediktorModal && !termsAccepted) {
      const timer = setTimeout(() => {
        setTermsAccepted(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showMediktorModal, termsAccepted]);

  const fetchConsultas = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(ENDPOINT_CONSULTAS, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setConsultas(data?.valor || []);
    } catch (err) {
      setError(`Error al cargar las consultas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitas = async () => {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    const cedula = localStorage.getItem('cedula');
    setLoadingCitas(true);
    setErrorCitas(null);

    if (!cedula) {
      setErrorCitas('No se encontró la cédula del médico en localStorage.');
      setLoadingCitas(false);
      return;
    }

    try {
      const response = await fetch(`${ENDPOINT_CITAS}${cedula}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.esCorrecto && Array.isArray(data.valor)) {
        setCitas(data.valor);
      } else {
        setErrorCitas('No se encontraron citas o la respuesta no es válida.');
      }
    } catch (err) {
      setErrorCitas(`Error al cargar las citas: ${err.message}`);
    } finally {
      setLoadingCitas(false);
    }
  };

  const fetchTratamientos = async (idConsulta) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/Tratamientos/ObtenerTratamientosxIdConsulta/${idConsulta}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTratamientos(data?.valor || []);
      }
    } catch (err) {
      console.error('Error al cargar tratamientos:', err);
    }
  };

  const handleConsultaSelect = async (consulta) => {
    setSelectedConsulta(consulta);
    setActiveTab('tratamiento');
    setTratamientoForm({
      idConsulta: consulta.idConsulta,
      descripcion: '',
      costo: consulta.precioBase || '',
      sesiones: '',
      notas: ''
    });
    await fetchTratamientos(consulta.idConsulta);
  };

  const saveTratamiento = async () => { 
  if (!selectedConsulta) return;

  // Verifica si ya existe un tratamiento para esta consulta
  const yaExiste = tratamientos.some(
    (t) => t.idConsulta === selectedConsulta.idConsulta
  );
  if (yaExiste) {
    alert('Ya existe un tratamiento registrado para esta consulta.');
    return;
  }

  try {
    const tratamientoData = {
      idTratamiento: 0, // El backend debe autogenerarlo
      idConsulta: selectedConsulta.idConsulta,
      descripcion: tratamientoForm.descripcion,
      costo: Number(selectedConsulta.precioBase), // Asegura tipo numérico
      sesiones: Number(tratamientoForm.sesiones)
    };
    console.log(tratamientoData);

    const token = localStorage.getItem('token');
    const response = await fetch(`http://4.237.205.85:7003/api/Tratamientos/RegistrarTratamiento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(tratamientoData)
    });

    const data = await response.json();

    if (response.ok && data.esCorrecto) {
      alert('Tratamiento guardado correctamente');
      await fetchTratamientos(selectedConsulta.idConsulta);
      setTratamientoForm({
        descripcion: '',
        sesiones: ''
      });
    } else {
      alert(data.mensaje || 'Error al guardar el tratamiento');
    }
  } catch (err) {
    alert('Error al guardar el tratamiento');
  }
};


  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openMediktor = () => {
    setShowTermsModal(true);
  };

  const acceptTermsAndOpenMediktor = () => {
    setShowTermsModal(false);
    setShowMediktorModal(true);
  };

  // Filtrar consultas para mostrar solo las con aceptoTratamiento: true
  const consultasConCita = consultas
    .filter(consulta => consulta.aceptoTratamiento)
    .map((consulta) => {
      const cita = citas.find(c => c.idCita === consulta.idCita);
      return { ...consulta, cita: cita || {} };
    });

  // Obtener información completa de la consulta seleccionada
  const consultaConCitaSeleccionada = selectedConsulta ? {
    ...selectedConsulta,
    cita: citas.find(c => c.idCita === selectedConsulta.idCita) || {}
  } : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu activeMenuItem="consultas" setActiveMenuItem={() => {}} />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Consultas y Tratamientos</h1>
                  <p className="text-gray-600">Sistema integrado con diagnóstico asistido</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('consultas')}
                  className={`px-4 py-2 rounded-lg flex items-center ${activeTab === 'consultas' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Consultas
                </button>
                <button
                  onClick={() => setActiveTab('tratamiento')}
                  className={`px-4 py-2 rounded-lg flex items-center ${activeTab === 'tratamiento' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  disabled={!selectedConsulta}
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Tratamiento
                </button>
              </div>
            </div>
          </div>

          {/* Panel de Consultas */}
          {activeTab === 'consultas' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Consultas Médicas ({consultasConCita.length})
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      fetchConsultas();
                      fetchCitas();
                    }}
                    disabled={loading || loadingCitas}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${(loading || loadingCitas) ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                </div>
              </div>

              {(error || errorCitas) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800">{error || errorCitas}</p>
                </div>
              )}

              {(loading || loadingCitas) ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando información...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Consulta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Consulta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Cita</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consultasConCita.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                            No hay consultas disponibles
                          </td>
                        </tr>
                      ) : (
                        consultasConCita.map((consulta) => (
                          <tr key={consulta.idConsulta} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{consulta.idConsulta}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {consulta.cita?.cedulaPaciente || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(consulta.fecha)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {consulta.cita?.fechaCita ? formatDate(consulta.cita.fechaCita) : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {consulta.cita?.motivo || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${consulta.precioBase || '0'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {consulta.notas || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleConsultaSelect(consulta)}
                                className="text-blue-600 hover:text-blue-900 mr-2"
                              >
                                Tratamiento
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Panel de Tratamiento */}
          {activeTab === 'tratamiento' && consultaConCitaSeleccionada && (
            <div className="space-y-6">
              {/* Información de la Consulta */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Información de la Consulta
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Consulta</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.idConsulta}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Cita</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.idCita}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paciente (Cédula)</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.cita?.cedulaPaciente || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Consulta</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(consultaConCitaSeleccionada.fecha)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Cita</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {consultaConCitaSeleccionada.cita?.fechaCita ? formatDate(consultaConCitaSeleccionada.cita.fechaCita) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hora Cita</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.cita?.horaCita || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Base</label>
                    <p className="mt-1 text-sm text-gray-900">${consultaConCitaSeleccionada.precioBase || '0'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Médico</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.cita?.cedulaMedico || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado Cita</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.cita?.estado || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Motivo</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.cita?.motivo || '-'}</p>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Notas de la Consulta</label>
                    <p className="mt-1 text-sm text-gray-900">{consultaConCitaSeleccionada.notas || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Lista de Tratamientos Existentes */}
              {tratamientos.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                    Tratamientos Registrados
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesiones</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tratamientos.map((tratamiento) => (
                          <tr key={tratamiento.idTratamiento}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tratamiento.descripcion}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tratamiento.costo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tratamiento.sesiones}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{tratamiento.notas}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tratamiento.fechaCreacion)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Formulario de Tratamiento */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                    Registrar Tratamiento
                  </h2>
                  <button
                    onClick={openMediktor}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Asistente de Diagnóstico
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                    <textarea
                      value={tratamientoForm.descripcion}
                      onChange={(e) => setTratamientoForm({...tratamientoForm, descripcion: e.target.value})}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción detallada del tratamiento..."
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo *</label>
                      <input
                        type="number"
                        value={selectedConsulta?.precioBase || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                        placeholder="Costo del tratamiento"
                        required
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sesiones *</label>
                      <input
                        type="number"
                        value={tratamientoForm.sesiones}
                        onChange={(e) => setTratamientoForm({...tratamientoForm, sesiones: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Número de sesiones"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setActiveTab('consultas')}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveTratamiento}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    Guardar Tratamiento
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Términos y Condiciones */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4 bg-blue-600 text-white">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 mr-2" />
                <h3 className="text-xl font-semibold">Términos y Condiciones</h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <h4 className="font-medium text-lg mb-4">Evaluación de Diagnóstico</h4>
              <div className="prose prose-sm text-gray-700">
                <p>Por favor, acepte los términos y condiciones para utilizar el asistente de diagnóstico:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Este es un sistema de apoyo al diagnóstico y no sustituye el juicio clínico profesional</li>
                  <li>Los resultados deben ser validados por un médico calificado</li>
                  <li>Usted es responsable de la interpretación final de los resultados</li>
                  <li>Se requiere su consentimiento para el procesamiento de datos médicos</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t p-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={acceptTermsAndOpenMediktor}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mediktor */}
      {showMediktorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b p-4 bg-blue-600 text-white">
              <div className="flex items-center">
                <Brain className="h-6 w-6 mr-2" />
                <h3 className="text-xl font-semibold">Asistente de Diagnóstico Mediktor</h3>
              </div>
              <button 
                onClick={() => {
                  setShowMediktorModal(false);
                  setTermsAccepted(false);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 relative">
              {!termsAccepted ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center p-6 max-w-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700">Preparando el asistente de diagnóstico...</p>
                    <p className="text-sm text-gray-500 mt-2">Configurando la sesión</p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={MEDIKTOR_URL}
                  className="w-full h-full border-0"
                  allow="microphone; camera"
                  title="Mediktor Diagnostic Assistant"
                />
              )}
            </div>
            
            <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Los resultados son sugerencias y deben ser validados por un profesional.
              </div>
              <button
                onClick={() => {
                  setShowMediktorModal(false);
                  setTermsAccepted(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diagnostico;