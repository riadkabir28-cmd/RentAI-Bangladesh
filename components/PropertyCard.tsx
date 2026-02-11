
import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, MapPin, Bed, Bath, Sparkles, Send, CheckCircle2, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { Property, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

interface PropertyCardProps {
  property: Property;
  user?: User | null;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, user }) => {
  const [applied, setApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('property_id', property.id)
        .eq('tenant_id', user.id)
        .single();
      if (data) setApplied(true);
    };
    checkStatus();
  }, [user, property.id]);

  const handleApply = async () => {
    if (!user) {
      alert("Please sign in to apply for this property.");
      return;
    }
    setIsApplying(true);
    const { error } = await supabase
      .from('applications')
      .insert([{
        property_id: property.id,
        tenant_id: user.id,
        status: 'Pending',
        message: `I am interested in ${property.title}`
      }]);

    if (error) {
      alert("Error applying: " + error.message);
    } else {
      setApplied(true);
    }
    setIsApplying(false);
  };

  const handleMessage = async () => {
    if (!user) {
      alert("Please sign in to message the owner.");
      return;
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('property_id', property.id)
      .eq('tenant_id', user.id)
      .single();

    if (existing) {
      navigate('/dashboard'); // In a full app, pass state to open this specific chat
    } else {
      const { data: created, error } = await supabase
        .from('conversations')
        .insert([{
          property_id: property.id,
          tenant_id: user.id,
          owner_id: property.ownerId
        }])
        .select()
        .single();

      if (error) {
        alert("Error starting conversation: " + error.message);
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
      <div className="relative h-56 shrink-0 overflow-hidden">
        <img 
          src={property.images[0]} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {property.verified && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
          {property.verificationStatus === 'pending' && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              Verifying...
            </span>
          )}
          {property.bachelorFriendly && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
              <UserCheck className="w-3 h-3" />
              Bachelor OK
            </span>
          )}
        </div>
        {property.aiMatchScore !== undefined && (
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-lg border border-emerald-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-emerald-700 font-bold text-sm">{property.aiMatchScore}% Match</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{property.title}</h3>
          <span className="text-emerald-600 font-bold whitespace-nowrap">৳ {property.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4" />
          {property.area}, Dhaka
        </div>
        <div className="flex items-center gap-4 mb-4 border-y border-gray-50 py-3">
          <div className="flex items-center gap-1.5 text-gray-600 text-sm"><Bed className="w-4 h-4" /> {property.bedrooms} Bed</div>
          <div className="flex items-center gap-1.5 text-gray-600 text-sm"><Bath className="w-4 h-4" /> {property.bathrooms} Bath</div>
          <div className="ml-auto text-xs font-medium text-gray-400 px-2 py-0.5 bg-gray-100 rounded">{property.type}</div>
        </div>

        {property.aiReason && (
          <div className="mb-4 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
            <p className="text-xs text-emerald-800 italic leading-relaxed line-clamp-2">"AI: {property.aiReason}"</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-auto">
          <button 
            onClick={handleMessage}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Message Owner
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">Details</button>
            <button 
              disabled={applied || isApplying}
              onClick={handleApply}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                applied 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : 'bg-gray-900 text-white hover:bg-emerald-600 shadow-sm'
              }`}
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : applied ? <><CheckCircle2 className="w-4 h-4" /> Applied</> : <><Send className="w-4 h-4" /> Apply</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
