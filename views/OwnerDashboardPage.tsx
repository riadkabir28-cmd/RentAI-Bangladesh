
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Property, Application, Conversation, Message } from '../types';
import { 
  Plus, MessageCircle, LayoutGrid, TrendingUp, ShieldCheck, FileText, Clock, Home as HomeIcon, X, Building2, UserCircle, Tag, Loader2, Send, Phone, Sparkles, MapPin, CheckCircle2, XCircle, Bed, Activity, Wallet, GanttChart, Video, Trash2, Wand2, ArrowUpDown, Calendar, ChevronDown
} from 'lucide-react';
import { supabase } from '../supabase';
import { analyzePropertyVideo } from '../geminiService';

export default function OwnerDashboardPage({ user, setUser }: { user: User | null; setUser: (u: User | null) => void }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'portfolio' | 'applications' | 'messages' | 'settings'>('analytics');
  const [showAddListing, setShowAddListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('score');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState({
    title: '', price: '', bedrooms: '1', area: 'Banani', bachelorFriendly: false, type: 'Apartment' as Property['type'], features: [] as string[]
  });
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  const fetchMyProperties = async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('*').eq('owner_id', user.id);
    if (data) setLocalProperties(data.map((p: any) => ({
      ...p, bachelorFriendly: p.bachelor_friendly, verificationStatus: p.verification_status, ownerId: p.owner_id, nearbyAmenities: p.nearby_amenities || []
    })));
  };

  const fetchApplications = async () => {
    if (!user) return;
    // Fetch applications with joined property data (filtered by owner_id) and tenant profile data
    const { data, error } = await supabase
      .from('applications')
      .select('*, properties!inner(*), profiles:tenant_id(*)')
      .eq('properties.owner_id', user.id);
    
    if (data) {
      // For demonstration, we simulate an AI match score for each application
      // In a production environment, this would be computed by a background AI worker
      const appsWithScores = data.map((app: any) => ({
        ...app,
        match_score: app.match_score || Math.floor(Math.random() * 30) + 70 // Simulate scores between 70-100
      }));
      setApplications(appsWithScores);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from('conversations').select('*, tenant:profiles!fk_tenant(name), properties(title)').eq('owner_id', user.id);
    if (data) setConversations(data.map((c: any) => ({
      ...c,
      participantName: c.tenant?.name || 'Dhaka Tenant',
      participantRole: 'Tenant',
      propertyTitle: c.properties?.title
    })));
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    if (data) setActiveMessages(data);
  };

  useEffect(() => {
    if (user) {
      fetchMyProperties();
      fetchApplications();
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      const channel = supabase
        .channel(`owner-messages-${activeConvId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` }, (payload) => {
          setActiveMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeConvId]);

  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      if (sortBy === 'score') return (b.match_score || 0) - (a.match_score || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [applications, sortBy]);

  if (!user) return null;

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConvId) return;
    const { error } = await supabase.from('messages').insert([{ conversation_id: activeConvId, sender_id: user.id, text: messageInput }]);
    if (!error) setMessageInput('');
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedVideo(e.target.files[0]);
    }
  };

  const clearVideo = () => {
    setSelectedVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleAiVideoAnalyze = async () => {
    if (!selectedVideo) return;
    setIsAnalyzing(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const result = await analyzePropertyVideo(base64String, selectedVideo.type);
      if (result) {
        setFormState(prev => ({
          ...prev,
          title: result.suggestedTitle || prev.title,
          bedrooms: result.bedrooms?.toString() || prev.bedrooms,
          features: [...new Set([...prev.features, ...(result.features || [])])]
        }));
      }
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(selectedVideo);
  };

  const handlePublish = async () => {
    if (!formState.title || !formState.price) return;
    setIsPublishing(true);
    setUploadProgress(0);
    
    if (selectedVideo) {
      const totalSteps = 40;
      for (let i = 1; i <= totalSteps; i++) {
        const progress = Math.min(Math.round((i / totalSteps) * 100), 100);
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }
    }
    
    const { error } = await supabase.from('properties').insert([{
      title: formState.title,
      description: `Premium ${formState.type} managed by verified owner.`,
      price: Number(formState.price),
      area: formState.area,
      city: 'Dhaka',
      location: `${formState.area} Residential Area`,
      bachelor_friendly: formState.bachelorFriendly,
      owner_id: user.id,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'],
      bedrooms: Number(formState.bedrooms),
      bathrooms: 1,
      type: formState.type,
      features: [...formState.features, '24/7 Security', 'CCTV'],
      verified: false,
      verification_status: 'pending'
    }]);
    
    if (!error) { 
      await fetchMyProperties(); 
      setShowAddListing(false);
      setFormState({ title: '', price: '', bedrooms: '1', area: 'Banani', bachelorFriendly: false, type: 'Apartment', features: [] });
      setSelectedVideo(null);
    }
    setIsPublishing(false);
    setUploadProgress(0);
  };

  const getProgressStatusMessage = () => {
    if (isAnalyzing) return "Gemini AI is analyzing room dimensions...";
    if (uploadProgress === 0) return "Preparing secure upload...";
    if (uploadProgress < 30) return "Initializing Dhakaiya tunnel...";
    if (uploadProgress < 60) return "Streaming video chunks...";
    if (uploadProgress < 90) return "Optimizing for low bandwidth...";
    if (uploadProgress < 100) return "Securing listing on protocol...";
    return "Launch sequence complete!";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Listing Modal */}
      {showAddListing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[56px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Building2 className="w-8 h-8" /></div>
                 <div>
                   <h2 className="text-3xl font-black tracking-tighter">Add New Property</h2>
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Portfolio Expansion</p>
                 </div>
              </div>
              <button onClick={() => !isPublishing && setShowAddListing(false)} disabled={isPublishing}><X className="w-8 h-8 text-gray-400" /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh]">
               <div>
                 <label className="block text-sm font-black text-gray-700 mb-3">Unit Name</label>
                 <input placeholder="Modern Flat" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 font-bold outline-none" disabled={isPublishing} />
               </div>
               
               <div className="grid grid-cols-2 gap-8">
                 <div>
                   <label className="block text-sm font-black text-gray-700 mb-3">Rent (৳)</label>
                   <input type="number" placeholder="25000" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 font-bold" disabled={isPublishing} />
                 </div>
                 <div>
                   <label className="block text-sm font-black text-gray-700 mb-3">Bedrooms</label>
                   <input type="number" value={formState.bedrooms} onChange={e => setFormState({...formState, bedrooms: e.target.value})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 font-bold" disabled={isPublishing} />
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="block text-sm font-black text-gray-700">Property Walkthrough (Gemini Pro Analysis)</label>
                 <div className={`border-2 border-dashed rounded-[32px] p-8 bg-gray-50/50 flex flex-col items-center justify-center text-center transition-all ${isPublishing || isAnalyzing ? 'border-blue-200' : 'border-gray-200 hover:bg-blue-50/30 group'}`}>
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      ref={videoInputRef}
                      onChange={handleVideoSelect}
                      disabled={isPublishing || isAnalyzing}
                    />
                    {!selectedVideo ? (
                      <>
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                          <Video className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 mb-4">Select a video for AI-powered listing completion.</p>
                        <button 
                          onClick={() => videoInputRef.current?.click()}
                          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-blue-600 transition-all"
                        >
                          Select Video
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="w-full flex items-center justify-between bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl">
                              <Video className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black text-gray-900 truncate max-w-[200px]">{selectedVideo.name}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                {isAnalyzing ? 'Analyzing with Pro...' : isPublishing ? 'Uploading...' : 'Ready'}
                              </p>
                            </div>
                          </div>
                          {!isPublishing && !isAnalyzing && (
                            <div className="flex gap-2">
                               <button 
                                onClick={handleAiVideoAnalyze}
                                className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                title="Analyze with Gemini Pro"
                              >
                                <Wand2 className="w-4 h-4" /> AI Analyze
                              </button>
                              <button 
                                onClick={clearVideo}
                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Remove video"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {(isPublishing || isAnalyzing) && (
                          <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner border border-gray-200">
                              <div 
                                className={`h-full transition-all duration-500 ease-out shadow-lg ${
                                  isAnalyzing 
                                    ? 'dhaka-gradient animate-pulse' 
                                    : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                }`} 
                                style={{ width: isAnalyzing ? '100%' : `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Loader2 className={`w-3 h-3 text-blue-600 ${isPublishing || isAnalyzing ? 'animate-spin' : ''}`} />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">
                                  {getProgressStatusMessage()}
                                </span>
                              </div>
                              <span className="text-[12px] font-black text-gray-900">
                                {isAnalyzing ? '100%' : `${uploadProgress}%`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                 </div>
               </div>

               <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-[32px]">
                 <input type="checkbox" id="bach_friendly_owner" checked={formState.bachelorFriendly} onChange={e => setFormState({...formState, bachelorFriendly: e.target.checked})} className="w-6 h-6 rounded accent-blue-600" disabled={isPublishing || isAnalyzing} />
                 <label htmlFor="bach_friendly_owner" className="text-sm font-black text-blue-900">Bachelor Friendly Listing</label>
               </div>
            </div>
            <div className="p-10 border-t bg-gray-50 flex justify-end gap-6">
              <button onClick={() => setShowAddListing(false)} className="px-10 py-4 font-black text-gray-500" disabled={isPublishing || isAnalyzing}>Cancel</button>
              <button onClick={handlePublish} disabled={isPublishing || isAnalyzing || !formState.title} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center gap-3 transition-all">
                {isPublishing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Launching...</span>
                  </>
                ) : 'Launch Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-72 space-y-6">
          <div className="p-10 bg-white border border-gray-100 rounded-[56px] shadow-xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-50/50"></div>
            <div className="w-24 h-24 rounded-[36px] mx-auto mb-6 flex items-center justify-center text-white text-4xl font-black shadow-2xl relative z-10 bg-blue-600">
              {user.name.charAt(0)}
            </div>
            <h2 className="font-black text-2xl truncate relative z-10">{user.name}</h2>
            <p className="text-[10px] text-blue-600 font-black uppercase mt-2 tracking-widest relative z-10">Property Owner</p>
          </div>
          <nav className="space-y-2">
            {[
              {id:'analytics',name:'Portfolio Analytics',icon:TrendingUp},
              {id:'portfolio',name:'Managed Units',icon:Building2},
              {id:'applications',name:'Tenant Apps',icon:FileText},
              {id:'messages',name:'Messenger',icon:MessageCircle},
              {id:'settings',name:'Owner Profile',icon:UserCircle}
            ].map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id as any)} className={`w-full flex items-center gap-4 px-8 py-5 rounded-[32px] text-sm font-black transition-all ${activeTab === i.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-lg'}`}>
                <i.icon className="w-6 h-6" />{i.name}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-grow">
          {activeTab === 'analytics' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-5xl font-black tracking-tighter text-gray-900 leading-none mb-3">Owner <span className="text-blue-600">Insights</span></h1>
                   <p className="text-gray-500 font-medium">Tracking your real estate performance in Dhaka city.</p>
                </div>
                <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-6 py-3 rounded-2xl">
                   <ShieldCheck className="w-5 h-5" /> Verified Portfolio
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {label:'Total Assets',val:localProperties.length,icon:HomeIcon,c:'text-blue-600', bg:'bg-blue-50'},
                  {label:'Monthly Yield',val:`৳ ${(localProperties.reduce((acc,p)=>acc+p.price,0)/1000).toFixed(1)}k`,icon:Wallet,c:'text-emerald-600', bg:'bg-emerald-50'},
                  {label:'Occupancy',val:'84%',icon:Activity,c:'text-purple-600', bg:'bg-purple-50'},
                  {label:'Pending Apps',val:applications.filter(a=>a.status==='Pending').length,icon:FileText,c:'text-amber-600', bg:'bg-amber-50'}
                ].map((s,i)=>(
                  <div key={i} className="p-8 bg-white border border-gray-100 rounded-[48px] text-center shadow-sm hover:shadow-xl transition-all group">
                    <div className={`${s.bg} w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <s.icon className={`w-8 h-8 ${s.c}`} />
                    </div>
                    <div className="text-3xl font-black text-gray-900">{s.val}</div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 rounded-[56px] p-12 text-white relative overflow-hidden flex items-center gap-12">
                 <div className="absolute inset-0 rickshaw-pattern opacity-10"></div>
                 <div className="relative z-10 flex-grow">
                   <h3 className="text-3xl font-black mb-4">Rental Smart-Contracting</h3>
                   <p className="text-gray-400 mb-8 max-w-md font-medium">You can now automate monthly rent collection and security deposit handling with RentAI's Escrow system.</p>
                   <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-500 transition-all">Learn About Escrow</button>
                 </div>
                 <GanttChart className="w-48 h-48 text-blue-500/20" />
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900">Managed Units</h2>
                <button onClick={() => setShowAddListing(true)} className="bg-blue-600 text-white px-8 py-4 rounded-[28px] font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><Plus className="w-6 h-6" /> List New Flat</button>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                {localProperties.map(p => (
                  <div key={p.id} className="bg-white p-8 rounded-[56px] border border-gray-100 shadow-xl flex flex-col gap-6 group">
                    <div className="relative h-48 rounded-[40px] overflow-hidden">
                      <img src={p.images[0]} className="h-full w-full object-cover group-hover:scale-110 transition-all duration-700" />
                      <div className="absolute top-4 right-4 bg-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm border border-blue-100">{p.area}</div>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black tracking-tight text-gray-900 mb-2">{p.title}</h4>
                      <div className="flex justify-between items-center">
                        <div className="text-blue-600 font-black text-xl">৳ {p.price.toLocaleString()}</div>
                        <div className="flex items-center gap-4">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                             {p.verified ? 'NID Verified' : 'Verifying...'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter text-gray-900">Tenant <span className="text-blue-600">Apps</span></h2>
                  <p className="text-gray-500 font-medium">Review potential tenants matched by our RentAI engine.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 pl-4 pr-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <ArrowUpDown className="w-3 h-3" /> Sort By
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSortBy('score')}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'score' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                      AI Match
                    </button>
                    <button 
                      onClick={() => setSortBy('date')}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'date' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-500'}`}
                    >
                      Latest
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {sortedApplications.length > 0 ? sortedApplications.map(app => (
                  <div key={app.id} className="bg-white p-10 rounded-[48px] border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between shadow-xl hover:shadow-2xl transition-all gap-10 group relative overflow-hidden">
                    {/* Highlight for high scores */}
                    {app.match_score >= 85 && (
                      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    )}
                    
                    <div className="flex items-center gap-8">
                      <div className="relative">
                        <div className="w-20 h-20 bg-blue-100 rounded-[32px] flex items-center justify-center font-black text-blue-600 text-3xl shadow-inner">
                          {app.profiles?.name?.charAt(0) || 'T'}
                        </div>
                        {app.profiles?.is_verified && (
                          <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                            <ShieldCheck className="w-5 h-5 text-blue-600 fill-blue-50" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-2xl text-gray-900 tracking-tight">{app.profiles?.name}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${app.profiles?.is_bachelor ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {app.profiles?.is_bachelor ? 'Bachelor' : 'Family'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                             <HomeIcon className="w-3 h-3 text-gray-400" />
                             <p className="text-sm font-bold text-gray-700">{app.properties?.title}</p>
                           </div>
                           <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                             <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {app.properties?.area}</span>
                             <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> ৳{app.properties?.price?.toLocaleString()}</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-center">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">RentAI Score</div>
                        <div className={`text-4xl font-black ${app.match_score >= 85 ? 'text-emerald-600' : app.match_score >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {app.match_score}%
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 min-w-[160px]">
                        <button className="bg-gray-900 text-white px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Review Details</button>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-emerald-50 text-emerald-600 p-3 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 className="w-5 h-5 mx-auto" /></button>
                          <button className="flex-1 bg-red-50 text-red-600 p-3 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><XCircle className="w-5 h-5 mx-auto" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-40 text-center bg-gray-50/50 rounded-[64px] border-2 border-dashed border-gray-200 shadow-inner">
                    <FileText className="w-20 h-20 text-gray-200 mx-auto mb-8" />
                    <h3 className="text-3xl font-black text-gray-900 mb-2">No incoming apps</h3>
                    <p className="text-gray-400 font-medium">Tenant applications will appear here once your listings go live.</p>
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
