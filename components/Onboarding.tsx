
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Mic, Camera, BookOpen, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "The Smartest Way to Smoke",
      description: "Welcome to Cigar AI. Your intelligent companion for identifying, logging, and discovering the world's finest cigars.",
      icon: <Sparkles size={64} className="text-amber-500" />,
      color: "from-amber-900/40 to-stone-900"
    },
    {
      title: "Identify Instantly",
      description: "Snap a photo of any cigar band. Our AI analyzes the visual details to identify the brand, vitola, and origin in seconds.",
      icon: <Camera size={64} className="text-amber-500" />,
      color: "from-stone-800 to-stone-900"
    },
    {
      title: "Talk to Havana",
      description: "Have a real-time voice conversation with our AI Sommelier. Ask for pairing advice, cutting techniques, or history lessons.",
      icon: <Mic size={64} className="text-amber-500" />,
      color: "from-red-900/30 to-stone-900"
    },
    {
      title: "Master Your Palate",
      description: "Keep a detailed journal of your smokes. Track flavors, burn quality, and get personalized recommendations based on your taste.",
      icon: <BookOpen size={64} className="text-amber-500" />,
      color: "from-amber-900/40 to-stone-900"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col">
      {/* Background Gradient Animation */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} transition-colors duration-700 ease-in-out`}></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="relative z-10 p-6 flex justify-end">
        <button 
          onClick={onComplete}
          className="text-stone-400 text-sm font-medium hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
        
        {/* Illustration Circle */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-amber-500 blur-[60px] opacity-20 rounded-full animate-pulse"></div>
          <div className="relative w-40 h-40 bg-stone-900/50 backdrop-blur-xl border border-stone-700 rounded-full flex items-center justify-center shadow-2xl ring-1 ring-white/10">
            {slides[currentSlide].icon}
          </div>
        </div>

        {/* Text */}
        <div className="max-w-xs space-y-4 min-h-[160px]">
          <h2 className="serif text-3xl font-bold text-white leading-tight">
            {slides[currentSlide].title}
          </h2>
          <p className="text-stone-300 text-base leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-10 p-8 pt-0">
        
        {/* Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-amber-500' : 'w-1.5 bg-stone-700'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className={`p-3 rounded-full text-stone-400 hover:text-white hover:bg-white/5 transition-all ${
              currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={handleNext}
            className="group relative px-8 py-3 bg-white text-stone-950 font-bold rounded-full shadow-lg hover:bg-stone-200 transition-all flex items-center gap-2"
          >
            <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
            {currentSlide !== slides.length - 1 && <ChevronRight size={18} />}
            
            {/* Glow Effect on Get Started */}
            {currentSlide === slides.length - 1 && (
               <div className="absolute inset-0 rounded-full ring-2 ring-white/50 animate-ping opacity-50"></div>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
