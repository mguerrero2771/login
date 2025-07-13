import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login.jsx';
import Registro  from './components/Registro.jsx';
import Dashboard from './components/DashboardMedico.jsx';
import Pacientes from './components/Pacientes.jsx';
import Citas from './components/Citas.jsx';
import Administrativos from './components/Administrativos.jsx';
import Notificaciones from './components/Notificaciones.jsx';
import Pagos from './components/Pagos.jsx';
import Consultas from './components/Consultas.jsx';
import Diagnostico from './components/Diagnostico.jsx';
import DashboardAdmin from './components/DashboardAdmin.jsx';
import PacientesStats from './components/PacientesStats.jsx';
import login from './components/Login.jsx';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Verificar si hay una sesión guardada al cargar la app
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('userData');
    
    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    
    // Guardar en localStorage para persistir la sesión
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    
    // Limpiar localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
  path="/"
  element={
    localStorage.getItem('token')
      ? <Dashboard user={user} onLogout={handleLogout} />
      : <Login onLoginSuccess={handleLoginSuccess} />
  }
/>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard user={user} onLogout={handleLogout} /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/pacientes" element={isAuthenticated ? <Pacientes /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/citas" element={isAuthenticated ? <Citas /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/administrativos" element={isAuthenticated ? <Administrativos /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/notificaciones" element={isAuthenticated ? <Notificaciones /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/pagos" element={isAuthenticated ? <Pagos /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/consultas" element={isAuthenticated ? <Consultas /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/diagnostico" element={isAuthenticated ? <Diagnostico /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/dashboard-admin" element={isAuthenticated ? <DashboardAdmin user={user} onLogout={handleLogout} /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/evolucion" element={isAuthenticated ? <PacientesStats /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          {/* ...otras rutas... */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;