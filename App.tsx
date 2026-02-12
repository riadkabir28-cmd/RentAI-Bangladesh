
import React, { useState, useEffect, useCallback } from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, UserCircle, Menu, X, ShieldCheck, MapPin, Users, Building2, LogOut, Sparkles, ArrowRight, Mail, Loader2, CheckCircle2, Key, Info, AlertTriangle, FastForward, ExternalLink, Settings, HelpCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import LandingPage from './views/LandingPage.tsx';
import SearchPage from './views/SearchPage.tsx';
import DashboardPage from './views/DashboardPage.tsx';
import OwnerDashboardPage from './views/OwnerDashboardPage.tsx';
import { ChatBot } from './components/ChatBot.tsx';
import { OnboardingTour } from './components/OnboardingTour.tsx';
import { User } from './types.ts';
import { supabase } from './supabase.ts';

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
  const [error, setError] = useState<{msg: string, type?: 'config' | '403' | 'general'} | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  if (!isOpen) return null;

  const handleRoleSelect = (selectedRole: 'Tenant' | 'Owner') => {
    setRole(selectedRole);
    setStep('auth');
    setError(null);
  };

  const handleGoogleAuth = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      await onGoogleLogin(role);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.message?.toLowerCase().includes("missing oauth secret") || 
          err.message?.toLowerCase().includes("provider: google") || 
          err.code === "400" || 
          err.status === 400) {
        setError({
          msg: "Google configuration incomplete in Supabase.",
          type: 'config'
        });
      } 
      else if (err.message?.includes("403") || err.status === 403 || err.message?.includes("access_denied")) {
        setError({
          msg: "Google Access Denied (403).",
          type: '403'
        });
      } else {
        setError({ msg: err.message || 'Google login failed. Please try Email or Demo Mode.' });
      }
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
      setError({ msg: err.message || 'Error sending magic link. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('role');
    setRole(null);
    setEmail('');
    setError(null);
    setShowTroubleshooting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-gray-100 flex flex-col max-h-[90vh]">
        <button onClick={resetAndClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors z-20 bg-gray-50 p-2 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <div className="p-10 text-center relative overflow-y-auto">
          <div className="flex justify-center mb-10 gap-2">
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 'role' ? 'bg-emerald-600 w-16' : 'bg-emerald-100'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 'auth' ? 'bg-emerald-600 w-16' : 'bg-emerald-100'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 'success' ? 'bg-emerald-600 w-16' : 'bg-emerald-100'}`}></div>
          </div>

          {step === 'role' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-600 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-2">Welcome to RentAI</h2>
              <p className="text-gray-500 font-medium mb-10">Choose your path to start exploring Dhaka.</p>

              <div className="grid gap-4">
                <button onClick={() => handleRoleSelect('Tenant')} className="flex items-center justify-between p-7 rounded-[32px] border-2 border-emerald-50 hover:border-emerald-600 hover:bg-emerald-50 transition-all group text-left">
                  <div className="flex items-center gap-5">
                    <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Users className="w-7 h-7" /></div>
                    <div>
                      <div className="font-black text-gray-900 text-lg">I am a Tenant</div>
                      <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Find homes without brokers</div>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>
                <button onClick={() => handleRoleSelect('Owner')} className="flex items-center justify-between p-7 rounded-[32px] border-2 border-blue-50 hover:border-blue-600 hover:bg-blue-50 transition-all group text-left">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 className="w-7 h-7" /></div>
                    <div>
                      <div className="font-black text-gray-900 text-lg">I am an Owner</div>
                      <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">List properties & find tenants</div>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
              
              <div className="mt-10 pt-8 border-t border-gray-100">
                 <button onClick={() => handleRoleSelect('Tenant')} className="flex items-center justify-center gap-2 mx-auto py-3 px-6 rounded-2xl bg-gray-50 text-gray-400 hover:text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-emerald-50">
                    <FastForward className="w-4 h-4" /> Skip Setup & Use Demo Mode
                 </button>
              </div>
            </div>
          )}

          {step === 'auth' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button onClick={() => setStep('role')} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 mb-8 flex items-center justify-center gap-2 mx-auto group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to roles
              </button>
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 mb-2 text-left">Secure Login</h2>
              <p className="text-gray-500 font-medium mb-10 text-left">Continuing as <span className="text-emerald-600 font-black">{role}</span></p>
              
              <div className="space-y-6">
                <button 
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-5 px-8 rounded-[24px] border-2 border-gray-100 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all font-black text-gray-900 flex items-center justify-center gap-4 group shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  ) : (
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  )}
                  {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                {(error?.type === '403' || showTroubleshooting) && (
                  <div className="bg-red-50 rounded-[32px] p-8 text-left border border-red-100 animate-in shake duration-500 shadow-sm">
                    <div className="flex items-center gap-2 text-red-700 font-black text-[11px] uppercase tracking-widest mb-4">
                       <ShieldAlert className="w-4 h-4" /> Fix Google 403: Access Denied
                    </div>
                    <p className="text-xs text-red-900 font-medium leading-relaxed mb-6">
                      If Google says <strong>"403 Forbidden"</strong> or <strong>"Access Denied"</strong>, it means your project is in <strong>"Testing"</strong> mode.
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 bg-white/70 rounded-2xl text-[10px] text-red-800 font-bold space-y-3 border border-red-50 shadow-inner">
                         <div className="flex items-start gap-2">
                           <div className="bg-red-100 w-5 h-5 rounded flex items-center justify-center shrink-0">1</div>
                           <span>Open <strong>OAuth Consent Screen</strong> in Google Cloud.</span>
                         </div>
                         <div className="flex items-start gap-2">
                           <div className="bg-red-100 w-5 h-5 rounded flex items-center justify-center shrink-0">2</div>
                           <span>Under "Publishing Status", click <strong>"PUBLISH APP"</strong>.</span>
                         </div>
                         <div className="flex items-start gap-2">
                           <div className="bg-red-100 w-5 h-5 rounded flex items-center justify-center shrink-0">3</div>
                           <span>OR add your email to the <strong>"Test Users"</strong> list.</span>
                         </div>
                      </div>
                      <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl text-[10px] font-black uppercase text-red-600 border border-red-200 hover:bg-red-50 transition-all shadow-sm">
                        Fix in Google Console <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => role && onDemo(role)} className="w-full bg-gray-900 text-white px-5 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-black transition-all">
                        Bypass with Demo Mode
                      </button>
                    </div>
                  </div>
                )}

                {error?.type === 'config' && (
                  <div className="bg-amber-50 rounded-[32px] p-8 text-left border border-amber-100 animate-in shake duration-500 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-700 font-black text-[11px] uppercase tracking-widest mb-4">
                       <Settings className="w-4 h-4" /> Action Required: Supabase
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed mb-6">
                      Your Supabase project is missing the <strong>Google OAuth Secret</strong>.
                    </p>
                    <div className="space-y-3">
                      <a href="https://supabase.com/dashboard/project/_/auth/providers" target="_blank" className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl text-[10px] font-black uppercase text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all shadow-sm">
                        Open Supabase Settings <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => role && onDemo(role)} className="w-full bg-amber-600 text-white px-5 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-amber-200 hover:bg-amber-700 transition-all">
                        Bypass with Demo Mode
                      </button>
                    </div>
                  </div>
                )}

                {!error && !showTroubleshooting && (
                  <button onClick={() => setShowTroubleshooting(true)} className="text-[9px] text-gray-400 hover:text-red-500 font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Stuck on a 403 Google error?
                  </button>
                )}

                {!error?.type && error?.msg && (
                  <div className="flex items-start gap-3 p-5 bg-red-50 rounded-2xl text-red-600 text-left border border-red-100">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold leading-relaxed">{error.msg}</p>
                  </div>
                )}

                <div className="flex items-center gap-5">
                  <div className="h-px bg-gray-100 flex-grow"></div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">or magic link</span>
                  <div className="h-px bg-gray-100 flex-grow"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="Enter your email address" 
                      className="w-full pl-16 pr-6 py-5 rounded-[24px] border-2 border-gray-50 focus:border-emerald-500 outline-none font-bold transition-all bg-gray-50/50 focus:bg-white focus:shadow-lg focus:shadow-emerald-50" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || !email}
                    className="w-full py-5 rounded-[24px] bg-gray-900 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Request Magic Link'}
                  </button>
                </form>

                <div className="pt-6">
                   <button type="button" onClick={() => role && onDemo(role)} className="flex items-center justify-center gap-3 w-full py-5 rounded-[24px] border-2 border-dashed border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-500 transition-all font-black text-xs uppercase tracking-widest hover:bg-emerald-50/30">
                     <FastForward className="w-5 h-5" /> Instant Explorer Access (Demo)
                   </button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-in zoom-in-95 duration-500 py-10">
              <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 border-8 border-emerald-50 shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">Check Your Inbox</h2>
              <p className="text-gray-500 font-medium mb-10 leading-relaxed px-6 text-lg">
                We've sent a magic login link to <span className="text-gray-900 font-black">{email}</span>. One click and you're in!
              </p>
              <button onClick={resetAndClose} className="bg-gray-900 text-white px-12 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-2xl shadow-gray-200">Got it</button>
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
            
            <div className="flex items-center gap-3 ml-4 h-full pl-4 border-l border-gray-200">
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
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('rentai_onboarding_seen');
    if (!hasSeenTour) {
      setShowOnboarding(true);
    }
  }, []);

  const syncProfile = useCallback(async (supabaseUser: any) => {
    try {
      const storedRole = localStorage.getItem('rentai_pending_role') as 'Tenant' | 'Owner' | null;
      
      let { data: profile, error } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();
      
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
      }

      localStorage.removeItem('rentai_pending_role');

      if (profile) {
        setCurrentUser({ 
          id: profile.id, 
          name: profile.name, 
          role: profile.role, 
          isBachelor: profile.is_bachelor, 
          budget: profile.budget, 
          preferences: profile.preferences || [], 
          isVerified: profile.is_verified 