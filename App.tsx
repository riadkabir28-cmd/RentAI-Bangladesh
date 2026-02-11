
import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, UserCircle, Menu, X, ShieldCheck, MapPin, Users, Building2, LogOut, Sparkles, ArrowRight, Mail, Loader2, CheckCircle2, Key, Info, AlertTriangle, FastForward } from 'lucide-react';
import LandingPage from './views/LandingPage';
import SearchPage from './views/SearchPage';
import DashboardPage from './views/DashboardPage';
import OwnerDashboardPage from './views/OwnerDashboardPage';
import { ChatBot } from './components/ChatBot';
import { User } from './types';
import { supabase } from './supabase';

// Global declaration for AI Studio key management
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const AuthModal = ({ isOpen, onClose, onGoogleLogin, onEmailLogin, onDemo }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onGoogleLogin: (role: 'Tenant' | 'Owner') => Promise<void>;
  onEmailLogin: (role: 'Tenant' | 'Owner', email: string) => Promise<void>;
  onDemo: (role: 'Tenant' | 'Owner') => void;
}) => {
  const [step, setStep] = useState<'role' | 'auth' | 'success'>('role');
  const [role, setRole] = useState<'Tenant' | 'Owner' | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (selectedRole: 'Tenant' | 'Owner') => {
    setRole(selectedRole);
    setStep('auth');
  };

  const handleGoogleAuth = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      await onGoogleLogin(role);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google login is currently unavailable. Please use Email below.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !email) return;
    setLoading(true);
    setError(null);
    try {
      await onEmailLogin(role, email);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Error sending magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('role');
    setRole(null);
    setEmail('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <button onClick={resetAndClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors z-20">
          <X className="w-6 h-6" />
        </button>

        <div className="p-10 text-center relative">
          <div className="flex justify-center mb-10 gap-2">
            <div className={`h-1 w-12 rounded-full transition-all duration-500 ${step === 'role' ? 'bg-emerald-600' : 'bg-emerald-100'}`}></div>
            <div className={`h-1 w-12 rounded-full transition-all duration-500 ${step === 'auth' ? 'bg-emerald-600' : 'bg-emerald-100'}`}></div>
            <div className={`h-1 w-12 rounded-full transition-all duration-500 ${step === 'success' ? 'bg-emerald-600' : 'bg-emerald-100'}`}></div>
          </div>

          {step === 'role' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-600 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">Join RentAI</h2>
              <p className="text-gray-500 font-medium mb-10">Select your role to start your journey in Dhaka.</p>

              <div className="grid gap-4">
                <button onClick={() => handleRoleSelect('Tenant')} className="flex items-center justify-between p-6 rounded-3xl border-2 border-emerald-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group text-left">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Users className="w-6 h-6" /></div>
                    <div>
                      <div className="font-black text-gray-900">I am a Tenant</div>
                      <div className="text-xs text-gray-500 font-medium">Find homes without brokers.</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>
                <button onClick={() => handleRoleSelect('Owner')} className="flex items-center justify-between p-6 rounded-3xl border-2 border-blue-100 hover:border-blue-600 hover:bg-blue-50 transition-all group text-left">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 className="w-6 h-6" /></div>
                    <div>
                      <div className="font-black text-gray-900">I am an Owner</div>
                      <div className="text-xs text-gray-500 font-medium">List properties & find tenants.</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          )}

          {step === 'auth' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button onClick={() => setStep('role')} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 mb-6 flex items-center justify-center gap-2 mx-auto">
                <ArrowRight className="w-3 h-3 rotate-180" /> Back
              </button>
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 mb-2 text-left">Get Started</h2>
              <p className="text-gray-500 font-medium mb-8 text-left">Register as <span className="text-gray-900 font-black">{role}</span></p>
              
              <div className="space-y-6">
                <button 
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-4 px-8 rounded-2xl border-2 border-gray-100 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all font-black text-gray-900 flex items-center justify-center gap-4 group shadow-sm disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Continue with Google
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-gray-100 flex-grow"></div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">or use email</span>
                  <div className="h-px bg-gray-100 flex-grow"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="name@email.com" 
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 outline-none font-bold transition-all bg-gray-50 focus:bg-white" 
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-left">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-tight leading-tight">{error}</p>
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading || !email}
                    className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Magic Link'}
                  </button>
                </form>

                <div className="pt-4">
                   <button type="button" onClick={() => role && onDemo(role)} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-500 transition-all font-black text-[10px] uppercase tracking-widest">
                     <FastForward className="w-4 h-4" /> Just Explore Demo Mode
                   </button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-in zoom-in-95 duration-500">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 className="w-10 h-10 text-emerald-600" /></div>
              <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">Magic Link Sent!</h2>
              <p className="text-gray-500 font-medium mb-10 leading-relaxed px-4">Check your email <span className="text-gray-900 font-black">{email}</span> for a login link. Be sure to check your spam folder too!</p>
              <button onClick={resetAndClose} className="bg-gray-900 text-white px-10 py-4 rounded-3xl font-black hover:bg-emerald-600 transition-all shadow-xl">Got it</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ user, setUser, onOpenAuth }: { user: User | null; setUser: (u: User | null) => void; onOpenAuth: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectAI = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-emerald-600 p-1.5 rounded-lg"><ShieldCheck className="w-6 h-6 text-white" /></div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">RentAI</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate('/search')} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/search' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 hover:text-emerald-600'}`}>Search</button>
            <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 hover:text-emerald-600'}`}>Dashboard</button>
            
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              <button 
                onClick={handleConnectAI}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  hasApiKey ? 'bg-gray-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                }`}
              >
                <Key className="w-3 h-3" />
                {hasApiKey ? 'AI Connected' : 'Connect Gemini'}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-700 leading-none">{user.name}</p>
                    <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">{user.role}</p>
                  </div>
                  <button onClick={() => { supabase.auth.signOut(); setUser(null); navigate('/'); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
                </div>
              ) : (
                <button onClick={onOpenAuth} className="dhaka-gradient text-white px-6 py-2.5 rounded-2xl text-sm font-black hover:shadow-xl transition-all">Join RentAI</button>
              )}
            </div>
          </div>
          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">{isOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-4">
          <button onClick={() => { navigate('/search'); setIsOpen(false); }} className="block w-full text-left font-bold py-2">Search</button>
          <button onClick={() => { navigate('/dashboard'); setIsOpen(false); }} className="block w-full text-left font-bold py-2">Dashboard</button>
          <button onClick={handleConnectAI} className="block w-full text-left font-bold text-blue-600 py-2">Connect AI</button>
          {user ? <button onClick={() => { setUser(null); navigate('/'); setIsOpen(false); }} className="block w-full text-left font-bold text-red-500 py-2">Sign Out</button> : <button onClick={onOpenAuth} className="block w-full text-left font-bold text-emerald-600 py-2">Join RentAI</button>}
        </div>
      )}
    </nav>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await syncProfile(session.user);
    } catch (e) {
      console.warn("Supabase unreachable, continuing in demo-ready mode.");
    } finally {
      setLoading(false);
    }
  };

  const syncProfile = async (supabaseUser: any) => {
    try {
      // Check for a pending role in localStorage (from the pre-OAuth or pre-Email step)
      const storedRole = localStorage.getItem('rentai_pending_role') as 'Tenant' | 'Owner' | null;
      
      let { data: profile, error } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();
      
      // If no profile exists, create one using the stored role or default to Tenant
      if (error && error.code === 'PGRST116') {
        const finalRole = storedRole || 'Tenant';
        const newProfile = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Dhakaiya User',
          role: finalRole,
          is_bachelor: true,
          budget: 20000,
          preferences: ['Near Metro Rail', 'Fast Commute'],
          is_verified: false
        };
        
        const { data: inserted, error: iErr } = await supabase.from('profiles').insert([newProfile]).select().single();
        if (!iErr) profile = inserted;
        
        // Clear stored role after successful creation
        localStorage.removeItem('rentai_pending_role');
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
    } catch (e) {
      console.error("Profile sync error:", e);
    }
  };

  const handleDemoLogin = (role: 'Tenant' | 'Owner') => {
    setCurrentUser({
      id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
      name: 'Demo User',
      role: role,
      isBachelor: true,
      budget: 25000,
      preferences: ['Near Metro Rail', 'Gulshan', 'Fast WiFi'],
      isVerified: true
    });
    setIsAuthModalOpen(false);
  };

  const handleGoogleLogin = async (role: 'Tenant' | 'Owner') => {
    localStorage.setItem('rentai_pending_role', role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  };

  const handleEmailLogin = async (role: 'Tenant' | 'Owner', email: string) => {
    localStorage.setItem('rentai_pending_role', role);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncProfile(session.user);
      } else {
        if (!currentUser?.id.startsWith('demo')) {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });
    initAuth();
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-emerald-600 uppercase tracking-widest text-[10px]">RentAI Dhaka...</p>
      </div>
    </div>
  );

  return (
    <MemoryRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar user={currentUser} setUser={setCurrentUser} onOpenAuth={() => setIsAuthModalOpen(true)} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} />} />
            <Route path="/search" element={<SearchPage user={currentUser} />} />
            <Route path="/dashboard" element={currentUser?.role === 'Owner' ? <OwnerDashboardPage user={currentUser} setUser={setCurrentUser} /> : <DashboardPage user={currentUser} setUser={setCurrentUser} />} />
          </Routes>
        </main>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onDemo={handleDemoLogin}
          onGoogleLogin={handleGoogleLogin}
          onEmailLogin={handleEmailLogin}
        />
        <ChatBot />
      </div>
    </MemoryRouter>
  );
};

export default App;
