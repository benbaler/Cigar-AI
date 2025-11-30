import React from 'react';
import { ArrowLeft, Edit2, Star, MapPin, Clock, DollarSign, Wine, Activity, Calendar, Tag, Ruler, Trash2, Heart } from 'lucide-react';
import { Cigar } from '../types';

interface CigarDetailsProps {
  cigar: Cigar;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CigarDetails: React.FC<CigarDetailsProps> = ({ cigar, onBack, onEdit, onDelete }) => {
  return (
    <div className="pb-32 animate-fadeIn bg-[#0c0a09] min-h-screen">
      {/* Navbar Overlay */}
      <div className="fixed top-0 left-0 right-0 z-40 p-5 flex justify-between items-center pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onBack} 
          className="pointer-events-auto bg-black/20 backdrop-blur-md border border-white/10 p-2.5 rounded-full text-white hover:bg-black/40 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3 pointer-events-auto">
            <button 
            onClick={onEdit} 
            className="bg-black/20 backdrop-blur-md border border-white/10 p-2.5 rounded-full text-white hover:bg-black/40 transition-colors"
            >
            <Edit2 size={18} />
            </button>
            <button 
            onClick={onDelete} 
            className="bg-black/20 backdrop-blur-md border border-white/10 p-2.5 rounded-full text-red-400 hover:bg-red-900/40 transition-colors"
            >
            <Trash2 size={18} />
            </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-[45vh] w-full">
        {cigar.imageUrl ? (
          <img src={cigar.imageUrl} alt={cigar.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#1c1917] flex items-center justify-center">
            <span className="serif text-[#292524] text-8xl opacity-20">?</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/60 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
           <div className="flex flex-col items-center text-center space-y-2">
                <h1 className="text-4xl font-serif font-bold text-white tracking-wide">{cigar.brand}</h1>
                <h2 className="text-lg text-[#d4af37] font-medium uppercase tracking-widest">{cigar.name}</h2>
                
                <div className="flex items-center gap-3 mt-2">
                    {cigar.isFavorite && <Heart size={16} fill="#ef4444" className="text-red-500" />}
                    <span className="text-xs text-stone-400 uppercase tracking-wider">{cigar.vitola}</span>
                    <span className="w-1 h-1 bg-stone-600 rounded-full"></span>
                    <span className="text-xs text-stone-400 uppercase tracking-wider">{cigar.origin}</span>
                </div>
           </div>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-20 space-y-8">
        
        {/* Rating Card */}
        {!cigar.inWishlist && (
            <div className="bg-[#1c1917] p-5 rounded-2xl border border-stone-800 shadow-xl flex justify-between items-center">
                 <div>
                     <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Total Score</p>
                     <div className="flex gap-1 text-[#d4af37]">
                         {[1,2,3,4,5].map(i => (
                             <Star key={i} size={16} fill={i <= Math.round(cigar.rating/2) ? "currentColor" : "none"} className={i <= Math.round(cigar.rating/2) ? "" : "text-stone-700"} />
                         ))}
                     </div>
                 </div>
                 <div className="text-5xl font-serif text-white leading-none">
                     {cigar.rating}<span className="text-lg text-stone-600 font-sans">/10</span>
                 </div>
            </div>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800">
               <div className="flex items-center gap-2 mb-2 text-stone-500">
                   <Tag size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Wrapper</span>
               </div>
               <p className="text-stone-200 font-medium">{cigar.wrapper || 'Unknown'}</p>
           </div>
           <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800">
               <div className="flex items-center gap-2 mb-2 text-stone-500">
                   <Activity size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Strength</span>
               </div>
               <p className="text-stone-200 font-medium">{cigar.strength}</p>
           </div>
           <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800">
               <div className="flex items-center gap-2 mb-2 text-stone-500">
                   <Ruler size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Size</span>
               </div>
               <p className="text-stone-200 font-medium">{cigar.length}" x {cigar.ringGauge}</p>
           </div>
           <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800">
               <div className="flex items-center gap-2 mb-2 text-stone-500">
                   <Calendar size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Date</span>
               </div>
               <p className="text-stone-200 font-medium">{new Date(cigar.dateStr).toLocaleDateString()}</p>
           </div>
        </div>

        {/* Flavor Profile */}
        {cigar.flavorProfile && cigar.flavorProfile.length > 0 && (
           <div>
               <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">Flavor Notes</h3>
               <div className="flex flex-wrap gap-2">
                  {cigar.flavorProfile.map((flavor, i) => (
                      <span key={i} className="bg-[#292524] border border-stone-700 text-[#d4af37] px-4 py-1.5 rounded text-xs font-medium uppercase tracking-wide">
                          {flavor}
                      </span>
                  ))}
               </div>
           </div>
        )}

        {/* Tasting Notes */}
        {cigar.notes && (
            <div className="relative pl-6 border-l-2 border-[#b45309]">
               <p className="text-stone-300 italic leading-relaxed text-sm">
                 "{cigar.notes}"
               </p>
            </div>
        )}

        {/* Detailed Ratings */}
        {!cigar.inWishlist && cigar.detailedRating && (
            <div className="bg-[#1c1917] p-5 rounded-xl border border-stone-800">
               <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-5 border-b border-stone-800 pb-2">Analysis</h3>
               <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  {Object.entries(cigar.detailedRating).map(([key, value]) => (
                      <div key={key}>
                          <div className="flex justify-between text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                              <span>{key === 'ash' ? 'Ash Hold' : key}</span>
                              <span className="text-[#d4af37]">{value as number}/10</span>
                          </div>
                          <div className="h-1 bg-stone-800 rounded-full">
                              <div 
                                className="h-full bg-gradient-to-r from-[#b45309] to-[#d4af37] rounded-full" 
                                style={{ width: `${((value as number) / 10) * 100}%` }}
                              ></div>
                          </div>
                      </div>
                  ))}
               </div>
            </div>
        )}

        {/* Progression */}
        {!cigar.inWishlist && cigar.reviewThirds && (cigar.reviewThirds.firstThird || cigar.reviewThirds.secondThird || cigar.reviewThirds.finalThird) && (
            <div>
                <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-6 text-center">Smoking Journey</h3>
                <div className="space-y-6 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-stone-800"></div>
                    {[
                        { title: 'Start', text: cigar.reviewThirds.firstThird },
                        { title: 'Middle', text: cigar.reviewThirds.secondThird },
                        { title: 'Finish', text: cigar.reviewThirds.finalThird }
                    ].map((phase, idx) => (
                        phase.text ? (
                            <div key={idx} className="relative pl-10">
                                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-[#1c1917] border-2 border-[#b45309] flex items-center justify-center text-[10px] font-bold text-[#d4af37] z-10">
                                    {idx + 1}
                                </div>
                                <h4 className="text-xs text-stone-300 font-bold uppercase tracking-wider mb-1">{phase.title}</h4>
                                <p className="text-stone-500 text-sm leading-relaxed">{phase.text}</p>
                            </div>
                        ) : null
                    ))}
                </div>
            </div>
        )}

        {/* Bottom Specs */}
        {!cigar.inWishlist && (cigar.pairing || cigar.physicalSensation) && (
           <div className="grid grid-cols-2 gap-4">
              {cigar.pairing && (
                 <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Wine size={12} className="text-[#d4af37]" /> Pairing
                    </div>
                    <div className="text-stone-200 text-sm font-serif">{cigar.pairing}</div>
                 </div>
              )}
              {cigar.physicalSensation && (
                 <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity size={12} className="text-[#d4af37]" /> Effect
                    </div>
                    <div className="text-stone-200 text-sm font-serif">{cigar.physicalSensation}</div>
                 </div>
              )}
           </div>
        )}

        {/* Purchase Info */}
        <div className="border-t border-stone-800 pt-6">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-stone-500">
                    <DollarSign size={14} />
                    <span>Price</span>
                </div>
                <span className="text-white font-medium">${cigar.price?.toFixed(2) || '0.00'}</span>
            </div>
             <div className="flex justify-between items-center text-sm mt-3">
                <div className="flex items-center gap-2 text-stone-500">
                    <Clock size={14} />
                    <span>Time</span>
                </div>
                <span className="text-white font-medium">{cigar.smokingDuration} min</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CigarDetails;