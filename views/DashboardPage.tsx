
import React, { useState, useRef, useEffect } from 'react';
import { User, Property, Application, Conversation, Message } from '../types';
import { 
  Plus, MessageCircle, LayoutGrid, TrendingUp, ShieldCheck, FileText, Clock, Home as HomeIcon, Video, 
  Image as ImageIcon, X, Users, FileVideo, UserCircle, Tag, Loader2, Send, MoreVertical, Phone, Search, 
  Sparkles, MapPin, Fingerprint, Building2, History, CheckCircle2, XCircle, Bed
} from 'lucide-react';
import { supabase } from '../supabase';

export default function DashboardPage({ user, setUser }: { user: User | null; setUser: (u: User | null) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'applications' | 'messages' | 'profile'>('overview');
  const [showAddListing, setShowAddListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [newPref, setNewPref] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [formState, setFormState] = useState({
    title: '', price: '', bedrooms: '1', area: 'Banani', bachelorFriendly: false, type: 'Apartment' as Property['type']
  });

  const isOwner = user?.role === 'Owner';

  const fetchMyProperties = async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('*').eq('owner_id', user.id);
    if (data) setLocalProperties(data.map((p: any) => ({
      ...p, bachelorFriendly: p.bachelor_friendly, verificationStatus: p.verification_status, ownerId: p.owner_id, nearbyAmenities: p.nearby_amenities || []
    })));
  };

  const fetchApplications = async () => {
    if (!user) return;
    const query = isOwner 
      ? supabase.from('applications').select('*, properties!inner(title, area, owner_id), profiles:tenant_id(name)').eq('properties.owner_id', user.id)
      : supabase.from('applications').select('*, properties(title, area)').eq('tenant_id', user.id);
    const { data } = await query;
    if (data) setApplications(data);
  };

  const fetchConversations = async () => {
    if (!user) return;
    const column = isOwner ? 'owner_id' : 'tenant_id';
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        tenant:profiles!fk_tenant(name),
        owner:profiles!fk_owner(name),
        properties(title)
      `)
      .eq(column, user.id);

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    if (data) {
      setConversations(data.map((c: any) => ({
        ...c,
        participantName: isOwner ? (c.tenant?.name || 'Dhaka Tenant') : (c.owner?.name || 'Dhaka Owner'),
        participantRole: isOwner ? 'Tenant' : 'Owner',
        propertyTitle: c.properties?.title
      })));
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) setActiveMessages(data);
  };

  const updateApplicationStatus = async (appId: string, status: 'Approved' | 'Rejected') => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId);
    if (!error) fetchApplications();
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
        .channel(`messages-${activeConvId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${activeConvId}` 
        }, (payload) => {
          setActiveMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeConvId]);

  useEffect(() => {
    if (activeTab === 'messages') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[56px] shadow-2xl border border-gray-100 max-w-sm text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
          <UserCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Enter the Hub</h2>
        <p className="text-gray-500 font-medium mb-10 leading-relaxed">Sign in to manage your Dhaka rental profile and view direct owner messages.</p>
        <button className="dhaka-gradient text-white w-full py-4 rounded-2xl font-black shadow-lg shadow-emerald-200" onClick={() => alert('Use Sign In in the Navbar')}>Sign In Now</button>
      </div>
    </div>
  );

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConvId) return;
    const { error } = await supabase.from('messages').insert([{
      conversation_id: activeConvId,
      sender_id: user.id,
      text: messageInput
    }]);
    if (!error) setMessageInput('');
    else alert('Error sending message: ' + error.message);
  };

  const handlePublish = async () => {
    if (!formState.title || !formState.price) return;
    setIsPublishing(true);
    const { error } = await supabase.from('properties').insert([{
      title: formState.title,
      description: `Premium ${formState.type} in the heart of ${formState.area}.`,
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
      features: ['24/7 Security', 'Gas Connection'],
      verified: false,
      verification_status: 'pending'
    }]);
    if (!error) { 
      await fetchMyProperties(); 
      setShowAddListing(false);
      setFormState({ title: '', price: '', bedrooms: '1', area: 'Banani', bachelorFriendly: false, type: 'Apartment' });
    }
    setIsPublishing(false);
  };

  const saveProfile = async (updatedUser: User) => {
    setIsSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ 
      name: updatedUser.name, 
      role: updatedUser.role, 
      is_bachelor: updatedUser.isBachelor, 
      budget: updatedUser.budget, 
      preferences: updatedUser.preferences 
    }).eq('id', user.id);
    
    if (!error) setUser(updatedUser);
    setIsSavingProfile(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {showAddListing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[56px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                 <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Building2 className="w-8 h-8" /></div>
                 <div>
                   <h2 className="text-3xl font-black tracking-tighter">Dhaka Property Launch</h2>
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Post without brokers</p>
                 </div>
              </div>
              <button onClick={() => setShowAddListing(false)}><X className="w-8 h-8 text-gray-400" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-10 space-y-8">
              <div><label className="block text-sm font-black text-gray-700 mb-3">Unit Name</label><input placeholder="e.g. Modern Flat near Road 11" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 focus:bg-white transition-all font-bold outline-none focus:ring-4 focus:ring-blue-500/10" /></div>
              <div className="grid md:grid-cols-2 gap-8">
                <div><label className="block text-sm font-black text-gray-700 mb-3">Monthly Rent (৳)</label><input type="number" placeholder="25000" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 font-bold" /></div>
                <div><label className="block text-sm font-black text-gray-700 mb-3">Location Area</label><select value={formState.area} onChange={e => setFormState({...formState, area: e.target.value})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 font-bold outline-none">
                  {['Banani', 'Gulshan', 'Dhanmondi', 'Mirpur', 'Uttara', 'Bashundhara'].map(a => <option key={a}>{a}</option>)}
                </select></div>
              </div>
              <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-[32px] border border-blue-100">
                <input type="checkbox" id="bach_friendly" checked={formState.bachelorFriendly} onChange={e => setFormState({...formState, bachelorFriendly: e.target.checked})} className="w-6 h-6 rounded accent-blue-600" />
                <label htmlFor="bach_friendly" className="text-sm font-black text-blue-900">This property is Bachelor Friendly (AI Highlighted)</label>
              </div>
            </div>
            <div className="p-10 border-t bg-gray-50 flex justify-end gap-6">
              <button onClick={() => setShowAddListing(false)} className="px-10 py-4 font-black text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
              <button onClick={handlePublish} disabled={isPublishing} className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-2xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                {isPublishing ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                {isPublishing ? 'Publishing...' : 'Launch Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-72 space-y-6">
          <div className="p-10 bg-white border border-gray-100 rounded-[56px] shadow-xl text-center relative overflow-hidden group">
            <div className="absolute inset-0 rickshaw-pattern opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className={`w-24 h-24 rounded-[36px] mx-auto mb-6 flex items-center justify-center text-white text-4xl font-black shadow-2xl relative z-10 ${isOwner ? 'bg-blue-600' : 'bg-emerald-600'}`}>{user.name.charAt(0)}</div>
            <h2 className="font-black text-2xl truncate relative z-10">{user.name}</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase mt-2 tracking-widest relative z-10">{user.role} Member</p>
          </div>
          <nav className="space-y-2">
            {[
              {id:'overview',name:'Stats Hub',icon:LayoutGrid},
              {id:'listings',name:isOwner?'My Properties':'Saved Units',icon:HomeIcon},
              {id:'applications',name:'Apps',icon:FileText},
              {id:'messages',name:'Messages',icon:MessageCircle},
              {id:'profile',name:'Profile Engine',icon:UserCircle}
            ].map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id as any)} className={`w-full flex items-center gap-4 px-8 py-5 rounded-[32px] text-sm font-black transition-all ${activeTab === i.id ? (isOwner?'bg-blue-600 text-white shadow-xl shadow-blue-600/20':'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'):'text-gray-500 hover:bg-white hover:text-emerald-600 hover:shadow-lg'}`}>
                <i.icon className="w-6 h-6" />{i.name}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-grow min-h-[700px]">
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-gray-900 leading-none mb-3">Dashboard <span className="text-emerald-500">Overview</span></h1>
                <p className="text-gray-500 font-medium">Tracking your rental journey across Dhaka city.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {label:'Live Units',val:localProperties.length,icon:HomeIcon,c:'text-blue-600', bg:'bg-blue-50'},
                  {label:'Requests',val:applications.length,icon:FileText,c:'text-emerald-600', bg:'bg-emerald-50'},
                  {label:'Trust Score',val:'High',icon:ShieldCheck,c:'text-purple-600', bg:'bg-purple-50'},
                  {label:'New Messages',val:conversations.length,icon:MessageCircle,c:'text-amber-600', bg:'bg-amber-50'}
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
              
              <div className="bg-gray-900 rounded-[56px] p-12 text-white relative overflow-hidden flex items-center gap-12 group">
                 <div className="absolute inset-0 rickshaw-pattern opacity-10 group-hover:opacity-20 transition-opacity"></div>
                 <div className="relative z-10">
                   <h3 className="text-3xl font-black mb-4 tracking-tight">AI Matching is Live!</h3>
                   <p className="text-gray-400 mb-8 max-w-md font-medium">Our engine is currently ranking 1,240+ properties in Dhaka based on your lifestyle profile.</p>
                   <button onClick={() => setActiveTab('profile')} className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-xs hover:bg-emerald-500 hover:text-white transition-all">Optimize Profile Tags</button>
                 </div>
                 <Sparkles className="w-48 h-48 text-emerald-500/20 absolute right-12 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-4xl font-black tracking-tighter text-gray-900">Rental Applications</h2>
              <div className="grid gap-4">
                {applications.length > 0 ? applications.map(app => (
                  <div key={app.id} className="bg-white p-8 rounded-[40px] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-lg transition-all gap-6">
                    <div className="flex items-center gap-6">
                      <div className="bg-gray-50 p-5 rounded-[24px]"><FileText className="text-gray-400 w-8 h-8" /></div>
                      <div>
                        <h4 className="font-black text-xl text-gray-900">{isOwner ? app.profiles?.name : app.properties?.title}</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{isOwner ? app.properties?.title : app.properties?.area}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        app.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                        app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {app.status}
                      </span>
                      {isOwner && app.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateApplicationStatus(app.id, 'Approved')} className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all" title="Approve"><CheckCircle2 className="w-5 h-5" /></button>
                          <button onClick={() => updateApplicationStatus(app.id, 'Rejected')} className="p-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all" title="Reject"><XCircle className="w-5 h-5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-24 text-center bg-gray-50 rounded-[56px] border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No Applications Found</h3>
                    <p className="text-gray-500">When tenants apply to your units, they will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-[56px] border border-gray-100 overflow-hidden flex h-[700px] shadow-2xl animate-in zoom-in-95">
              <div className="w-80 border-r flex flex-col bg-gray-50/30">
                <div className="p-10 border-b font-black text-2xl tracking-tighter bg-white">Inbox</div>
                <div className="flex-grow overflow-y-auto">
                  {conversations.length > 0 ? conversations.map(c => (
                    <button key={c.id} onClick={() => setActiveConvId(c.id)} className={`w-full p-8 text-left border-b transition-all ${activeConvId === c.id ? 'bg-white shadow-lg relative z-10 border-l-4 border-l-emerald-600' : 'hover:bg-white'}`}>
                      <div className="font-black text-gray-900 text-lg leading-tight mb-1">{c.participantName}</div>
                      <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest truncate">{c.propertyTitle}</div>
                    </button>
                  )) : (
                    <div className="p-12 text-center">
                      <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No chats active</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-grow flex flex-col bg-white">
                {activeConvId ? (
                  <>
                    <div className="p-8 border-b flex items-center justify-between bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-black text-emerald-600">
                          {conversations.find(c => c.id === activeConvId)?.participantName.charAt(0)}
                        </div>
                        <h4 className="font-black text-xl text-gray-900 tracking-tight">
                          {conversations.find(c => c.id === activeConvId)?.participantName}
                        </h4>
                      </div>
                      <Phone className="text-gray-400 cursor-not-allowed w-5 h-5" />
                    </div>
                    <div className="flex-grow p-10 overflow-y-auto space-y-4 bg-gray-50/20">
                      {activeMessages.map((m: any) => (
                        <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] p-5 rounded-[32px] text-sm font-medium shadow-sm leading-relaxed ${m.sender_id === user.id ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-8 border-t bg-white flex gap-4">
                      <input 
                        value={messageInput} 
                        onChange={e => setMessageInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                        placeholder="Write your message here..." 
                        className="flex-grow px-8 py-5 bg-gray-50 rounded-[28px] outline-none font-bold text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                      />
                      <button onClick={handleSendMessage} className="bg-emerald-600 text-white p-5 rounded-[28px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-200">
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-20">
                    <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-8">
                       <MessageCircle className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Private Dhaka Messaging</h3>
                    <p className="text-gray-400 max-w-xs mx-auto font-medium">Select a conversation to start chatting directly with owners or tenants. Your data is encrypted.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div>
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-3">Profile <span className="text-emerald-500">Engine</span></h2>
                <p className="text-gray-500 font-medium">Configure your tenant preferences for the Dhaka matching AI.</p>
              </div>
              <div className="bg-white p-12 rounded-[56px] border border-gray-100 shadow-xl space-y-12">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Full Display Name</label><input value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full px-6 py-5 rounded-2xl border bg-gray-50 font-bold focus:bg-white transition-all outline-none" /></div>
                    <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Monthly Budget (৳)</label><input type="number" value={user.budget} onChange={e => setUser({...user, budget: parseInt(e.target.value)})} className="w-full px-6 py-5 rounded-2xl border bg-gray-50 font-bold focus:bg-white transition-all outline-none" /></div>
                  </div>
                  <div className="space-y-6">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Lifestyle Tags (AI Input)</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.preferences.map(p => (
                        <span key={p} className="bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-3 border border-emerald-100">
                          {p}
                          <button onClick={() => setUser({...user, preferences: user.preferences.filter(pref => pref !== p)})} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                       <input value={newPref} onChange={e => setNewPref(e.target.value)} onKeyDown={e => e.key === 'Enter' && newPref.trim() && (setUser({...user, preferences: [...user.preferences, newPref.trim()]}), setNewPref(''))} placeholder="e.g. Near Metro Rail" className="flex-grow px-5 py-4 border bg-gray-50 rounded-2xl font-bold outline-none" />
                       <button onClick={() => newPref.trim() && (setUser({...user, preferences: [...user.preferences, newPref.trim()]}), setNewPref(''))} className="bg-gray-900 text-white px-6 rounded-2xl font-black">Add</button>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t flex justify-end"><button onClick={() => saveProfile(user)} disabled={isSavingProfile} className="dhaka-gradient text-white px-12 py-5 rounded-3xl font-black shadow-2xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  {isSavingProfile ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  {isSavingProfile ? 'Saving...' : 'Confirm Profile Update'}
                </button></div>
              </div>
            </div>
          )}
          
          {activeTab === 'listings' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900">{isOwner ? 'My Property Portfolio' : 'Saved Listings'}</h2>
                {isOwner && <button onClick={() => setShowAddListing(true)} className="bg-blue-600 text-white px-8 py-4 rounded-[28px] font-black flex items-center gap-3 shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all"><Plus className="w-6 h-6" /> List New Unit</button>}
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                {localProperties.map(p => (
                  <div key={p.id} className="bg-white p-8 rounded-[56px] border border-gray-100 shadow-xl flex flex-col gap-6 group hover:shadow-2xl transition-all">
                    <div className="relative h-56 rounded-[40px] overflow-hidden">
                      <img src={p.images[0]} className="h-full w-full object-cover group-hover:scale-110 transition-all duration-700" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm border border-emerald-100">{p.area}</div>
                    </div>
                    <div>
                      <h4 className="text-3xl font-black tracking-tight text-gray-900 mb-2">{p.title}</h4>
                      <div className="flex justify-between items-center">
                        <div className="text-emerald-600 font-black text-2xl">৳ {p.price.toLocaleString()}</div>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-sm"><Bed className="w-4 h-4" /> {p.bedrooms} Beds</div>
                      </div>
                    </div>
                    <button className="w-full py-4 bg-gray-50 rounded-2xl font-black text-gray-900 border border-gray-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">Manage Listing</button>
                  </div>
                ))}
                {localProperties.length === 0 && (
                  <div className="col-span-2 p-32 text-center bg-gray-50 rounded-[64px] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-100 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                       <Building2 className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Empty Portfolio</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-10">Start by listing your first Dhaka property to find verified tenants instantly.</p>
                    {isOwner && <button onClick={() => setShowAddListing(true)} className="dhaka-gradient text-white px-10 py-4 rounded-2xl font-black shadow-xl">Get Started</button>}
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
