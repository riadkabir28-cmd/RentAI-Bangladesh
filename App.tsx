
import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, UserCircle, Menu, X, ShieldCheck, MapPin, Users, Building2, LogOut, Sparkles, ArrowRight } from 'lucide-react';
import LandingPage from './views/LandingPage';
import SearchPage from './views/SearchPage';
import DashboardPage from './views/DashboardPage';
import { ChatBot } from './components/ChatBot';
import { User } from './types';
import { supabase } from './supabase';

const AuthModal = ({ isOpen, onClose, onAuth }: { isOpen: boolean; onClose: () => void; onAuth: (role: 'Tenant' | 'Owner') => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 text-center relative">
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="bg-emerald-600 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">Welcome to RentAI</h2>
          <p className="text-gray-500 font-medium mb-10">Select your account type to continue.</p>

          <div className="grid gap-4">
            <button 
              onClick={() => onAuth('Tenant')}
              className="flex items-center justify-between p-6 rounded-3xl border-2 border-emerald-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-gray-900">I am a Tenant</div>
                  <div className="text-xs text-gray-500 font-medium">Search, Match & Rent without brokers.</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button 
              onClick={() => onAuth('Owner')}
              className="flex items-center justify-between p-6 rounded-3xl border-2 border-blue-100 hover:border-blue-600 hover:bg-blue-50 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-gray-900">I am an Owner</div>
                  <div className="text-xs text-gray-500 font-medium">List properties & find verified tenants.</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 p-6 text-center text-[10px] text-gray-400 font-black uppercase tracking-widest border-t">
          Dhaka's Verified Rental Protocol
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ user, setUser, onOpenAuth }: { user: User | null; setUser: (u: User | null) => void; onOpenAuth: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Find Rentals', path: '/search', icon: Search },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
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
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${user.role === 'Owner' ? 'text-blue-600' : 'text-emerald-600'}`}>{user.role}</span>
                    <span className="text-sm font-bold text-gray-700">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${user.role === 'Owner' ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200'}`}>
                    {user.name.charAt(0)}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={onOpenAuth}
                  className="dhaka-gradient text-white px-6 py-2.5 rounded-2xl text-sm font-black hover:shadow-xl transition-all active:scale-95"
                >
                  Join RentAI
                </button>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

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
            {user ? (
              <button onClick={handleSignOut} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600">Sign Out</button>
            ) : (
              <button onClick={onOpenAuth} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-emerald-600">Join RentAI</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const MemoryRouterWrapper = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<'Tenant' | 'Owner' | null>(null);

  const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await syncProfile(session.user);
    }
    setLoading(false);
  };

  const syncProfile = async (user: any, requestedRole?: 'Tenant' | 'Owner') => {
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const newProfile = {
        id: user.id,
        name: user.email?.split('@')[0] || 'Dhakaiya User',
        role: requestedRole || 'Tenant',
        is_bachelor: true,
        budget: 15000,
        preferences: ['Fast WiFi', 'Near Metro Rail'],
        is_verified: false
      };
      const { data: inserted, error: iErr } = await supabase.from('profiles').insert([newProfile]).select().single();
      if (!iErr) profile = inserted;
    }

    if (profile) {
      setCurrentUser({
        id: profile.id,
        name: profile.name,
        role: profile.role,
        isBachelor: profile.is_bachelor,
        budget: profile.budget,
        preferences: profile.preferences || [],
        isVerified: profile.is_verified
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncProfile(session.user, pendingRole || undefined);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    initAuth();
    return () => subscription.unsubscribe();
  }, [pendingRole]);

  const handleAuth = async (role: 'Tenant' | 'Owner') => {
    setPendingRole(role);
    const email = window.prompt(`Enter your email to login as a ${role}:`);
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    
    if (error) {
      alert(error.message);
    } else {
      setIsAuthModalOpen(false);
      alert(`Magic link sent! You will be logged in as a ${role} once you verify your email.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">RentAI Bangladesh</h2>
            <p className="text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] mt-1">Connecting Dhaka...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MemoryRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar user={currentUser} setUser={setCurrentUser} onOpenAuth={() => setIsAuthModalOpen(true)} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} />} />
            <Route path="/search" element={<SearchPage user={currentUser} />} />
            <Route path="/dashboard" element={<DashboardPage user={currentUser} setUser={setCurrentUser} />} />
          </Routes>
        </main>
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onAuth={handleAuth} 
        />

        <ChatBot />

        <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 rickshaw-pattern opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <div className="flex justify-center gap-3 mb-6">
               <ShieldCheck className="w-10 h-10 text-emerald-500" />
               <span className="text-3xl font-black tracking-tighter">RentAI Bangladesh</span>
            </div>
            <p className="text-gray-400 mb-8 font-medium max-w-lg mx-auto">Dhaka's premier AI-powered rental hub. Eliminating the "Ghatok" exploitation through transparency and smart matching.</p>
            <div className="flex flex-wrap justify-center gap-10 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
              <span className="cursor-pointer hover:text-emerald-500 transition-colors">Our Mission</span>
              <span className="cursor-pointer hover:text-emerald-500 transition-colors">Safety Guide</span>
              <span className="cursor-pointer hover:text-emerald-500 transition-colors">Privacy</span>
              <span className="cursor-pointer hover:text-emerald-500 transition-colors">Legal</span>
            </div>
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">&copy; 2024 RentAI. Built for Dhaka. Built for You.</p>
            </div>
          </div>
        </footer>
      </div>
    </MemoryRouter>
  );
}

export default MemoryRouterWrapper;
