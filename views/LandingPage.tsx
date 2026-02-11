
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, UserCheck, MessageSquare, Zap, Target, Train, MapPin } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[700px] flex items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 rickshaw-pattern"></div>
        <img 
          src="https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&q=80&w=1920" 
          alt="Dhaka Modern Housing" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/60 to-gray-900/90"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-emerald-600/20 backdrop-blur-xl border border-emerald-500/30 px-5 py-2 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest mb-8 animate-bounce">
            <Zap className="w-3 h-3 fill-emerald-400" />
            #1 Rental Choice in Dhaka
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
            Dhaka Rents <br/><span className="text-emerald-500 underline decoration-yellow-400">Simplified.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
            Eliminate brokers, bypass discrimination, and find verified homes near Metro stations across <span className="text-white font-bold border-b-2 border-emerald-500">Dhaka City</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button 
              onClick={() => navigate('/search')} 
              className="dhaka-gradient text-white px-10 py-5 rounded-[24px] text-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/20"
            >
              <Search className="w-6 h-6" />
              Find Dhaka Basha
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-[24px] text-xl font-bold hover:bg-white/20 transition-all"
            >
              List My Property
            </button>
          </div>
        </div>
      </section>

      {/* Dhaka Metro Rail Highlight */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-blue-900 rounded-[48px] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-800/30 skew-x-12 translate-x-20"></div>
          <div className="relative z-10 flex-grow">
            <div className="inline-flex items-center gap-2 bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              <Train className="w-3 h-3" /> New Filter Available
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">Live Near the Dhaka Metro</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-md">
              Save hours of traffic every week. Filter specifically for properties within a 10-minute walk from Metro Stations.
            </p>
            <button 
              onClick={() => navigate('/search')}
              className="bg-white text-blue-900 px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              Browse Near Metro Stations <Target className="w-4 h-4" />
            </button>
          </div>
          <div className="relative z-10 flex-shrink-0 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-[32px] border border-white/10 text-center">
              <div className="text-4xl font-black">15+</div>
              <div className="text-[10px] uppercase font-bold text-blue-300">MRT Stations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-[32px] border border-white/10 text-center">
              <div className="text-4xl font-black">120+</div>
              <div className="text-[10px] uppercase font-bold text-blue-300">Nearby Homes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dhaka Features */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-black mb-4 tracking-tighter">Dhaka's Fair Choice.</h2>
            <p className="text-gray-500 text-lg">We're addressing the specific pain points of Dhaka's rental market.</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-6 py-3 rounded-2xl">
            <ShieldCheck className="w-5 h-5" /> Trusted by 10k+ Dhakaites
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: "Area-Wise Insights",
              desc: "From the busy alleys of Mirpur to the corporate hubs of Gulshan, get AI advice on local amenities.",
              color: "bg-red-50 text-red-600"
            },
            {
              icon: ShieldCheck,
              title: "NID Verified Owners",
              desc: "Every owner is verified using the Bangladeshi Smart NID system. No fake listings or 'Ghatok' interference.",
              color: "bg-emerald-50 text-emerald-600"
            },
            {
              icon: UserCheck,
              title: "Bachelor Empowerment",
              desc: "Ending the 'No Bachelor' era in Dhaka. Find homes where your lifestyle is respected, not judged.",
              color: "bg-amber-50 text-amber-600"
            }
          ].map((f, i) => (
            <div key={i} className="group p-8 rounded-[40px] bg-white border border-gray-100 hover:border-emerald-100 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all">
              <div className={`${f.color} w-16 h-16 rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-4">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dhaka Footer Testimonial */}
      <section className="max-w-7xl mx-auto px-4 text-center">
        <div className="relative py-20 px-8 rounded-[64px] bg-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 rickshaw-pattern opacity-10"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
             <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 text-white">
               <Zap className="w-8 h-8" />
             </div>
             <p className="text-3xl md:text-4xl font-black leading-[1.1] mb-12 tracking-tight">
               "Finding a flat in Dhaka without a broker used to be impossible. RentAI saved me 40k in media fees."
             </p>
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-emerald-500 overflow-hidden mb-4">
                 <img src="https://i.pravatar.cc/150?u=tanvir" alt="User" />
               </div>
               <div className="font-black text-xl">Ariful Islam</div>
               <div className="text-emerald-400 font-bold text-sm uppercase tracking-widest">IT Specialist, Uttara</div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
