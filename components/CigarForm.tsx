import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, Loader2, X, Star, Clock, MapPin, DollarSign, Ruler, Wine, FileText, Activity, Wind, Flame, Tag, Plus, ChevronRight } from 'lucide-react';
import { Cigar } from '../types';
import { analyzeCigarImage } from '../services/geminiService';

interface CigarFormProps {
  onSave: (cigar: Cigar) => void;
  onCancel: () => void;
  initialIsWishlist?: boolean;
  initialData?: Cigar | null;
}

const COMMON_FLAVORS = [
  'Cedar', 'Earth', 'Leather', 'Pepper', 'Spice', 
  'Coffee', 'Cocoa', 'Cream', 'Nutty', 'Sweet', 
  'Hay', 'Grass', 'Vanilla', 'Fruit', 'Citrus', 
  'Floral', 'Oak', 'Toast', 'Caramel', 'Cinnamon'
];

const CigarForm: React.FC<CigarFormProps> = ({ onSave, onCancel, initialIsWishlist = false, initialData }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'rating' | 'experience' | 'purchase'>('details');
  const [analyzing, setAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customFlavorInput, setCustomFlavorInput] = useState('');
  
  const [formData, setFormData] = useState<Partial<Cigar>>({
    brand: '',
    name: '',
    vitola: '',
    wrapper: '',
    origin: '',
    strength: 'Medium',
    rating: 8.0,
    detailedRating: { draw: 8, burn: 8, aroma: 8, construction: 8, ash: 8, smoke: 8 },
    valueRating: 4,
    notes: '',
    reviewThirds: { firstThird: '', secondThird: '', finalThird: '' },
    pairing: '',
    physicalSensation: 'Relaxing',
    flavorProfile: [],
    ringGauge: 50,
    length: 5,
    smokingDuration: 60,
    price: 0,
    location: '',
    purchaseLocation: '',
    inWishlist: initialIsWishlist,
    isFavorite: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setAnalyzing(true);
      try {
        const aiData = await analyzeCigarImage(base64);
        setFormData(prev => ({
          ...prev,
          ...aiData,
          imageUrl: base64,
          flavorProfile: Array.from(new Set([...(prev.flavorProfile || []), ...(aiData.flavorProfile || [])]))
        }));
      } catch (err) {
        alert("Could not analyze image. Please enter details manually.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFlavor = (flavor: string) => {
    const current = formData.flavorProfile || [];
    if (current.includes(flavor)) {
      setFormData({ ...formData, flavorProfile: current.filter(f => f !== flavor) });
    } else {
      setFormData({ ...formData, flavorProfile: [...current, flavor] });
    }
  };

  const addCustomFlavor = () => {
    if (customFlavorInput.trim()) {
      const flavor = customFlavorInput.trim();
      const formatted = flavor.charAt(0).toUpperCase() + flavor.slice(1);
      toggleFlavor(formatted);
      setCustomFlavorInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.name) return;

    const newCigar: Cigar = {
      id: initialData?.id || Date.now().toString(),
      brand: formData.brand!,
      name: formData.name!,
      vitola: formData.vitola || 'Unknown',
      wrapper: formData.wrapper || 'Unknown',
      origin: formData.origin || 'Unknown',
      strength: (formData.strength as any) || 'Medium',
      rating: formData.rating || 5,
      detailedRating: formData.detailedRating!,
      valueRating: formData.valueRating,
      notes: formData.notes || '',
      reviewThirds: formData.reviewThirds,
      pairing: formData.pairing,
      physicalSensation: formData.physicalSensation,
      flavorProfile: formData.flavorProfile || [],
      dateStr: initialData?.dateStr || new Date().toISOString(),
      imageUrl: imagePreview || undefined,
      ringGauge: formData.ringGauge,
      length: formData.length,
      smokingDuration: formData.smokingDuration,
      price: formData.price,
      location: formData.location,
      purchaseLocation: formData.purchaseLocation,
      inWishlist: formData.inWishlist || false,
      isFavorite: formData.isFavorite || false,
    };

    onSave(newCigar);
  };

  const customFlavors = (formData.flavorProfile || []).filter(f => !COMMON_FLAVORS.includes(f));

  return (
    <div className="pb-32 animate-fadeIn bg-[#0c0a09] min-h-screen">
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#0c0a09]/90 backdrop-blur-md p-2 z-20 border-b border-stone-800">
        <h2 className="serif text-xl text-stone-200 tracking-wide">
          {initialData ? 'Edit Details' : (formData.inWishlist ? 'New Wishlist Item' : 'New Log Entry')}
        </h2>
        <button onClick={onCancel} className="bg-[#1c1917] p-2 rounded-full text-stone-400 hover:text-white transition-colors border border-stone-800"><X size={20}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Image Area */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-56 bg-[#1c1917] border border-stone-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#d4af37]/50 transition-all relative overflow-hidden group shadow-inner"
        >
            {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            ) : (
                <div className="flex flex-col items-center">
                    <div className="bg-stone-900 p-4 rounded-full mb-3 text-[#d4af37]">
                        <Camera size={28} />
                    </div>
                    <p className="text-stone-400 text-xs uppercase tracking-widest font-bold">Tap to Identify</p>
                </div>
            )}
            {analyzing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mb-3" />
                    <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest">Processing Image...</p>
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-[#1c1917] rounded-xl border border-stone-800">
          {(['details', 'rating', 'experience', 'purchase'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-[#292524] text-[#d4af37] shadow-md' : 'text-stone-500 hover:text-stone-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-2 gap-5">
              <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Brand</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full input-premium" placeholder="e.g. Padron" required />
              </div>
              <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full input-premium" placeholder="e.g. 1964 Anniversary" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Origin</label>
                  <input type="text" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} className="w-full input-premium" placeholder="e.g. Nicaragua" />
              </div>
              <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Strength</label>
                  <select value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value as any})} className="w-full input-premium appearance-none">
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Full">Full</option>
                  </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                 <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Vitola</label>
                 <input type="text" value={formData.vitola} onChange={e => setFormData({...formData, vitola: e.target.value})} className="w-full input-premium" placeholder="Robusto" />
              </div>
              <div className="col-span-1">
                 <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Gauge</label>
                 <input type="number" value={formData.ringGauge} onChange={e => setFormData({...formData, ringGauge: parseInt(e.target.value)})} className="w-full input-premium" />
              </div>
              <div className="col-span-1">
                 <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Length</label>
                 <input type="number" value={formData.length} onChange={e => setFormData({...formData, length: parseFloat(e.target.value)})} className="w-full input-premium" step="0.1" />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Wrapper</label>
              <input type="text" value={formData.wrapper} onChange={e => setFormData({...formData, wrapper: e.target.value})} className="w-full input-premium" placeholder="e.g. Maduro" />
            </div>

            <div className="flex items-center space-x-3 pt-2 p-4 bg-[#1c1917] rounded-xl border border-stone-800">
               <input 
                 type="checkbox" 
                 id="wishlist"
                 checked={formData.inWishlist} 
                 onChange={e => setFormData({...formData, inWishlist: e.target.checked})}
                 className="w-5 h-5 rounded border-stone-600 bg-stone-800 text-[#d4af37] focus:ring-0 focus:ring-offset-0"
               />
               <label htmlFor="wishlist" className="text-sm text-stone-300 font-medium">Save to Wishlist</label>
            </div>
          </div>
        )}

        {/* RATINGS TAB */}
        {activeTab === 'rating' && (
          <div className="space-y-6 animate-fadeIn">
            {!formData.inWishlist ? (
              <>
                <div className="bg-[#1c1917] p-6 rounded-2xl border border-stone-800 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-50"></div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 block">Overall Score</label>
                    <div className="text-6xl font-serif text-white mb-4 drop-shadow-lg">{formData.rating?.toFixed(1)}</div>
                    <input 
                        type="range" min="0" max="10" step="0.1"
                        value={formData.rating}
                        onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Draw', key: 'draw' },
                    { label: 'Burn', key: 'burn' },
                    { label: 'Aroma', key: 'aroma' },
                    { label: 'Construction', key: 'construction' },
                    { label: 'Ash Hold', key: 'ash' },
                    { label: 'Smoke Vol.', key: 'smoke' }
                  ].map((item) => (
                    <div key={item.key} className="bg-[#1c1917] p-3 rounded-lg border border-stone-800">
                      <div className="flex justify-between mb-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{item.label}</label>
                        <span className="text-xs text-[#d4af37] font-bold">{(formData.detailedRating as any)?.[item.key] || 0}</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" step="1"
                        value={(formData.detailedRating as any)?.[item.key] || 5}
                        onChange={e => setFormData({
                          ...formData, 
                          detailedRating: { ...formData.detailedRating!, [item.key]: parseInt(e.target.value) }
                        })}
                        className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-400"
                      />
                    </div>
                  ))}
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Tasting Notes</label>
                   <textarea 
                       value={formData.notes} 
                       onChange={e => setFormData({...formData, notes: e.target.value})}
                       className="w-full input-premium h-32 resize-none leading-relaxed"
                       placeholder="Describe the flavors and experience..."
                   />
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-stone-600 text-sm">
                Ratings disabled for wishlist items.
              </div>
            )}
          </div>
        )}

        {/* EXPERIENCE TAB */}
        {activeTab === 'experience' && (
          <div className="space-y-6 animate-fadeIn">
            {!formData.inWishlist ? (
              <>
                <div>
                   <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-3">Flavor Profile</label>
                   <div className="flex flex-wrap gap-2 mb-4">
                     {COMMON_FLAVORS.map(flavor => (
                       <button
                         key={flavor}
                         type="button"
                         onClick={() => toggleFlavor(flavor)}
                         className={`text-[10px] font-medium px-3 py-1.5 rounded border transition-all uppercase tracking-wide ${
                           formData.flavorProfile?.includes(flavor)
                             ? 'bg-[#292524] border-[#d4af37] text-[#d4af37]'
                             : 'bg-[#1c1917] border-stone-800 text-stone-500 hover:border-stone-600'
                         }`}
                       >
                         {flavor}
                       </button>
                     ))}
                   </div>

                   {customFlavors.length > 0 && (
                     <div className="mb-4">
                       <label className="block text-[10px] text-stone-600 mb-2 uppercase tracking-wide">Custom Tags:</label>
                       <div className="flex flex-wrap gap-2">
                         {customFlavors.map(flavor => (
                           <button
                             key={flavor}
                             type="button"
                             onClick={() => toggleFlavor(flavor)}
                             className="text-[10px] px-3 py-1.5 rounded border bg-[#292524] border-[#d4af37]/50 text-[#d4af37] flex items-center gap-1"
                           >
                             {flavor} <X size={10} />
                           </button>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="flex gap-2 relative">
                     <input 
                       type="text" 
                       value={customFlavorInput}
                       onChange={(e) => setCustomFlavorInput(e.target.value)}
                       placeholder="Add custom note..."
                       className="flex-1 input-premium text-xs"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           e.preventDefault();
                           addCustomFlavor();
                         }
                       }}
                     />
                     <button 
                       type="button"
                       onClick={addCustomFlavor}
                       className="bg-[#292524] hover:bg-stone-800 border border-stone-700 text-stone-300 p-2 rounded-lg transition-colors"
                     >
                       <Plus size={18} />
                     </button>
                   </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Progression</label>
                  {['First Third', 'Second Third', 'Final Third'].map((third, idx) => {
                    const key = idx === 0 ? 'firstThird' : idx === 1 ? 'secondThird' : 'finalThird';
                    return (
                      <div key={key} className="relative">
                        <input 
                           type="text" 
                           value={(formData.reviewThirds as any)?.[key] || ''} 
                           onChange={e => setFormData({
                             ...formData, 
                             reviewThirds: { ...formData.reviewThirds!, [key]: e.target.value }
                           })}
                           className="w-full input-premium pl-8" 
                           placeholder={third}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-600 uppercase">
                            {idx + 1}/3
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Effect</label>
                       <select 
                          value={formData.physicalSensation} 
                          onChange={e => setFormData({...formData, physicalSensation: e.target.value})}
                          className="w-full input-premium appearance-none"
                       >
                          <option value="Relaxing">Relaxing</option>
                          <option value="No Effect">No Effect</option>
                          <option value="Light Buzz">Light Buzz</option>
                          <option value="Strong Buzz">Strong Buzz</option>
                          <option value="Head Rush">Head Rush</option>
                          <option value="Nauseous">Nauseous</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Pairing</label>
                       <input 
                          type="text"
                          value={formData.pairing} 
                          onChange={e => setFormData({...formData, pairing: e.target.value})}
                          className="w-full input-premium"
                          placeholder="Beverage..."
                       />
                    </div>
                </div>
              </>
            ) : (
               <div className="text-center py-10 text-stone-600 text-sm">
                Details disabled for wishlist items.
              </div>
            )}
          </div>
        )}

        {/* PURCHASE TAB */}
        {activeTab === 'purchase' && (
          <div className="space-y-6 animate-fadeIn">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Price</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full input-premium" step="0.01" />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Duration (min)</label>
                  <input type="number" value={formData.smokingDuration} onChange={e => setFormData({...formData, smokingDuration: parseInt(e.target.value)})} className="w-full input-premium" disabled={formData.inWishlist} />
               </div>
             </div>
             
             {!formData.inWishlist && (
                <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800">
                    <div className="flex justify-between mb-3">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Value Rating</label>
                        <span className="text-xs text-[#d4af37] font-bold">{formData.valueRating}/5</span>
                    </div>
                    <div className="flex gap-2">
                        {[1,2,3,4,5].map(v => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setFormData({...formData, valueRating: v})}
                                className={`flex-1 py-3 rounded transition-colors ${formData.valueRating! >= v ? 'bg-[#1e3a8a] text-blue-200' : 'bg-stone-800 text-stone-600'}`}
                            >
                                <DollarSign size={16} className="mx-auto" />
                            </button>
                        ))}
                    </div>
                </div>
             )}

             <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Location Smoked</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full input-premium" placeholder="e.g. Lounge" disabled={formData.inWishlist}/>
             </div>

             <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Purchased From</label>
                <input type="text" value={formData.purchaseLocation} onChange={e => setFormData({...formData, purchaseLocation: e.target.value})} className="w-full input-premium" placeholder="e.g. Store Name" />
             </div>
             
             <div className="flex items-center space-x-3 pt-4 p-4 bg-[#1c1917] rounded-xl border border-stone-800">
               <input 
                 type="checkbox" 
                 id="favorite"
                 checked={formData.isFavorite} 
                 onChange={e => setFormData({...formData, isFavorite: e.target.checked})}
                 className="w-5 h-5 rounded border-stone-600 bg-stone-800 text-red-600 focus:ring-0"
               />
               <label htmlFor="favorite" className="text-sm text-stone-300 font-medium">Add to Favorites</label>
            </div>
          </div>
        )}

        <button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#b45309] to-[#d97706] hover:from-[#d97706] hover:to-[#f59e0b] text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-all active:scale-95"
        >
            <Save size={18} />
            <span className="uppercase tracking-widest text-xs">{initialData ? 'Update Entry' : 'Save Entry'}</span>
        </button>
      </form>
      
      <style>{`
        .input-premium {
          background-color: #1c1917;
          border: 1px solid #292524;
          border-radius: 0.75rem;
          padding: 0.8rem 1rem;
          color: #e7e5e4;
          outline: none;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }
        .input-premium:focus {
          border-color: #d4af37;
        }
        .input-premium::placeholder {
            color: #57534e;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CigarForm;