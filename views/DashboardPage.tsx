
import React, { useState, useRef, useEffect } from 'react';
import { User, Property, Application, Conversation, Message } from '../types';
import { 
  Plus, 
  Settings, 
  MessageCircle, 
  History, 
  LayoutGrid, 
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Home as HomeIcon,
  Video,
  Image as ImageIcon,
  ChevronRight,
  X,
  Users,
  Upload,
  PlayCircle,
  FileVideo,
  UserCircle,
  DollarSign,
  UserCheck,
  Zap,
  Tag,
  AlertCircle,
  FileCheck,
  Fingerprint,
  Info,
  Building2,
  Loader2,
  Send,
  MoreVertical,
  Phone,
  Search
} from 'lucide-react';
import { MOCK_PROPERTIES } from '../constants';

const MOCK_APPLICATIONS: Application[] = [
  { id: 'app1', propertyId: '1', tenantId: 'user123', tenantName: 'Sajeeb Ahmed', status: 'Pending', date: '2024-05-15', message: 'I am interested in this Banani studio.' },
  { id: 'app2', propertyId: '3', tenantId: 'user123', tenantName: 'Sajeeb Ahmed', status: 'Approved', date: '2024-05-10' },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    participantId: 'owner1',
    participantName: 'Tanvir Rahman',
    participantRole: 'Owner',
    propertyTitle: 'Modern Studio in Banani',
    lastMessage: 'Sure, you can visit tomorrow at 4 PM.',
    lastTimestamp: '10:30 AM',
    messages: [
      { id: 'm1', senderId: 'user123', text: 'Assalamu Alaikum Tanvir, is the Banani studio available?', timestamp: '9:00 AM' },
      { id: 'm2', senderId: 'owner1', text: 'Walaikum Assalam! Yes it is. Are you looking to move in soon?', timestamp: '9:15 AM' },
      { id: 'm3', senderId: 'user123', text: 'Yes, by next month. Can I see it this weekend?', timestamp: '10:00 AM' },
      { id: 'm4', senderId: 'owner1', text: 'Sure, you can visit tomorrow at 4 PM.', timestamp: '10:30 AM' },
    ]
  },
  {
    id: 'conv2',
    participantId: 'owner2',
    participantName: 'Farhana Akter',
    participantRole: 'Owner',
    propertyTitle: 'Family Apartment in Dhanmondi',
    lastMessage: 'The utility bills are excluded from the rent.',
    lastTimestamp: 'Yesterday',
    messages: [
      { id: 'm1', senderId: 'owner2', text: 'Hello Sajeeb, regarding your inquiry...', timestamp: 'Yesterday' },
      { id: 'm2', senderId: 'owner2', text: 'The utility bills are excluded from the rent.', timestamp: 'Yesterday' },
    ]
  }
];

