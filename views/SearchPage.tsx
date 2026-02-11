
import { Search, Filter, Sparkles, MapPin, Loader2, Info, Bed, Bath, Tag, X, Plus, ShieldCheck, Train, UserCheck, AlertTriangle, Key } from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { AREAS_DHAKA } from '../constants';
import { Property, User, SearchFilters } from '../types';
import { getPropertyMatches } from '../geminiService';
import { supabase } from '../supabase';
import React, { useState, useMemo, useEffect } from 'react';

export default function SearchPage({ user: initialUser }: { user: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [newPref, setNewPref] = useState('');
  const [filters, setFilters] = useState<SearchFilters & { nearMetro: boolean }>({
    city: 'Dhaka',
    area: '',
    minPrice: 0,
    maxPrice: 200000,
    bachelorOnly: false,
    type: '',
    bedrooms: '',
    bathrooms: '',
    nearMetro: false
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingStep, setMatchingStep] = useState('');
  const [showAiIntro, setShowAiIntro] = useState(true);
  const [keyError, setKeyError] = useState(false);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const fetchProperties = async () => {
    setIsLoadingProperties(true);
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (data) {
      setProperties(data.map((p: any) => ({
        ...p, bachelorFriendly: p.bachelor_friendly, verificationStatus: p.verification_status, ownerId: p.owner_id, nearbyAmenities: p.nearby_amenities || []
      })));
    }
    setIsLoadingProperties(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchArea = filters.area ? p.area === filters.area : true;
      const matchPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
      const matchBachelor = filters.bachelorOnly ? p.bachelorFriendly : true;
      const matchMetro = filters.nearMetro ? (p.features || []).includes('Near Metro') : true;
      return matchArea && matchPrice && matchBachelor && matchMetro;
    });
  }, [properties, filters]);

  const handleAiMatch = async () => {
    if (!user || filteredProperties.length === 0) return;
    setIsMatching(true);
    setKeyError(false);
    
    const steps = ["Checking Metro connectivity...", "Analyzing Dhaka lifestyle tags...", "Finalizing Dhaka recommendations..."];
    let i = 0;
    const interval = setInterval(() => { setMatchingStep(steps[i % steps.length]); i++; }, 800);

    try {
      const matchResults = await getPropertyMatches(user, filteredProperties);
      const updatedProperties = properties.map(p => {
        const result = matchResults.find((r: any) => r.id === p.id);
        if (result) return { ...p, aiMatchScore: result.score, aiReason: result.reason };
        return p;
      });
      updatedProperties.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
      setProperties(updatedProperties);
      setShowAiIntro(false);
    } catch (e: any) {
      if (e.message === "API_KEY_REQUIRED") {
        setKeyError(true);
      }
      console.error(e);
    } finally {
      clearInterval(interval);
      setIsMatching(false);
    }
  };

  const handleReconnectAI = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setKeyError(false);
      handleAiMatch();
    }
  };

  return (
    <div className="bg-[#fcfcf9] min-h-screen pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search Dhaka landmarks (e.g. Road 11, NSU, Metro Station)..." className="w-full pl-12 pr-4 py-4 rounded-3xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-gray-50/50 font-medium" />
            </div>
            <div className="flex gap-2">
              <select value={filters.area} onChange={(e) => setFilters({...filters, area: e.target.value})} className="px-6 py-4 rounded-3xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold shadow-sm min-w-[180px]">
                <option value="">Dhaka (All Areas)</option>
                {AREAS_DHAKA.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
              <button onClick={handleAiMatch} disabled={isMatching || isLoadingProperties || !user} className="dhaka-gradient text-white px-8 py-4 rounded-3xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 min-w-[180px] justify-center">
                {isMatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isMatching ? 'Matching...' : 'Smart Match'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button onClick={() => setFilters(prev => ({...prev, nearMetro: !prev.nearMetro}))} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border shadow-sm ${filters.nearMetro ? 'metro-badge border-transparent' : 'bg-white border-gray-100 text-gray-700'}`}><Train className="w-4 h-4" /> Near Metro Rail</button>
            <button onClick={() => setFilters(prev => ({...prev, bachelorOnly: !prev.bachelorOnly}))} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border shadow-sm ${filters.bachelorOnly ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-700'}`}><UserCheck className="w-4 h-4" /> Bachelor Friendly</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {keyError && (
          <div className="mb-12 p-8 bg-red-50 border border-red-100 rounded-[40px] flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4">
             <div className="bg-white p-4 rounded-3xl shadow-sm text-red-600"><AlertTriangle className="w-8 h-8" /></div>
             <div className="flex-grow text-center md:text-left">
               <h3 className="text-xl font-black text-red-900 mb-1">Invalid Gemini API Key</h3>
               <p className="text-sm font-medium text-red-700">Your Google Cloud API key is either missing or invalid. Smart Match requires a valid key from <a href="https://ai.google.dev/gemini-api/docs/billing" className="underline font-bold" target="_blank">a paid billing project</a>.</p>
             </div>
             <button onClick={handleReconnectAI} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2"><Key className="w-4 h-4" /> Re-Connect AI</button>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Tag className="w-5 h-5 text-emerald-600" /> Dhaka Lifestyle</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {user?.preferences.map(pref => (
                  <span key={pref} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-2xl border border-emerald-100">
                    {pref}
                    <button onClick={() => setUser(user ? {...user, preferences: user.preferences.filter(p => p !== pref)} : null)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newPref} onChange={(e) => setNewPref(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setNewPref(''), user && setUser({...user, preferences: [...user.preferences, newPref]}))} placeholder="Add tag..." className="flex-grow px-4 py-3 text-sm bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
                <button onClick={() => {setNewPref(''); user && setUser({...user, preferences: [...user.preferences, newPref]}); }} className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg"><Plus className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {isMatching ? (
              <div className="bg-white rounded-[48px] border border-gray-100 p-24 text-center flex flex-col items-center justify-center shadow-xl">
                <div className="relative mb-10">
                   <div className="w-28 h-28 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                   <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-emerald-600 animate-pulse" />
                </div>
                <h3 className="text-3xl font-black mb-4">Engaging Dhaka Matching Engine...</h3>
                <p className="text-emerald-600 font-black text-lg animate-bounce uppercase tracking-widest">{matchingStep}</p>
              </div>
            ) : showAiIntro ? (
              <div className="bg-gray-900 rounded-[56px] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 rickshaw-pattern opacity-10"></div>
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-3 bg-emerald-600/30 backdrop-blur-md px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 border border-emerald-500/30">
                    <Sparkles className="w-4 h-4 text-yellow-400" /> Proprietary Dhaka-Match AI
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.95] tracking-tighter">Dhaka's First <br/><span className="text-emerald-500">Broker-Free</span> Search.</h2>
                  <button onClick={handleAiMatch} disabled={!user} className="dhaka-gradient text-white px-12 py-6 rounded-[32px] font-black text-xl hover:scale-105 transition-all shadow-3xl shadow-emerald-900/40 disabled:opacity-50">
                    {!user ? 'Sign In to Match' : 'Run Smart Match'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {filteredProperties.length > 0 ? filteredProperties.map(property => <PropertyCard key={property.id} property={property} user={user} />) : <div className="col-span-full py-20 text-center text-gray-400">No properties found matching your Dhaka filters.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
