
import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, UserCircle, Menu, X, ShieldCheck, MapPin, Users, Building2 } from 'lucide-react';
import LandingPage from './views/LandingPage';
import SearchPage from './views/SearchPage';
import DashboardPage from './views/DashboardPage';
import { ChatBot } from './components/ChatBot';
import { User } from './types';

const Navbar = ({ user, setUser }: { user: User | null; setUser: (u: User | null) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Find Rentals', path: '/search', icon: Search },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const toggleRole = () => {
    if (!user) return;
    setUser({
      ...user,
      role: user.role === 'Tenant' ? 'Owner' : 'Tenant',
      name: user.role === 'Tenant' ? 'Tanvir (Owner)' : 'Sajeeb (Tenant)'
    });
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
                RentAI
              </span>
            </button>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              {user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleRole}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Switch Role for Demo"
                  >
                    {user.role === 'Tenant' ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    Switch to {user.role === 'Tenant' ? 'Owner' : 'Tenant'}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${user.role === 'Owner' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                      {user.name.charAt(0)}
                    </div>
                  </div>
                </div>
              ) : (
                <button className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-shadow hover:shadow-lg">
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setIsOpen(false); }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              </button>
            ))}
            <button 
              onClick={() => { toggleRole(); setIsOpen(false); }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
            >
              Switch to {user?.role === 'Tenant' ? 'Owner' : 'Tenant'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const MemoryRouterWrapper = () => {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'user123',
    name: 'Sajeeb Ahmed',
    role: 'Tenant',
    isBachelor: true,
    budget: 20000,
    preferences: ['Fast WiFi', 'Near Office', 'Modern Design']
  });

  return (
    <MemoryRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar user={currentUser} setUser={setCurrentUser} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchPage user={currentUser} />} />
            <Route path="/dashboard" element={<DashboardPage user={currentUser} setUser={setCurrentUser} />} />
          </Routes>
        </main>
        
        {/* ChatBot Overlay */}
        <ChatBot />

        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center gap-2 mb-4">
               <ShieldCheck className="w-8 h-8 text-emerald-500" />
               <span className="text-2xl font-bold">RentAI Bangladesh</span>
            </div>
            <p className="text-gray-400 mb-6">Revolutionizing rentals for tenants and owners in BD.</p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <span className="cursor-pointer hover:text-emerald-500">About Us</span>
              <span className="cursor-pointer hover:text-emerald-500">Dhaka Guide</span>
              <span className="cursor-pointer hover:text-emerald-500">Chattogram Launch</span>
              <span className="cursor-pointer hover:text-emerald-500">Terms</span>
            </div>
            <p className="mt-8 text-xs text-gray-600">&copy; 2024 RentAI. No Brokers Allowed.</p>
          </div>
        </footer>
      </div>
    </MemoryRouter>
  );
}

export default MemoryRouterWrapper;
