
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Zap, Brain, Globe, ExternalLink, Key, Info } from 'lucide-react';
import { getAdvancedChatResponse } from '../geminiService';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'fast' | 'thinking' | 'search'>('fast');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string, grounding?: any[] }[]>([
    { role: 'bot', text: "Assalamu Alaikum! I'm your RentAI assistant. I now have three specialized intelligence modes. How can I assist you in your Dhaka rental journey today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    setKeyError(false);

    try {
      const response = await getAdvancedChatResponse(userMessage, mode);
      
      if (response.text === "API_KEY_REQUIRED") {
        setKeyError(true);
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: "My AI core needs a secure connection to continue. Please connect your Google AI project key to use advanced reasoning modes." 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: response.text || "I'm sorry, I couldn't generate a response. Please try again.",
          grounding: response.grounding
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: "I encountered a technical glitch while thinking. Please try another mode." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectAI = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setKeyError(false);
      setMessages(prev => [...prev, { role: 'bot', text: "AI Connected! I'm ready to continue. How can I help?" }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-[350px] md:w-[450px] h-[600px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-600 p-4 text-white flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl"><Sparkles className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-sm">RentAI Advanced Assistant</h3>
                  <span className="text-[10px] text-emerald-100">Dhakaiya AI Engine v2.0</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex gap-2 p-1 bg-black/10 rounded-xl">
              {[
                { id: 'fast', name: 'Fast', icon: Zap, desc: 'Low-latency (Flash Lite)' },
                { id: 'thinking', name: 'Think', icon: Brain, desc: 'Deep Reasoning (Pro)' },
                { id: 'search', name: 'Live', icon: Globe, desc: 'Web Search (Flash)' }
              ].map(m => (
                <button 
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === m.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-emerald-50 hover:bg-white/5'}`}
                  title={m.desc}
                >
                  <m.icon className="w-3 h-3" /> {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-200' : 'bg-emerald-100'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                  {msg.grounding && (
                    <div className="mt-2 ml-10 space-y-2">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Web Grounding Sources:</p>
                       <div className="flex flex-wrap gap-2">
                         {msg.grounding.map((chunk, idx) => chunk.web && (
                           <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                             <ExternalLink className="w-3 h-3" />
                             {chunk.web.title || 'Grounding Source'}
                           </a>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {keyError && (
              <div className="mx-8 p-6 bg-blue-50 rounded-[32px] border border-blue-100 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center gap-3 text-blue-900 font-black text-xs uppercase tracking-widest">
                  <Key className="w-4 h-4" /> AI Connection Required
                </div>
                <p className="text-xs text-blue-800 font-medium">Please select a paid Google Cloud project API key to use Gemini Pro and Search features.</p>
                <div className="flex items-center gap-2 text-[8px] text-blue-400 font-black uppercase tracking-widest">
                  <Info className="w-3 h-3" /> <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">Billing Guide</a>
                </div>
                <button 
                  onClick={handleConnectAI}
                  className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200"
                >
                  Connect Google AI
                </button>
              </div>
            )}

            {isLoading && (
               <div className="flex justify-start">
                 <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-600 animate-pulse" />
                    </div>
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                       <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                       <span className="text-xs font-medium text-gray-400">
                        {mode === 'thinking' ? 'Deeply reasoning...' : mode === 'search' ? 'Searching Dhaka web...' : 'Thinking fast...'}
                       </span>
                    </div>
                 </div>
               </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={mode === 'search' ? "Ask about Dhaka metro news..." : mode === 'thinking' ? "Explain a legal rental clause..." : "Ask me anything fast..."}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl disabled:opacity-50 transition-all hover:bg-emerald-700 active:scale-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-[8px] text-center text-gray-400 font-black uppercase tracking-widest">
              Powered by RentAI Multi-Model Engine
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-gray-900' : 'dhaka-gradient'} text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap">RentAI Pro</span>}
      </button>
    </div>
  );
};
