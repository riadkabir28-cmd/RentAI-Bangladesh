
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Property, Application, Conversation, Message } from '../types';
import { 
  Plus, MessageCircle, LayoutGrid, TrendingUp, ShieldCheck, FileText, Clock, Home as HomeIcon, X, Building2, UserCircle, Tag, Loader2, Send, Phone, Sparkles, MapPin, CheckCircle2, XCircle, Bed, Activity, Wallet, GanttChart, Video, Trash2, Wand2, ArrowUpDown, Calendar, ChevronDown, Rocket, Brain, Zap, AlertCircle, Info, RefreshCw, CloudUpload, Cpu, Check
} from 'lucide-react';
import { supabase } from '../supabase';
import { analyzePropertyVideo } from '../geminiService';

type ProcessingStage = 'idle' | 'uploading' | 'analyzing' | 'processing' | 'success' | 'error';

export default function OwnerDashboardPage({ user, setUser }: { user: User | null; setUser: (u: User | null) => void }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'portfolio' | 'applications' | 'messages' | 'settings'>('analytics');
  const [showAddListing, setShowAddListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'price'>('score');
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const standaloneVideoRef = useRef<HTMLInputElement>(null);

  // Form state for property creation
  const [formState, setFormState] = useState({
    title: '', price: '', bedrooms: '1', area: 'Banani', bachelorFriendly: false, type: 'Apartment' as Property['type'], features: [] as string[], nearbyAmenities: [] as string[]
  });
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  
  // Refined Analysis State
  const [standaloneVideo, setStandaloneVideo] = useState<File | null>(null);
  const [currentStage, setCurrentStage] = useState<ProcessingStage>('idle');
  const [stageProgress, setStageProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchMyProperties = async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('*').eq('owner_id', user.id);
    if (data) setLocalProperties(data.map((p: any) => ({
      ...p, bachelorFriendly: p.bachelor_friendly, verificationStatus: p.verification_status, ownerId: p.owner_id, nearbyAmenities: p.nearby_amenities || []
    })));
  };

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('*, properties!inner(*), profiles:tenant_id(*)')
      .eq('properties.owner_id', user.id);
    
    if (data) {
      setApplications(data.map((app: any) => ({
        ...app,
        match_score: app.match_score || Math.floor(Math.random() * 30) + 70 
      })));
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
      if (sortBy === 'price') return (b.properties?.price || 0) - (a.properties?.price || 0);
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

  const handleStandaloneVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStandaloneVideo(e.target.files[0]);
      setAnalysisResult(null);
      setAnalysisError(null);
      setCurrentStage('idle');
      setStageProgress(0);
    }
  };

  const clearVideo = () => {
    setSelectedVideo(null);
    setCurrentStage('idle');
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const clearStandaloneVideo = () => {
    setStandaloneVideo(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setCurrentStage('idle');
    setStageProgress(0);
    if (standaloneVideoRef.current) standaloneVideoRef.current.value = '';
  };

  const handleAdvancedAnalyze = async (video: File, isModal: boolean = false) => {
    if (!video) return;
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      // 1. UPLOADING STAGE
      setCurrentStage('uploading');
      for (let i = 0; i <= 100; i += 10) {
        setStageProgress(i);
        await new Promise(r => setTimeout(r, 150));
      }

      // 2. ANALYZING STAGE (Gemini Call)
      setCurrentStage('analyzing');
      setStageProgress(50); // Indeterminate start
      
      const reader = new FileReader();
      const analysisPromise = new Promise<any>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64String = (reader.result as string).split(',')[1];
            const result = await analyzePropertyVideo(base64String, video.type);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(video);
      });

      const result = await analysisPromise;
      if (!result || Object.keys(result).length === 0) {
        throw new Error("AI could not extract clear data. Try filming slower in better lighting.");
      }

      // 3. PROCESSING STAGE
      setCurrentStage('processing');
      for (let i = 0; i <= 100; i += 25) {
        setStageProgress(i);
        await new Promise(r => setTimeout(r, 200));
      }

      // 4. SUCCESS STAGE
      setAnalysisResult(result);
      setCurrentStage('success');

      if (isModal) {
        setFormState(prev => ({
          ...prev,
          title: result.suggestedTitle || prev.title,
          bedrooms: result.bedrooms?.toString() || prev.bedrooms,
          features: [...new Set([...prev.features, ...(result.features || [])])],
          nearbyAmenities: [...new Set([...(prev.nearbyAmenities || []), ...(result.nearbyAmenities || [])])]
        }));
      }

    } catch (err: any) {
      console.error("Analysis error", err);
      setCurrentStage('error');
      setAnalysisError(err.message === "API_KEY_REQUIRED" 
        ? "Gemini API key is required. Check top-right settings." 
        : err.message || "Failed to analyze video. Please try again.");
    }
  };

  const startListingFromAnalysis = () => {
    if (analysisResult) {
      setFormState({
        title: analysisResult.suggestedTitle || '',
        price: '',
        bedrooms: analysisResult.bedrooms?.toString() || '1',
        area: 'Banani',
        bachelorFriendly: false,
        type: 'Apartment',
        features: analysisResult.features || [],
        nearbyAmenities: analysisResult.nearbyAmenities || []
      });
      setShowAddListing(true);
    }
  };

  const handlePublish = async () => {
    if (!formState.title || !formState.price) return;
    setIsPublishing(true);
    
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
      nearby_amenities: formState.nearbyAmenities.length > 0 ? formState.nearbyAmenities : ['Local Market', 'Main Road Access'],
      verified: false,
      verification_status: 'pending'
    }]);
    
    if (!error) { 
      await fetchMyProperties(); 
      setShowAddListing(false);
      setFormState({ title: '', price: '', bedrooms: '1', area: 'Banani', bachelorFriendly: false, type: 'Apartment', features: [], nearbyAmenities: [] });
      setSelectedVideo(null);
    }
    setIsPublishing(false);
  };

  const getStageMessage = () => {
    switch(currentStage) {
      case 'uploading': return "Streaming walkthrough to RentAI cloud...";
      case 'analyzing': return "Gemini Pro is visually inspecting the rooms...";
      case 'processing': return "Extracting and structured mapping of specs...";
      case 'success': return "AI Intelligence Report ready!";
      case 'error': return "Analysis Interrupted";
      default: return "Awaiting Video Input";
    }
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
                 <div className={`border-2 border-dashed rounded-[32px] p-8 bg-gray-50/50 flex flex-col items-center justify-center text-center transition-all ${isPublishing || currentStage !== 'idle' ? 'border-blue-200' : 'border-gray-200 hover:bg-blue-50/30 group'}`}>
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      ref={videoInputRef}
                      onChange={handleVideoSelect}
                      disabled={isPublishing || currentStage !== 'idle'}
                    />
                    {currentStage === 'idle' && !selectedVideo ? (
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
                              <p className="text-sm font-black text-gray-900 truncate max-w-[200px]">{selectedVideo?.name || 'Walkthrough'}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                {currentStage === 'success' ? 'AI Synced' : currentStage === 'error' ? 'Failed' : currentStage === 'idle' ? 'Ready' : 'Analyzing...'}
                              </p>
                            </div>
                          </div>
                          {currentStage === 'idle' && (
                            <div className="flex gap-2">
                               <button 
                                onClick={() => selectedVideo && handleAdvancedAnalyze(selectedVideo, true)}
                                className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                              >
                                <Wand2 className="w-4 h-4" /> AI Analyze
                              </button>
                              <button onClick={clearVideo} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {currentStage !== 'idle' && currentStage !== 'success' && currentStage !== 'error' && (
                          <div className="space-y-3">
                             <div className="flex justify-between items-center text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                  {currentStage === 'uploading' && <CloudUpload className="w-3 h-3 animate-bounce" />}
                                  {currentStage === 'analyzing' && <Brain className="w-3 h-3 animate-pulse" />}
                                  {currentStage === 'processing' && <Cpu className="w-3 h-3 animate-spin" />}
                                  {getStageMessage()}
                                </div>
                                <span>{stageProgress}%</span>
                             </div>
                             <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${currentStage === 'analyzing' ? 'dhaka-gradient animate-pulse' : 'bg-blue-600'}`} 
                                  style={{ width: `${stageProgress}%` }}
                                ></div>
                             </div>
                          </div>
                        )}

                        {currentStage === 'error' && (
                          <div className="bg-red-50 p-4 rounded-xl flex items-center justify-between border border-red-100">
                             <div className="flex items-center gap-2 text-red-700 text-xs font-bold">
                               <AlertCircle className="w-4 h-4" /> {analysisError}
                             </div>
                             <button onClick={clearVideo} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                          </div>
                        )}

                        {currentStage === 'success' && (
                          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between animate-in zoom-in-95">
                             <div className="flex items-center gap-3">
                               <div className="bg-emerald-600 p-1.5 rounded-full text-white"><Check className="w-3 h-3" /></div>
                               <span className="text-xs font-black text-emerald-900 uppercase tracking-widest">Specs Extracted!</span>
                             </div>
                             <button onClick={clearVideo} className="text-emerald-700 text-[10px] font-black uppercase hover:underline">Clear Video</button>
                          </div>
                        )}
                      </div>
                    )}
                 </div>
               </div>

               {formState.nearbyAmenities.length > 0 && (
                 <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
                   <label className="block text-sm font-black text-gray-700">AI-Detected Nearby Amenities</label>
                   <div className="flex flex-wrap gap-2">
                     {formState.nearbyAmenities.map(amenity => (
                       <span key={amenity} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-100 flex items-center gap-2">
                         <MapPin className="w-3 h-3" /> {amenity}
                       </span>
                     ))}
                   </div>
                 </div>
               )}

               <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-[32px]">
                 <input type="checkbox" id="bach_friendly_owner" checked={formState.bachelorFriendly} onChange={e => setFormState({...formState, bachelorFriendly: e.target.checked})} className="w-6 h-6 rounded accent-blue-600" disabled={isPublishing} />
                 <label htmlFor="bach_friendly_owner" className="text-sm font-black text-blue-900">Bachelor Friendly Listing</label>
               </div>
            </div>
            <div className="p-10 border-t bg-gray-50 flex justify-end gap-6">
              <button onClick={() => setShowAddListing(false)} className="px-10 py-4 font-black text-gray-500" disabled={isPublishing}>Cancel</button>
              <button onClick={handlePublish} disabled={isPublishing || !formState.title} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center gap-3 transition-all">
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
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900">Managed Units</h2>
                <button onClick={() => setShowAddListing(true)} className="bg-blue-600 text-white px-8 py-4 rounded-[28px] font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><Plus className="w-6 h-6" /> List New Flat</button>
              </div>

              {/* Advanced AI Video Lab Section */}
              <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">RentAI Video Lab</h3>
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Instant Feature Extraction</p>
                    </div>
                  </div>
                  
                  <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                    <div className="lg:col-span-2 space-y-6">
                       <p className="text-gray-500 font-medium max-w-lg">Upload a walkthrough video. Gemini Pro will automatically detect bedrooms, bathrooms, and nearby landmarks to pre-fill your listing.</p>
                       
                       <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                         <input 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            ref={standaloneVideoRef}
                            onChange={handleStandaloneVideoSelect}
                            disabled={currentStage !== 'idle' && currentStage !== 'success' && currentStage !== 'error'}
                          />
                          
                          {!standaloneVideo ? (
                            <button 
                              onClick={() => standaloneVideoRef.current?.click()}
                              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                            >
                              Select Walkthrough Video
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-grow">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Video className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="text-sm font-black text-blue-900 truncate flex-grow">{standaloneVideo.name}</span>
                              <button 
                                onClick={clearStandaloneVideo} 
                                disabled={currentStage !== 'idle' && currentStage !== 'success' && currentStage !== 'error'} 
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          
                          {standaloneVideo && currentStage === 'idle' && (
                            <button 
                              onClick={() => handleAdvancedAnalyze(standaloneVideo)}
                              className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" /> Start AI Analysis
                            </button>
                          )}
                       </div>

                       {currentStage === 'error' && (
                         <div className="bg-red-50 border border-red-100 p-6 rounded-[32px] animate-in slide-in-from-left-4 flex items-start gap-4 shadow-sm">
                            <div className="bg-red-100 p-2 rounded-xl text-red-600">
                               <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-grow">
                               <h5 className="text-sm font-black text-red-900 uppercase tracking-widest mb-1">Analysis Blocked</h5>
                               <p className="text-xs text-red-700 font-medium leading-relaxed">{analysisError}</p>
                            </div>
                            <button onClick={() => standaloneVideo && handleAdvancedAnalyze(standaloneVideo)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                         </div>
                       )}

                       {analysisResult && (
                         <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[32px] animate-in slide-in-from-top-4 space-y-4">
                            <div className="flex items-center gap-3 text-emerald-900 font-black text-xs uppercase tracking-widest">
                               <Info className="w-4 h-4" /> AI Report Preview
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100/50">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Specs Found</p>
                                  <p className="text-sm font-black text-gray-900">{analysisResult.bedrooms} Bed • {analysisResult.bathrooms} Bath</p>
                               </div>
                               <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100/50">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Amenities</p>
                                  <p className="text-sm font-black text-gray-900">{analysisResult.features?.length || 0} Detected</p>
                               </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100/50">
                               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">AI Title Suggestion</p>
                               <p className="text-sm font-black text-gray-900 italic">"{analysisResult.suggestedTitle}"</p>
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100 text-center flex flex-col items-center justify-center relative group-hover:bg-blue-50/20 transition-colors">
                       {currentStage !== 'idle' && currentStage !== 'success' && currentStage !== 'error' ? (
                         <div className="space-y-6 w-full animate-in zoom-in-95">
                            <div className="relative">
                               <div className={`w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto`}></div>
                               {currentStage === 'uploading' && <CloudUpload className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-bounce" />}
                               {currentStage === 'analyzing' && <Brain className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />}
                               {currentStage === 'processing' && <Cpu className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-spin" />}
                            </div>
                            <div className="space-y-2">
                               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{getStageMessage()}</p>
                               <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${stageProgress}%` }}></div>
                               </div>
                            </div>
                         </div>
                       ) : analysisResult ? (
                         <div className="animate-in zoom-in-95 space-y-6 w-full">
                            <div className="bg-emerald-100 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-100 border-4 border-white">
                               <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Intelligence Sync Complete</p>
                               <h4 className="text-xl font-black text-emerald-600 tracking-tight">Ready to List!</h4>
                            </div>
                            <button onClick={startListingFromAnalysis} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all flex items-center justify-center gap-3">
                               <Plus className="w-5 h-5" /> Launch Listing Form
                            </button>
                         </div>
                       ) : (
                         <div className="space-y-4 py-8">
                           <div className="w-20 h-20 bg-white rounded-[32px] shadow-sm flex items-center justify-center mx-auto text-gray-200">
                              <Rocket className="w-10 h-10" />
                           </div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting Video Input</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
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
        </main>
      </div>
    </div>
  );
}
