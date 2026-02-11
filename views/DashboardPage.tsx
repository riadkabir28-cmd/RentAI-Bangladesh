
import React, { useState, useRef, useEffect } from 'react';
import { User, Property, Application, Conversation, Message } from '../types';
import { 
  MessageCircle, LayoutGrid, ShieldCheck, FileText, Clock, Home as HomeIcon, X, UserCircle, Tag, Loader2, Send, Phone, Sparkles, MapPin, CheckCircle2, XCircle, Bed, Search, Heart, TrendingUp, Zap, ArrowUpRight, Compass, Star, Coffee, Utensils, Library, Dumbbell
} from 'lucide-react';
import { supabase } from '../supabase';
import { PropertyCard } from '../components/PropertyCard';

export default function DashboardPage({ user, setUser }: { user: User | null; setUser: (u: User | null) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'applications' | 'messages' | 'profile'>('overview');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newPref, setNewPref] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);

  const discoveryVibes = [
    { label: 'Metro Life', icon: Compass, color: 'emerald', tags: ['Near Metro Rail', 'Fast Commute'] },
    { label: 'Study Hub', icon: Library, color: 'blue', tags: ['Quiet Area', 'Near University', 'Library Access'] },
    { label: 'Foodie Heaven', icon: Utensils, color: 'orange', tags: ['Near Food Street', 'Street Food', 'Rooftop Cafes'] },
    { label: 'Fitness Focused', icon: Dumbbell, color: 'purple', tags: ['Gym Nearby', 'Park Access', 'Walking Track'] },
    { label: 'Morning Coffee', icon: Coffee, color: 'amber', tags: ['Cafe Culture', 'Balcony View', 'Morning Sun'] },
  ];

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await supabase.from('applications').select('*, properties(title, area, price, images, bedrooms, bathrooms, type, bachelor_friendly, features, nearby_amenities)').eq('tenant_id', user.id);
    if (data) setApplications(data);
  };

  const fetchSavedProperties = async () => {
    if (!user) return;
    setIsFetchingSaved(true);
    const { data } = await supabase.from('saved_properties').select('properties(*)').eq('user_id', user.id);
    if (data) {
      setSavedProperties(data.map((d: any) => ({
        ...d.properties,
        bachelorFriendly: d.properties.bachelor_friendly,
        verificationStatus: d.properties.verification_status,
        ownerId: d.properties.owner_id,
        nearbyAmenities: d.properties.nearby_amenities || []
      })));
    } else {
      const { data: appData } = await supabase.from('applications').select('properties(*)').eq('tenant_id', user.id);
      if (appData) {
        setSavedProperties(appData.map((d: any) => ({
          ...d.properties,
          bachelorFriendly: d.properties.bachelor_friendly,
          verificationStatus: d.properties.verification_status,
          ownerId: d.properties.owner_id,
          nearbyAmenities: d.properties.nearby_amenities || []
        })));
      }
    }
    setIsFetchingSaved(false);
  };

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from('conversations').select(`*, owner:profiles!fk_owner(name), properties(title)`).eq('tenant_id', user.id);
    if (data) setConversations(data.map((c: any) => ({
      ...c, participantName: c.owner?.name || 'Dhaka Owner', participantRole: 'Owner', propertyTitle: c.properties?.title
    })));
  };

  // Fix: Added fetchMessages to retrieve conversation history when a chat is selected
  const fetchMessages = async (convId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    if (data) setActiveMessages(data);
  };

  // Fix: Added handleSendMessage to allow users to send messages from the dashboard
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConvId || !user) return;
    const { error } = await supabase.from('messages').insert([{ conversation_id: activeConvId, sender_id: user.id, text: messageInput }]);
    if (!error) setMessageInput('');
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchConversations();
      fetchSavedProperties();
    }
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      // Fix: Fetch initial messages for the conversation and subscribe to new updates
      fetchMessages(activeConvId);
      const { data: { subscription } } = supabase.channel(`messages-${activeConvId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` }, (payload) => {
        setActiveMessages(prev => [...prev, payload.new]);
      }).subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [activeConvId]);

  useEffect(() => {
    if (activeTab === 'messages') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, activeTab]);

  if (!user) return null;

  const handleApplyVibe = async (tags: string[]) => {
    const updatedUser = { ...user, preferences: Array.from(new Set([...user.preferences, ...tags])) };
    setUser(updatedUser);
    await saveProfile(updatedUser);
    setActiveTab('overview');
  };

  const saveProfile = async (updatedUser: User) => {
    setIsSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ 
      name: updatedUser.name, role: updatedUser.role, is_bachelor: updatedUser.isBachelor, budget: updatedUser.budget, preferences: updatedUser.preferences 
    }).eq('id', user.id);
    if (!error) setUser(updatedUser);
    setIsSavingProfile(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-80 space-y-8">
          <div className="p-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[56px] shadow-2xl text-center relative overflow-hidden group">
            <div className="absolute inset-0 rickshaw-pattern opacity-10"></div>
            <div className="w-28 h-28 rounded-[40px] mx-auto mb-6 flex items-center justify-center bg-white/20 backdrop-blur-md text-white text-4xl font-black shadow-2xl relative z-10 border border-white/20">
              {user.name.charAt(0)}
            </div>
            <h2 className="font-black text-2xl text-white truncate relative z-10 tracking-tight">{user.name}</h2>
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 relative z-10">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span className="text-[8px] text-emerald-50 font-black uppercase tracking-[0.2em]">Platinum Match</span>
            </div>
          </div>

          <nav className="space-y-3">
            {[
              {id:'overview',name:'Discovery Hub',icon:Compass},
              {id:'saved',name:'Dream Home List',icon:Heart},
              {id:'applications',name:'Journey Log',icon:FileText},
              {id:'messages',name:'Messenger',icon:MessageCircle},
              {id:'profile',name:'Match Engine',icon:UserCircle}
            ].map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id as any)} className={`w-full flex items-center justify-between px-8 py-5 rounded-[32px] text-sm font-black transition-all ${activeTab === i.id ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-200' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className="flex items-center gap-4">
                  <i.icon className="w-6 h-6" />{i.name}
                </div>
                {activeTab === i.id && <ArrowUpRight className="w-4 h-4 opacity-50" />}
              </button>
            ))}
          </nav>

          <div className="p-8 bg-gray-900 rounded-[48px] text-white relative overflow-hidden">
             <div className="absolute inset-0 rickshaw-pattern opacity-10"></div>
             <div className="relative z-10">
               <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
                 <Sparkles className="w-4 h-4 fill-emerald-400" /> Vibe Analytics
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-gray-400 font-bold">Match Readiness</span>
                    <span className="text-xl font-black">94%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[94%]"></div>
                  </div>
               </div>
             </div>
          </div>
        </aside>

        <main className="flex-grow min-h-[800px]">
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <h1 className="text-6xl font-black tracking-tighter text-gray-900 leading-none mb-4">Discovery <span className="text-emerald-600">Hub</span></h1>
                  <p className="text-gray-500 font-medium max-w-lg">Your AI-guided dashboard to the most compatible homes in Dhaka's vibrant market.</p>
                </div>
                <div className="flex gap-4">
                  <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center">
                    <div className="text-2xl font-black text-emerald-900 leading-none mb-1">12</div>
                    <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">New Matches</div>
                  </div>
                </div>
              </div>

              {/* Discovery Vibes Tool */}
              <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Vibe Search</h3>
                  <p className="text-gray-400 text-sm font-medium mb-8">Choose a lifestyle vibe to instantly adjust your discovery engine.</p>
                  <div className="flex flex-wrap gap-4">
                    {discoveryVibes.map((v) => (
                      <button 
                        key={v.label} 
                        onClick={() => handleApplyVibe(v.tags)}
                        className="group flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-[40px] hover:bg-emerald-600 hover:text-white transition-all duration-300 min-w-[140px]"
                      >
                        <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-white/20 group-hover:text-white transition-colors">
                          <v.icon className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[56px] border border-gray-100 shadow-xl space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black tracking-tight">Recent Dream Matches</h3>
                    <div className="bg-gray-900 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-600 transition-colors">View All</div>
                  </div>
                  <div className="grid gap-6">
                    {savedProperties.slice(0, 3).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between p-6 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:border-emerald-100 border border-transparent rounded-[36px] transition-all group cursor-pointer">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-[28px] overflow-hidden shadow-lg">
                            <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-lg">{p.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                               <MapPin className="w-3 h-3 text-emerald-500" />
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.area} • ৳{p.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-200">9{8-i}% VIBE</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[56px] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
                  <div className="absolute inset-0 rickshaw-pattern opacity-10"></div>
                  <div className="relative z-10">
                    <Zap className="w-14 h-14 text-emerald-200 mb-8 fill-emerald-200" />
                    <h3 className="text-4xl font-black mb-4 leading-[0.9] tracking-tighter">Your Dhaka Lifestyle, Refined.</h3>
                    <p className="text-emerald-100 text-sm font-medium leading-relaxed opacity-80">We've identified that you prefer units near green spaces. Adding 'Park View' to your profile could increase match accuracy by 12%.</p>
                  </div>
                  <button onClick={() => setActiveTab('profile')} className="relative z-10 mt-12 bg-white text-emerald-900 py-5 rounded-[32px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Update Match Engine</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-5xl font-black tracking-tighter text-gray-900 mb-4">Engine <span className="text-emerald-600">Sync</span></h2>
                   <p className="text-gray-500 font-medium">Fine-tune your lifestyle tags to unlock premium Dhaka listings.</p>
                </div>
                <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl shadow-emerald-200 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-12 rounded-[56px] border border-gray-100 shadow-2xl space-y-12 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-50/50 rounded-full blur-[100px] -z-10"></div>
                
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block">Legal Identity</label>
                      <input value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full px-8 py-6 rounded-[32px] border-2 border-gray-50 bg-gray-50/50 font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" placeholder="Enter Full Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block">Max Budget</label>
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">৳</span>
                           <input type="number" value={user.budget} onChange={e => setUser({...user, budget: parseInt(e.target.value)})} className="w-full pl-12 pr-8 py-6 rounded-[32px] border-2 border-gray-50 bg-gray-50/50 font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block">Status</label>
                        <button onClick={() => setUser({...user, isBachelor: !user.isBachelor})} className={`w-full py-6 rounded-[32px] border-2 font-black text-xs uppercase tracking-widest transition-all ${user.isBachelor ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                          {user.isBachelor ? 'Bachelor' : 'Family'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block">Lifestyle Tag Cloud</label>
                    <div className="flex flex-wrap gap-3 p-8 bg-emerald-50/30 rounded-[40px] border-2 border-dashed border-emerald-100/50 min-h-[200px]">
                      {user.preferences.map(p => (
                        <button 
                          key={p} 
                          onClick={() => setUser({...user, preferences: user.preferences.filter(pref => pref !== p)})}
                          className="bg-white hover:bg-red-50 hover:text-red-600 text-emerald-700 px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-3 shadow-sm border border-emerald-100 transition-all hover:scale-105"
                        >
                          {p} <X className="w-3 h-3" />
                        </button>
                      ))}
                      {user.preferences.length === 0 && <p className="text-xs text-gray-400 font-medium italic mx-auto mt-12">Start building your lifestyle cloud...</p>}
                    </div>
                    <div className="flex gap-3">
                      <input value={newPref} onChange={e => setNewPref(e.target.value)} onKeyDown={e => e.key === 'Enter' && newPref.trim() && (setUser({...user, preferences: [...user.preferences, newPref.trim()]}), setNewPref(''))} placeholder="e.g. Near Metro Rail" className="flex-grow px-8 py-6 border-2 border-gray-50 bg-white rounded-[32px] font-bold outline-none focus:border-emerald-500 transition-all shadow-lg shadow-gray-100" />
                      <button onClick={() => newPref.trim() && (setUser({...user, preferences: [...user.preferences, newPref.trim()]}), setNewPref(''))} className="bg-emerald-600 text-white px-10 rounded-[32px] font-black hover:bg-gray-900 transition-all shadow-xl shadow-emerald-200">Add</button>
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 p-3 rounded-2xl"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
                      <p className="text-xs text-gray-500 font-medium max-w-[200px]">Profile synced with the Central Dhaka Rental Protocol.</p>
                   </div>
                   <button onClick={() => saveProfile(user)} disabled={isSavingProfile} className="dhaka-gradient text-white px-20 py-7 rounded-[40px] font-black text-lg shadow-2xl shadow-emerald-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                    {isSavingProfile ? <Loader2 className="animate-spin" /> : <Star className="w-6 h-6" />}
                    {isSavingProfile ? 'Updating Engine...' : 'Sync Profile & Discovery Hub'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <h2 className="text-5xl font-black tracking-tighter text-gray-900">Dream <span className="text-emerald-600">List</span></h2>
                  <div className="bg-emerald-600 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest">{savedProperties.length} Homes Saved</div>
               </div>
               {isFetchingSaved ? (
                  <div className="py-40 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Scanning Portfolio...</p>
                  </div>
               ) : savedProperties.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-10">
                    {savedProperties.map(p => <PropertyCard key={p.id} property={p} user={user} />)}
                  </div>
               ) : (
                  <div className="p-40 text-center bg-gray-50/50 rounded-[64px] border-2 border-dashed border-gray-200 shadow-inner">
                    <Heart className="w-20 h-20 text-gray-200 mx-auto mb-8" />
                    <h3 className="text-3xl font-black text-gray-900 mb-2">Your collection is empty</h3>
                    <p className="text-gray-400 font-medium mb-12">Heart homes in the discovery hub to curate your perfect list.</p>
                    <button onClick={() => window.location.href='/search'} className="dhaka-gradient text-white px-12 py-5 rounded-3xl font-black text-sm shadow-2xl shadow-emerald-200 hover:scale-105 transition-all">Start Exploring</button>
                  </div>
               )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <h2 className="text-5xl font-black tracking-tighter text-gray-900">Journey <span className="text-emerald-600">Log</span></h2>
              <div className="grid gap-6">
                {applications.length > 0 ? applications.map(app => (
                  <div key={app.id} className="bg-white p-10 rounded-[48px] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between shadow-xl hover:shadow-2xl transition-all gap-10 group">
                    <div className="flex items-center gap-8">
                      <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-lg group-hover:scale-110 transition-transform"><HomeIcon className="w-10 h-10" /></div>
                      <div>
                        <h4 className="font-black text-2xl text-gray-900 tracking-tight mb-1">{app.properties?.title}</h4>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{app.properties?.area} • ৳{app.properties?.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden md:block">
                         <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Applied On</div>
                         <div className="text-sm font-bold text-gray-700">{new Date(app.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-10 py-4 rounded-[28px] text-[10px] font-black uppercase tracking-widest shadow-xl ${
                        app.status === 'Approved' ? 'bg-emerald-600 text-white shadow-emerald-200' : 
                        app.status === 'Rejected' ? 'bg-red-600 text-white shadow-red-200' : 'bg-gray-900 text-white shadow-gray-200'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="p-40 text-center bg-gray-50/50 rounded-[64px] border-2 border-dashed border-gray-200">
                    <FileText className="w-20 h-20 text-gray-200 mx-auto mb-8" />
                    <h3 className="text-3xl font-black text-gray-900 mb-2">No active journeys</h3>
                    <p className="text-gray-400 font-medium">When you apply for a basha, your progress will be tracked here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-[64px] border border-gray-100 overflow-hidden flex h-[750px] shadow-3xl animate-in zoom-in-95">
              <div className="w-96 border-r flex flex-col bg-gray-50/50">
                <div className="p-12 border-b font-black text-3xl tracking-tighter bg-white flex items-center justify-between">
                  Inbox
                  <div className="bg-emerald-600 text-white w-8 h-8 rounded-full text-[10px] flex items-center justify-center shadow-lg">{conversations.length}</div>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                  {conversations.map(c => (
                    <button key={c.id} onClick={() => setActiveConvId(c.id)} className={`w-full p-8 text-left rounded-[40px] transition-all ${activeConvId === c.id ? 'bg-white shadow-2xl relative z-10' : 'hover:bg-white/50'}`}>
                      <div className="font-black text-gray-900 text-xl leading-tight mb-2">{c.participantName}</div>
                      <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest truncate max-w-[200px]">{c.propertyTitle}</div>
                      {activeConvId === c.id && (
                        <div className="flex items-center gap-2 mt-4">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                           <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Connected Now</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-grow flex flex-col bg-white">
                {activeConvId ? (
                  <>
                    <div className="p-10 border-b flex items-center justify-between bg-white relative z-10 shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-600 rounded-[28px] flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-emerald-200">{conversations.find(c => c.id === activeConvId)?.participantName.charAt(0)}</div>
                        <div>
                          <h4 className="font-black text-2xl text-gray-900 tracking-tight leading-none mb-2">{conversations.find(c => c.id === activeConvId)?.participantName}</h4>
                          <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Verified Dhaka Owner</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button className="p-5 bg-gray-50 rounded-3xl hover:bg-emerald-600 hover:text-white transition-all text-gray-400 group shadow-sm"><Phone className="w-6 h-6 group-hover:scale-110 transition-transform" /></button>
                      </div>
                    </div>
                    <div className="flex-grow p-12 overflow-y-auto space-y-8 bg-gray-50/30 scroll-smooth">
                      {activeMessages.map((m: any) => (
                        <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-8 rounded-[40px] text-sm font-medium shadow-xl leading-relaxed ${m.sender_id === user.id ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                            {m.text}
                            <div className="text-[8px] font-black mt-4 opacity-50 text-right uppercase tracking-widest">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-10 border-t bg-white flex gap-6">
                      <input value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask about the listing..." className="flex-grow px-10 py-6 bg-gray-50 rounded-[32px] outline-none font-bold text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all border border-transparent focus:border-emerald-100" />
                      <button onClick={handleSendMessage} className="bg-emerald-600 text-white p-7 rounded-[32px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-300"><Send className="w-7 h-7" /></button>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-20">
                    <div className="w-40 h-40 bg-gray-50 rounded-[64px] flex items-center justify-center mb-10 text-gray-200 shadow-inner">
                       <MessageCircle className="w-20 h-20" />
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Safe Messaging</h3>
                    <p className="text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">Chat directly with landlords without sharing your personal number until you're ready.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
