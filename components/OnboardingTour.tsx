
import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Zap, X, ArrowRight, Home, Users, Search, Target, CheckCircle2 } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "স্বাগতম (Welcome) to RentAI",
    subtitle: "Dhaka's First AI-Powered Rental Protocol",
    description: "We've built a revolutionary platform designed specifically for the unique challenges of the Dhaka rental market. No more brokers, no more bias.",
    icon: Home,
    color: "bg-emerald-600",
    accent: "text-emerald-600",
    image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Gemini Smart Matching",
    subtitle: "AI that understands your lifestyle",
    description: "Our Smart Match engine uses Google's Gemini AI to analyze your lifestyle tags and match you with homes that truly fit. Are you a 'Metro Rail commuter' or a 'Badda foodie'?",
    icon: Sparkles,
    color: "bg-blue-600",
    accent: "text-blue-600",
    image: "https://images.unsplash.com/photo-1551133990-7eee25ad801b?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "NID Verified Trust",
    subtitle: "Zero-Fake-Listing Policy",
    description: "Every listing on RentAI undergoes a strict verification process. Owners are verified using their Smart NIDs, ensuring you only deal with real people and authentic properties.",
    icon: ShieldCheck,
    color: "bg-purple-600",
    accent: "text-purple-600",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Save ৳৳৳ - No Brokers",
    subtitle: "Brokerage Exploitation Ends Here",
    description: "Connect directly with owners through our secure messenger. Save up to one full month's rent by eliminating the 'Media Fee' entirely. It's time for fair renting.",
    icon: Zap,
    color: "bg-amber-500",
    accent: "text-amber-500",
    image: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&q=80&w=800"
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(onComplete, 400);
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-white w-full max-w-4xl rounded-[64px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px] transition-all duration-500 transform ${isExiting ? 'scale-95' : 'scale-100 animate-in zoom-in-95'}`}>
        
        {/* Left Side: Visual/Image */}
        <div className="md:w-1/2 relative bg-gray-900 overflow-hidden group">
          <div className="absolute inset-0 rickshaw-pattern opacity-20"></div>
          <img 
            src={step.image} 
            alt={step.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[2000ms]"
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent`}></div>
          
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className={`inline-flex p-4 rounded-3xl ${step.color} shadow-2xl mb-6`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? `w-12 ${step.color}` : 'w-4 bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-between bg-white">
          <button 
            onClick={handleComplete}
            className="self-end p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="animate-in slide-in-from-right-8 duration-500">
            <h4 className={`text-xs font-black uppercase tracking-[0.3em] ${step.accent} mb-4`}>
              Step {currentStep + 1} of {steps.length}
            </h4>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 mb-2 leading-none">
              {step.title}
            </h2>
            <p className="text-lg font-bold text-gray-400 mb-6">{step.subtitle}</p>
            <p className="text-gray-500 text-lg leading-relaxed font-medium">
              {step.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-gray-100">
            <button 
              onClick={() => currentStep > 0 && setCurrentStep(prev => prev - 1)}
              className={`text-sm font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
            >
              Back
            </button>
            
            <button 
              onClick={handleNext}
              className={`${step.color} text-white px-10 py-5 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all`}
            >
              {currentStep === steps.length - 1 ? 'Start Exploring Dhaka' : 'Next Discovery'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