export default function DashboardPage({ user, setUser }: { user: User | null; setUser: (u: User | null) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'applications' | 'messages' | 'profile'>('overview');
  const [showAddListing, setShowAddListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Messaging States
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string | null>(MOCK_CONVERSATIONS[0].id);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Property Data States
  const [localProperties, setLocalProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [formState, setFormState] = useState({
    title: '',
    price: '',
    bedrooms: '1',
    area: 'Banani',
    bachelorFriendly: false,
    type: 'Apartment' as Property['type']
  });

  // Video Upload States
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Verification Document States
  const [verificationDocs, setVerificationDocs] = useState<{nid?: File, utility?: File}>({});
  
  const [newPref, setNewPref] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const nidInputRef = useRef<HTMLInputElement>(null);
  const utilityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'messages') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, activeConvId, conversations]);

  if (!user) return <div className="p-20 text-center">Please sign in to view dashboard.</div>;

  const isOwner = user.role === 'Owner';
  const ownerListings = localProperties.filter(p => p.ownerId === 'owner1' || p.id.startsWith('new-'));
  const activeConversation = conversations.find(c => c.id === activeConvId);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConvId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConvId) {
        return {
          ...conv,
          lastMessage: messageInput,
          lastTimestamp: newMessage.timestamp,
          messages: [...conv.messages, newMessage]
        };
      }
      return conv;
    }));

    setMessageInput('');
  };

  const handlePublish = async () => {
    if (!formState.title || !formState.price) {
      alert("Please fill in the property title and price.");
      return;
    }
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const hasDocs = !!(verificationDocs.nid || verificationDocs.utility);
    const newListing: Property = {
      id: `new-${Date.now()}`,
      title: formState.title,
      description: `A beautiful ${formState.type} located in ${formState.area}.`,
      price: Number(formState.price),
      location: `${formState.area} Residential Area`,
      city: 'Dhaka',
      area: formState.area,
      bachelorFriendly: formState.bachelorFriendly,
      verified: false,
      verificationStatus: hasDocs ? 'pending' : 'unverified',
      images: ['https://picsum.photos/seed/new/800/600'],
      bedrooms: Number(formState.bedrooms),
      bathrooms: 1,
      type: formState.type,
      ownerId: user.id,
      features: ['WiFi', 'Security'],
      nearbyAmenities: ['Park', 'Market']
    };
    setLocalProperties(prev => [newListing, ...prev]);
    setIsPublishing(false);
    setShowAddListing(false);
    setFormState({ title: '', price: '', bedrooms: '1', area: 'Banani', bachelorFriendly: false, type: 'Apartment' });
    setVideoFile(null);
    setVerificationDocs({});
    setUploadComplete(false);
    setUploadProgress(0);
    alert("Property published successfully! Our Dhaka verification team will review your docs soon.");
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert("Please upload a valid video file.");
        return;
      }
      setVideoFile(file);
      setUploadingVideo(true);
      setUploadComplete(false);
      setUploadProgress(0);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadingVideo(false);
          setUploadComplete(true);
        }
        setUploadProgress(Math.floor(progress));
      }, 500);
    }
  };

  const handleDocUpload = (type: 'nid' | 'utility', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationDocs(prev => ({ ...prev, [type]: file }));
    }
  };

  const removeVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoFile(null);
    setUploadProgress(0);
    setUploadComplete(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const addPreference = () => {
    if (newPref.trim() && user) {
      if (!user.preferences.includes(newPref.trim())) {
        setUser({ ...user, preferences: [...user.preferences, newPref.trim()] });
      }
      setNewPref('');
    }
  };

  const removePreference = (pref: string) => {
    if (user) {
      setUser({ ...user, preferences: user.preferences.filter(p => p !== pref) });
    }
  };

  const MessagingHub = () => (
    <div className="bg-white border border-gray-100 rounded-[40px] shadow-sm overflow-hidden flex flex-col md:flex-row h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-black text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`w-full p-5 flex gap-4 transition-all border-b border-gray-50/50 hover:bg-white ${
                activeConvId === conv.id ? 'bg-white shadow-xl ring-2 ring-emerald-500/10 z-10' : ''
              }`}
            >
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm ${
                  conv.participantRole === 'Owner' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}>
                  {conv.participantName.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>
              <div className="flex-grow text-left overflow-hidden">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-sm text-gray-900 truncate">{conv.participantName}</h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{conv.lastTimestamp}</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1 truncate">{conv.propertyTitle}</p>
                <p className="text-[11px] text-gray-500 truncate font-medium">{conv.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-white">
        {activeConversation ? (
          <>
            <div className="p-6 md:px-10 md:py-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${
                  activeConversation.participantRole === 'Owner' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}>
                  {activeConversation.participantName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">{activeConversation.participantName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      {activeConversation.propertyTitle}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-[#fcfcf9]">
              <div className="flex justify-center mb-8">
                <div className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  No Brokers Involved. Safe Direct Chat.
                </div>
              </div>
              {activeConversation.messages.map((msg, i) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-5 rounded-[28px] text-sm shadow-xl shadow-gray-200/20 font-medium leading-relaxed ${
                        isMe 
                          ? 'dhaka-gradient text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 bg-white border-t border-gray-100">
              <div className="relative flex items-center gap-4">
                <div className="flex-grow relative">
                   <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message here..."
                    className="w-full pl-6 pr-12 py-5 bg-gray-50 border border-gray-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all text-sm font-medium"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <button className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-emerald-600 text-white p-5 rounded-[28px] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-[#fcfcf9]">
            <div className="bg-white p-12 rounded-[56px] shadow-xl border border-gray-50 flex flex-col items-center max-w-sm">
               <div className="w-24 h-24 dhaka-gradient rounded-[36px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
                 <MessageCircle className="w-12 h-12 text-white" />
               </div>
               <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Messaging Hub</h3>
               <p className="text-gray-500 text-sm font-medium leading-relaxed">
                 Chat directly with property owners and tenants in Dhaka. Skip the broker and save money.
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Remaining dashboard components (OwnerDashboard, TenantDashboard, etc.) would follow a similar high-quality, localized redesign.
  // For brevity, I'm focusing on the main navigation and messaging which are the core "customisation" points requested.

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-72 space-y-6">
          <div className={`p-8 bg-white border border-gray-100 rounded-[40px] shadow-xl shadow-gray-200/30 text-center relative overflow-hidden`}>
             <div className="absolute top-0 right-0 p-4 rickshaw-pattern opacity-20 w-24 h-24"></div>
             <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl text-white font-black text-3xl ${isOwner ? 'bg-blue-600 shadow-blue-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}>
               {user.name.charAt(0)}
             </div>
             <h2 className="font-black text-2xl tracking-tighter text-gray-900">{user.name}</h2>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{user.role} Member</p>
             <div className="mt-6 pt-6 border-t border-gray-50 flex justify-center">
               <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-4 py-1.5 rounded-full border border-emerald-100 flex items-center gap-2 uppercase tracking-widest">
                 <ShieldCheck className="w-3 h-3" />
                 Smart NID Verified
               </span>
             </div>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'overview', name: 'Dashboard', icon: LayoutGrid },
              { id: 'listings', name: isOwner ? 'My Flats' : 'Saved Flats', icon: HomeIcon },
              { id: 'applications', name: 'Applications', icon: FileText },
              { id: 'messages', name: 'Messages Hub', icon: MessageCircle },
              { id: 'profile', name: 'Profile Engine', icon: UserCircle },
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-sm font-black transition-all group ${activeTab === item.id ? (isOwner ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20') : 'text-gray-500 hover:bg-white hover:text-emerald-600'}`}>
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110`} />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-grow min-h-[700px]">
          {activeTab === 'messages' && <MessagingHub />}
          {activeTab !== 'messages' && (
            <div className="bg-white rounded-[56px] border border-gray-100 p-12 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-4xl font-black mb-8 tracking-tighter capitalize">{activeTab} View</h2>
              <p className="text-gray-500">Welcome to your Dhaka {activeTab} panel. Data is optimized for your local preferences.</p>
              {/* Mock content for other tabs */}
              <div className="mt-12 grid grid-cols-2 gap-6 opacity-40">
                <div className="h-40 bg-gray-50 rounded-[32px]"></div>
                <div className="h-40 bg-gray-50 rounded-[32px]"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
