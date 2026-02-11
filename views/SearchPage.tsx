
import { Search, Filter, Sparkles, MapPin, Loader2, Info, Bed, Bath, Tag, X, Plus, ShieldCheck, Train, UserCheck } from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { MOCK_PROPERTIES, AREAS_DHAKA } from '../constants';
import { Property, User, SearchFilters } from '../types';
import { getPropertyMatches } from '../geminiService';
import React, { useState, useMemo } from 'react';

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

  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingStep, setMatchingStep] = useState('');
  const [showAiIntro, setShowAiIntro] = useState(true);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchArea = filters.area ? p.area === filters.area : true;
      const matchPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
      const matchBachelor = filters.bachelorOnly ? p.bachelorFriendly : true;
      const matchType = filters.type ? p.type === filters.type : true;
      const matchBedrooms = filters.bedrooms !== '' ? p.bedrooms === Number(filters.bedrooms) : true;
      const matchMetro = filters.nearMetro ? p.features.includes('Near Metro') : true;
      return matchArea && matchPrice && matchBachelor && matchType && matchBedrooms && matchMetro;
    });
  }, [properties, filters]);

  const handleAiMatch = async () => {
    if (!user) return;
    setIsMatching(true);
    
    const steps = [
      "Checking Metro connectivity...",
      "Analyzing Dhaka lifestyle tags...",
      "Verifying Smart NID owner status...",
      "Matching budget to area averages...",
      "Finalizing Dhaka recommendations..."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setMatchingStep(steps[i % steps.length]);
      i++;
    }, 700);

    try {
      const matchResults = await getPropertyMatches(user, filteredProperties);
      const updatedProperties = properties.map(p => {
        const result = matchResults.find((r: any) => r.id === p.id);
        if (result) {
          return { ...p, aiMatchScore: result.score, aiReason: result.reason };
        }
        return p;
      });
      updatedProperties.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
      setProperties(updatedProperties);
      setShowAiIntro(false);
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(interval);
      setIsMatching(false);
      setMatchingStep('');
    }
  };

  const addPreference = () => {
    if (newPref.trim() && user) {
      setUser({ ...user, preferences: [...user.preferences, newPref.trim()] });
      setNewPref('');
    }
  };

  const removePreference = (pref: string) => {
    if (user) {
      setUser({ ...user, preferences: user.preferences.filter(p => p !== pref) });
    }
  };

  return (
    <div className="bg-[#fcfcf9] min-h-screen pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search Dhaka landmarks (e.g. Road 11, NSU, Metro Station)..." 
                className="w-full pl-12 pr-4 py-4 rounded-3xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-gray-50/50 font-medium"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filters.area}
                onChange={(e) => setFilters({...filters, area: e.target.value})}
                className="px-6 py-4 rounded-3xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold shadow-sm min-w-[180px]"
              >
                <option value="">Dhaka (All Areas)</option>
                {AREAS_DHAKA.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
              <button 
                onClick={handleAiMatch}
                disabled={isMatching}
                className="dhaka-gradient text-white px-8 py-4 rounded-3xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/10 disabled:opacity-50 min-w-[180px] justify-center"
              >
                {isMatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isMatching ? 'Matching...' : 'Smart Match'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-2xl">
              <Filter className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Dhaka Filters</span>
            </div>
            
            <button 
              onClick={() => setFilters(prev => ({...prev, nearMetro: !prev.nearMetro}))}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border shadow-sm ${
                filters.nearMetro ? 'metro-badge border-transparent' : 'bg-white border-gray-100 text-gray-700'
              }`}
            >
              <Train className="w-4 h-4" />
              Near Metro Rail
            </button>

            <button 
              onClick={() => setFilters(prev => ({...prev, bachelorOnly: !prev.bachelorOnly}))}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border shadow-sm ${
                filters.bachelorOnly ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-700'
              }`}
            >
              {/* Added UserCheck to the imports above to fix the error on this line */}
              <UserCheck className="w-4 h-4" />
              Bachelor Friendly
            </button>

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <div className="flex items-center gap-2 border border-gray-100 rounded-2xl px-5 py-2.5 shadow-sm bg-white">
              <span className="text-xs font-black text-gray-400">RENT:</span>
              <select 
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
                className="text-sm font-bold outline-none bg-transparent text-gray-700"
              >
                <option value="200000">Any Budget</option>
                <option value="15000">Under 15k</option>
                <option value="30000">Under 30k</option>
                <option value="60000">Under 60k</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Lifestyle Panel */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                  <Tag className="w-5 h-5" />
                </div>
                Dhaka Lifestyle
              </h3>
              <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">AI analyzes these Dhaka-specific tags to rank your matches.</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {user?.preferences.map(pref => (
                  <span key={pref} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-2xl border border-emerald-100 group">
                    {pref}
                    <button onClick={() => removePreference(pref)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newPref}
                  onChange={(e) => setNewPref(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPreference()}
                  placeholder="e.g. Near Haatirjheel" 
                  className="flex-grow px-4 py-3 text-sm bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button 
                  onClick={addPreference}
                  className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <ShieldCheck className="w-16 h-16 text-emerald-600" />
              </div>
              <h4 className="font-black text-emerald-900 text-sm mb-4 flex items-center gap-2">
                Bhalomanush Protocol
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Our verification system prioritizes "Bhalomanush" (trusted) owners who have clear rental histories and Smart NID verification in the Dhaka metropolitan area.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            {isMatching ? (
              <div className="bg-white rounded-[48px] border border-gray-100 p-24 text-center flex flex-col items-center justify-center shadow-xl shadow-emerald-500/5">
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
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Proprietary Dhaka-Match AI
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.95] tracking-tighter">Dhaka's First <br/><span className="text-emerald-500">Broker-Free</span> Search.</h2>
                  <p className="text-gray-400 mb-12 text-lg md:text-xl leading-relaxed font-medium">
                    Our AI understands the complexities of Dhaka's traffic, areas, and landlord psychology. We find you a home that fits your life, not just your budget.
                  </p>
                  <button 
                    onClick={handleAiMatch}
                    className="dhaka-gradient text-white px-12 py-6 rounded-[32px] font-black text-xl hover:scale-105 transition-all shadow-3xl shadow-emerald-900/40"
                  >
                    Run Smart Match
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {filteredProperties.length > 0 ? (
                  filteredProperties.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="bg-white p-20 rounded-[48px] border-2 border-dashed border-gray-100 shadow-sm max-w-lg mx-auto">
                      <div className="bg-gray-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-gray-300">
                        <MapPin className="w-12 h-12" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No Basha Found</h3>
                      <p className="text-gray-500 mb-10 font-medium">Try broadening your search or exploring a different area in Dhaka.</p>
                      <button 
                        onClick={() => setFilters({
                          city: 'Dhaka', area: '', minPrice: 0, maxPrice: 200000, bachelorOnly: false, type: '', bedrooms: '', bathrooms: '', nearMetro: false
                        })}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all"
                      >
                        Reset Dhaka Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
