import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0a09] animate-fadeIn">
      <div className="flex flex-col items-center justify-center w-full h-full">
        {/* Glow effect behind logo */}
        <div className="absolute w-72 h-72 bg-[#b45309]/10 rounded-full blur-[100px] animate-pulse"></div>
        
        <img 
            src="logo.png" 
            alt="Cigar AI" 
            className="relative z-10 w-64 h-auto object-contain drop-shadow-2xl animate-pulse"
            onError={(e) => {
                // Fallback if image is missing
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                    const fallback = document.createElement('h1');
                    fallback.className = "serif text-5xl text-[#d4af37] font-bold tracking-widest border-4 border-[#b45309] p-8 rounded-xl relative z-10";
                    fallback.innerText = "CIGAR AI";
                    parent.appendChild(fallback);
                }
            }}
        />
        
        <div className="mt-10 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;