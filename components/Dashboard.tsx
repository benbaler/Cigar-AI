import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Cigar, ViewState, RecommendedCigar } from '../types';
import { PlusCircle, Flame, History, Bookmark, Star, Map, Sparkles, RefreshCw, Calendar, TrendingUp, Heart } from 'lucide-react';
import { getCigarRecommendations } from '../services/geminiService';

interface DashboardProps {
  cigars: Cigar[];
  onNavigate: (view: ViewState) => void;
  onSelectCigar: (cigar: Cigar) => void;
  onToggleStatus: (id: string, field: 'isFavorite' | 'inWishlist') => void;
}

const COLORS = ['#b45309', '#92400e', '#78350f', '#451a03', '#d4af37'];
const CHART_TEXT = "#a8a29e";
const CHART_GRID = "#44403c";

const Dashboard: React.FC<DashboardProps> = ({ cigars, onNavigate, onSelectCigar, onToggleStatus }) => {
  const [recommendations, setRecommendations] = useState<RecommendedCigar[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const smokedCigars = cigars.filter(c => !c.inWishlist);
  const favoriteCigars = cigars.filter(c => c.isFavorite && !c.inWishlist);
  const wishlistCount = cigars.filter(c => c.inWishlist).length;
  const favoritesCount = cigars.filter(c => c.isFavorite).length;

  const flavorCounts: Record<string, number> = {};
  favoriteCigars.forEach(c => {
    c.flavorProfile.forEach(f => {
      flavorCounts[f] = (flavorCounts[f] || 0) + 1;
    });
  });
  
  const flavorData = Object.keys(flavorCounts)
    .map(key => ({ subject: key, A: flavorCounts[key], fullMark: favoriteCigars.length }))
    .sort((a,b) => b.A - a.A)
    .slice(0, 6);

  const originCounts: Record<string, number> = {};
  smokedCigars.forEach(c => {
    const origin = c.origin || 'Unknown';
    originCounts[origin] = (originCounts[origin] || 0) + 1;
  });
  const originData = Object.keys(originCounts).map(key => ({ name: key, value: originCounts[key] }));

  const strengthCounts = { Mild: 0, Medium: 0, Full: 0 };
  smokedCigars.forEach(c => {
    if (strengthCounts[c.strength] !== undefined) {
      strengthCounts[c.strength]++;
    }
  });
  const strengthData = Object.keys(strengthCounts).map(key => ({ name: key, value: strengthCounts[key as keyof typeof strengthCounts] }));

  const monthlyCounts: Record<string, number> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  smokedCigars.forEach(c => {
    const d = new Date(c.dateStr);
    const month = months[d.getMonth()];
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });
  
  const monthlyData = months.map(m => ({ name: m, value: monthlyCounts[m] || 0 }));

  const recentCigars = [...smokedCigars].sort((a,b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()).slice(0, 3);

  const handleGetRecommendations = async () => {
    setLoadingRecs(true);
    const favorites = cigars.filter(c => c.isFavorite);
    const recs = await getCigarRecommendations(favorites.slice(0, 10)); 
    setRecommendations(recs);
    setLoadingRecs(false);
  };

  return (
    <div className="space-y-8 pb-32 animate-fadeIn">
      {/* Header */}
      <header className="flex justify-between items-end mb-2 pt-2">
        <div>
           <h2 className="serif text-3xl text-white tracking-wide">Overview</h2>
           <p className="text-stone-500 text-xs uppercase tracking-widest mt-1">Your Cigar Journey</p>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-lg">
           <div className="flex items-center space-x-2 text-stone-500 mb-2">
             <History size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Total Logs</span>
           </div>
           <p className="text-4xl font-medium text-white serif">{smokedCigars.length}</p>
        </div>
        
        <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-lg">
           <div className="flex items-center space-x-2 text-[#d4af37] mb-2">
             <Flame size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Avg Rating</span>
           </div>
           <p className="text-4xl font-medium text-white serif">
             {smokedCigars.length > 0 ? (smokedCigars.reduce((a,b) => a+b.rating, 0) / smokedCigars.length).toFixed(1) : '-'}
           </p>
        </div>

        <button onClick={() => onNavigate('wishlist')} className="bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-lg hover:bg-stone-900 transition-colors text-left group">
           <div className="flex items-center space-x-2 text-stone-500 group-hover:text-blue-400 transition-colors mb-2">
             <Bookmark size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Wishlist</span>
           </div>
           <p className="text-3xl font-medium text-white serif">{wishlistCount}</p>
        </button>

        <button onClick={() => onNavigate('favorites')} className="bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-lg hover:bg-stone-900 transition-colors text-left group">
           <div className="flex items-center space-x-2 text-stone-500 group-hover:text-red-500 transition-colors mb-2">
             <Star size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Favorites</span>
           </div>
           <p className="text-3xl font-medium text-white serif">{favoritesCount}</p>
        </button>
      </div>

      {/* AI Sommelier Card */}
      <div className="bg-gradient-to-br from-[#1c1917] to-[#0c0a09] p-5 rounded-xl border border-[#b45309]/30 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={64} className="text-[#d4af37]" />
        </div>
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="text-sm font-bold text-[#d4af37] uppercase tracking-widest flex items-center mb-1">
                AI Sommelier
            </h3>
            <p className="text-[10px] text-stone-500">Based on your favorite flavor profiles</p>
          </div>
          <button 
            onClick={handleGetRecommendations} 
            disabled={loadingRecs}
            className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 bg-stone-900 border border-stone-700 px-3 py-1.5 rounded-full transition-colors"
          >
            <RefreshCw size={10} className={loadingRecs ? 'animate-spin' : ''}/>
            {recommendations.length > 0 ? 'REFRESH' : 'GENERATE'}
          </button>
        </div>

        {loadingRecs && (
           <div className="py-6 text-center text-[#d4af37] text-xs animate-pulse font-medium tracking-wide">
             ANALYZING PALATE...
           </div>
        )}

        {!loadingRecs && recommendations.length === 0 && (
          <p className="text-stone-600 text-xs italic relative z-10">
            Tap generate to discover new cigars tailored to your taste.
          </p>
        )}

        {!loadingRecs && recommendations.length > 0 && (
          <div className="space-y-3 relative z-10">
             {recommendations.map((rec, idx) => (
               <div key={idx} className="bg-stone-900/50 p-3 rounded-lg border border-stone-800 backdrop-blur-sm">
                  <h4 className="text-stone-200 font-bold text-sm serif">{rec.brand} <span className="text-[#d4af37] font-sans text-xs uppercase ml-1">{rec.name}</span></h4>
                  <p className="text-stone-500 text-[10px] mt-1 leading-relaxed">{rec.reason}</p>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Activity Chart */}
      <div className="bg-[#1c1917] p-5 rounded-xl border border-stone-800 shadow-lg">
         <h3 className="text-xs font-bold text-stone-400 mb-6 uppercase tracking-widest flex items-center">
            Monthly Activity
         </h3>
         <div className="h-32 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={monthlyData}>
               <XAxis dataKey="name" stroke={CHART_TEXT} fontSize={9} tickLine={false} axisLine={false} interval={0} />
               <Tooltip cursor={{fill: '#292524'}} contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #44403c', color: '#e7e5e4', fontSize: '10px' }} />
               <Bar dataKey="value" fill="#92400e" radius={[2, 2, 0, 0]} barSize={12} />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Flavor Profile */}
        <div className="bg-[#1c1917] p-5 rounded-xl border border-stone-800 shadow-lg">
          <h3 className="text-xs font-bold text-stone-400 mb-4 uppercase tracking-widest">Flavor Profile</h3>
          <div className="h-48 w-full">
              {flavorData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={flavorData}>
                <PolarGrid stroke={CHART_GRID} strokeOpacity={0.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: CHART_TEXT, fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Flavors" dataKey="A" stroke="#d4af37" fill="#d4af37" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
              ) : (
                  <div className="flex items-center justify-center h-full text-stone-700 text-xs italic">Log favorites to see chart</div>
              )}
          </div>
        </div>

        {/* Strength */}
        <div className="bg-[#1c1917] p-5 rounded-xl border border-stone-800 shadow-lg">
           <h3 className="text-xs font-bold text-stone-400 mb-4 uppercase tracking-widest">Strength</h3>
           <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={strengthData}>
                 <XAxis dataKey="name" stroke={CHART_TEXT} fontSize={10} tickLine={false} axisLine={false}/>
                 <Tooltip cursor={{fill: '#292524'}} contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #44403c', color: '#e7e5e4', fontSize: '10px' }} />
                 <Bar dataKey="value" fill="#78350f" radius={[4, 4, 0, 0]} barSize={32} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Origin Distribution */}
      <div className="bg-[#1c1917] p-5 rounded-xl border border-stone-800 shadow-lg">
        <h3 className="text-xs font-bold text-stone-400 mb-4 uppercase tracking-widest">Origins</h3>
        <div className="h-40 w-full flex items-center">
          <ResponsiveContainer width="55%" height="100%">
            <PieChart>
              <Pie
                data={originData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                stroke="none"
                paddingAngle={4}
                dataKey="value"
              >
                {originData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #44403c', color: '#e7e5e4', fontSize: '10px' }} 
                itemStyle={{ color: '#e7e5e4' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center space-y-2 w-45%">
             {originData.map((d, i) => (
               <div key={d.name} className="flex items-center">
                 <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                 <span className="text-xs text-stone-400">{d.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

       {/* Recent Activity */}
       <div>
         <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Recent Smokes</h3>
            <button onClick={() => onNavigate('log')} className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest hover:text-white transition-colors">View All</button>
         </div>
         <div className="space-y-3">
           {recentCigars.length === 0 && <p className="text-stone-600 text-xs italic text-center py-4">No activity yet.</p>}
           {recentCigars.map(cigar => (
             <div 
               key={cigar.id} 
               onClick={() => onSelectCigar(cigar)}
               className="flex items-center bg-[#1c1917] p-3 rounded-xl border border-stone-800 cursor-pointer hover:border-[#b45309] transition-all group"
             >
               <div className="w-10 h-10 bg-stone-900 rounded-lg flex-shrink-0 overflow-hidden mr-3 border border-stone-800">
                 {cigar.imageUrl ? (
                     <img src={cigar.imageUrl} alt={cigar.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-stone-700 text-[10px]">IMG</div>
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="font-bold text-stone-200 text-sm serif truncate">{cigar.brand}</h4>
                 <p className="text-[10px] text-[#d4af37] truncate uppercase tracking-wider">{cigar.name}</p>
               </div>
               
               <div className="text-right flex items-center gap-3">
                  <span className="text-stone-500 text-[10px] font-medium">{new Date(cigar.dateStr).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                  <div className="bg-stone-900 text-stone-300 text-xs font-bold px-2 py-0.5 rounded border border-stone-800">
                    {cigar.rating}
                  </div>
               </div>
             </div>
           ))}
         </div>
       </div>
    </div>
  );
};

export default Dashboard;