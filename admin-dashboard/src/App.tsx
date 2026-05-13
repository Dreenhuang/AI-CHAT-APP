import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PushManagement from './pages/PushManagement';

const NavBar: React.FC = () => {
  const location = useLocation();
  const links = [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/push', label: '推送管理', icon: '🔔' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 flex items-center h-14">
        <span className="text-lg font-bold text-gray-900 mr-8">PRD辩论管理后台</span>
        <div className="flex gap-1">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname === link.path
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1.5">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="container mx-auto px-4 py-6 max-w-[1440px]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/push" element={<PushManagement />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
