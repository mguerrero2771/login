import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Calendar, UserCheck, Receipt, Stethoscope,Bell } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'pacientes', label: 'Pacientes', icon: User, href: '/pacientes' },
  { id: 'citas', label: 'Citas', icon: Calendar, href: '/citas' },
  { id: 'consultas', label: 'Consultas', icon: UserCheck, href: '/consultas' },
  { id: 'diagnostico', label: 'Diagnóstico', icon: UserCheck, href: '/diagnostico' },
  {id: 'evolucion', label: 'Evolucion', icon: Receipt, href: '/evolucion' },
  { id: 'pagos', label: 'Pagos', icon: Receipt, href: '/pagos' }
];

const SidebarMenu = ({ activeMenuItem, setActiveMenuItem }) => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">MediSys Pro</h1>
        </div>
      </div>
      <nav className="mt-6">
        <ul className="space-y-1 px-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveMenuItem(item.id);
                    if (item.href !== '#') navigate(item.href);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeMenuItem === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default SidebarMenu;