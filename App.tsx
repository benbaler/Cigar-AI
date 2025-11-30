import React, { useState, useEffect } from 'react';
import { Home, NotebookPen, Mic, LayoutDashboard, Search, Bookmark, Star, Share2, Trash2, Edit2, ChevronDown, Filter, Heart, LogOut, Calendar, Plus } from 'lucide-react';
import { ViewState, Cigar, User } from './types';
import Dashboard from './components/Dashboard';
import CigarForm from './components/CigarForm';
import CigarDetails from './components/CigarDetails';
import LiveAssistant from './components/LiveAssistant';
import ConfirmDialog from './components/ConfirmDialog';
import Onboarding from './components/Onboarding';
import AuthScreen from './components/AuthScreen';
import SplashScreen from './components/SplashScreen';
import { auth, db, storage } from './services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot, deleteDoc, updateDoc, query } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [savingCigar, setSavingCigar] = useState(false);
  
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [cigars, setCigars] = useState<Cigar[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCigar, setEditingCigar] = useState<Cigar | null>(null);
  const [selectedCigar, setSelectedCigar] = useState<Cigar | null>(null);
  const [sortOrder, setSortOrder] = useState<'date' | 'rating'>('date');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Confirmation Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null, name: string}>({
      isOpen: false, id: null, name: ''
  });

  // Handle Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
        setShowSplash(false);
    }, 2500); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('cigar_ai_onboarding_seen');
    if (!hasSeenOnboarding) {
        setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          joinedDate: user.metadata.creationTime || new Date().toISOString()
        });

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    name: user.displayName || user.email?.split('@')[0] || 'User',
                    email: user.email,
                    joinedDate: user.metadata.creationTime || new Date().toISOString(),
                    uid: user.uid
                });
            }
        } catch (err) {
            console.error("Failed to sync user to Firestore", err);
        }

      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
        setCigars([]);
        return;
    }

    setDataLoading(true);
    const cigarsCollectionRef = collection(db, "users", currentUser.id, "cigars");
    
    const unsubscribe = onSnapshot(cigarsCollectionRef, (snapshot) => {
        const loadedCigars = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        })) as Cigar[];
        setCigars(loadedCigars);
        setDataLoading(false);
    }, (error) => {
        console.error("Error fetching cigars from Firestore:", error);
        setDataLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleFinishOnboarding = () => {
    localStorage.setItem('cigar_ai_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const handleLogin = (user: User) => {
    // No-op
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setShowProfileMenu(false);
        setActiveView('dashboard');
        setSelectedCigar(null);
    } catch (error) {
        console.error("Error signing out", error);
    }
  };

  const handleSaveCigar = async (cigar: Cigar) => {
    if (!currentUser) return;

    setSavingCigar(true);
    try {
        let finalImageUrl = cigar.imageUrl;

        if (cigar.imageUrl && cigar.imageUrl.startsWith('data:image')) {
            const storagePath = `cigarPhotos/${currentUser.id}/${cigar.id}`;
            const storageRef = ref(storage, storagePath);
            await uploadString(storageRef, cigar.imageUrl, 'data_url');
            finalImageUrl = await getDownloadURL(storageRef);
        }

        const cigarToSave = {
            ...cigar,
            imageUrl: finalImageUrl || null 
        };

        await setDoc(doc(db, "users", currentUser.id, "cigars", cigar.id), cigarToSave);
        
        setActiveView('dashboard');
        setEditingCigar(null);
    } catch (error) {
        console.error("Error saving cigar:", error);
        alert("Failed to save cigar. Please try again.");
    } finally {
        setSavingCigar(false);
    }
  };

  const handleDeleteCigar = (id: string) => {
    const cigarToDelete = cigars.find(c => c.id === id);
    const label = cigarToDelete ? `${cigarToDelete.brand} ${cigarToDelete.name}` : 'this item';
    setDeleteConfirm({ isOpen: true, id, name: label });
  };

  const proceedWithDelete = async () => {
      if (deleteConfirm.id && currentUser) {
          try {
              await deleteDoc(doc(db, "users", currentUser.id, "cigars", deleteConfirm.id));
              
              if (selectedCigar && selectedCigar.id === deleteConfirm.id) {
                  setSelectedCigar(null);
              }
          } catch (error) {
              console.error("Error deleting cigar:", error);
              alert("Failed to delete item.");
          }
      }
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
  };

  const handleEditCigar = (cigar: Cigar) => {
    setEditingCigar(cigar);
    setSelectedCigar(null);
    setActiveView('add');
  };

  const handleToggleStatus = async (id: string, field: 'isFavorite' | 'inWishlist') => {
    if (!currentUser) return;
    const cigar = cigars.find(c => c.id === id);
    if (!cigar) return;

    try {
        await updateDoc(doc(db, "users", currentUser.id, "cigars", id), {
            [field]: !cigar[field]
        });
    } catch (error) {
        console.error("Error updating status:", error);
    }
  };

  const handleShare = async (c: Cigar) => {
     const shareData: { title: string; text: string; url?: string } = {
         title: `${c.brand} ${c.name} Review`,
         text: `I just smoked a ${c.brand} ${c.name}! Rating: ${c.rating}/10. Notes: ${c.notes}`,
     };

     if (window.location.protocol.startsWith('http')) {
        shareData.url = window.location.href;
     }

     if (navigator.share) {
         try {
             await navigator.share(shareData);
         } catch (err) {
             console.log('Error sharing', err);
         }
     } else {
         console.log("Sharing not supported or blocked", shareData);
     }
  };

  const getFilteredCigars = () => {
    let list = [];
    switch (activeView) {
      case 'wishlist': list = cigars.filter(c => c.inWishlist); break;
      case 'favorites': list = cigars.filter(c => c.isFavorite && !c.inWishlist); break;
      default: list = cigars.filter(c => !c.inWishlist); 
    }

    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        list = list.filter(c => 
            c.brand.toLowerCase().includes(lower) || 
            c.name.toLowerCase().includes(lower) ||
            c.notes.toLowerCase().includes(lower) ||
            (c.pairing && c.pairing.toLowerCase().includes(lower))
        );
    }
    
    list.sort((a, b) => {
      if (sortOrder === 'rating') {
        return b.rating - a.rating;
      }
      return new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime();
    });

    return list;
  };

  const groupCigarsByDate = (list: Cigar[]) => {
    const groups: { title: string; items: Cigar[] }[] = [];
    list.forEach(c => {
        const d = new Date(c.dateStr);
        const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        let g = groups.find(i => i.title === key);
        if (!g) {
            g = { title: key, items: [] };
            groups.push(g);
        }
        g.items.push(c);
    });
    return groups;
  };

  const renderCigarCard = (c: Cigar) => (
    <div 
        key={c.id} 
        onClick={() => setSelectedCigar(c)}
        className="group relative bg-[#1c1917] rounded-xl overflow-hidden cursor-pointer border border-stone-800 hover:border-[#b45309] transition-all duration-300 shadow-lg"
    >
        <div className="flex h-32">
            {/* Image Section */}
            <div className="w-28 relative flex-shrink-0 bg-stone-900">
                {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-800">
                         <span className="serif text-stone-600 text-2xl font-bold opacity-20">?</span>
                    </div>
                )}
                {/* Rating Badge Overlay */}
                {!c.inWishlist && (
                    <div className="absolute top-0 left-0 bg-[#b45309] text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-md z-10">
                        {c.rating.toFixed(1)}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-3 flex flex-col justify-between relative">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="serif text-lg text-stone-100 font-medium leading-tight tracking-wide truncate pr-2">{c.brand}</h3>
                        
                        {/* Favorite Icon */}
                         <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleStatus(c.id, 'isFavorite'); }}
                            className={`transition-colors ${c.isFavorite ? 'text-red-500' : 'text-stone-700 hover:text-stone-500'}`}
                        >
                            <Heart size={16} fill={c.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    <p className="text-[#d4af37] text-xs font-medium mt-0.5 mb-2 truncate">{c.name}</p>
                    
                    <div className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-stone-500 border border-stone-800 px-1.5 py-0.5 rounded">{c.vitola}</span>
                        {c.origin && <span className="text-[9px] uppercase tracking-wider text-stone-500 border border-stone-800 px-1.5 py-0.5 rounded">{c.origin}</span>}
                    </div>
                </div>

                <div className="flex justify-between items-end border-t border-stone-800/50 pt-2 mt-1">
                   <span className="text-[10px] text-stone-600 font-medium">{new Date(c.dateStr).toLocaleDateString()}</span>
                   
                   <div className="flex gap-3">
                       {/* Quick Actions */}
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditCigar(c); }} className="text-stone-600 hover:text-white transition-colors">
                            <Edit2 size={12} />
                        </button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCigar(c.id); }} className="text-stone-600 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                        </button>
                   </div>
                </div>
            </div>
        </div>
    </div>
  );

  const renderContent = () => {
    if (selectedCigar) {
      return (
        <CigarDetails 
          cigar={selectedCigar} 
          onBack={() => setSelectedCigar(null)} 
          onEdit={() => handleEditCigar(selectedCigar)}
          onDelete={() => handleDeleteCigar(selectedCigar.id)}
        />
      );
    }

    switch(activeView) {
      case 'dashboard':
        return (
            <Dashboard 
                cigars={cigars} 
                onNavigate={setActiveView} 
                onSelectCigar={setSelectedCigar}
                onToggleStatus={handleToggleStatus} 
            />
        );
      case 'add':
        return (
          <div className="relative">
              {savingCigar && (
                  <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                      <div className="w-10 h-10 border-4 border-[#b45309] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-stone-300 font-serif tracking-wider">Preserving...</p>
                  </div>
              )}
              <CigarForm 
                onSave={handleSaveCigar} 
                onCancel={() => { setActiveView('dashboard'); setEditingCigar(null); }} 
                initialData={editingCigar}
              />
          </div>
        );
      case 'live':
        return <LiveAssistant />;
      case 'log':
      case 'wishlist':
      case 'favorites':
        const displayCigars = getFilteredCigars();
        const pageTitle = activeView === 'wishlist' ? 'Wishlist' : activeView === 'favorites' ? 'My Favorites' : 'Cigar Log';
        const isTimelineView = sortOrder === 'date';
        
        return (
          <div className="space-y-4 pb-28 animate-fadeIn">
             <div className="flex justify-between items-end mb-4 pt-2">
                <h2 className="serif text-3xl text-white tracking-wide">{pageTitle}</h2>
                {activeView === 'wishlist' && (
                  <button onClick={() => { setEditingCigar(null); setActiveView('add'); }} className="text-[#d4af37] text-xs uppercase tracking-widest font-bold hover:text-amber-400 mb-1">+ Add</button>
                )}
             </div>

             {/* Filter Tabs */}
             <div className="flex bg-[#1c1917] p-1 rounded-lg border border-stone-800 mb-6">
                <button onClick={() => setActiveView('log')} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-all ${activeView === 'log' ? 'bg-[#292524] text-[#d4af37] shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}>All</button>
                <button onClick={() => setActiveView('favorites')} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-all ${activeView === 'favorites' ? 'bg-[#292524] text-[#d4af37] shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}>Favorites</button>
                <button onClick={() => setActiveView('wishlist')} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-all ${activeView === 'wishlist' ? 'bg-[#292524] text-[#d4af37] shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}>Wishlist</button>
             </div>

             {/* Search Bar */}
             <div className="flex gap-3 mb-6">
                 <div className="relative flex-1 group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 group-focus-within:text-[#d4af37] transition-colors" />
                     <input 
                        type="text" 
                        placeholder="Search collection..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1c1917] border border-stone-800 rounded-lg py-2.5 pl-9 pr-4 text-sm text-stone-300 placeholder-stone-600 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
                     />
                 </div>
                 <div className="relative">
                    <select 
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'date' | 'rating')}
                      className="appearance-none bg-[#1c1917] border border-stone-800 rounded-lg py-2.5 pl-4 pr-8 text-sm text-stone-400 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
                    >
                      <option value="date">Latest</option>
                      <option value="rating">Rated</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-600 pointer-events-none" />
                 </div>
             </div>

             {/* Content */}
             {dataLoading && displayCigars.length === 0 && (
                 <div className="py-20 text-center">
                     <div className="inline-block w-8 h-8 border-2 border-[#b45309] border-t-transparent rounded-full animate-spin"></div>
                 </div>
             )}

             {!dataLoading && displayCigars.length === 0 && (
               <div className="text-center py-20">
                 <p className="text-stone-600 text-sm">{searchQuery ? 'No cigars match your search.' : 'Your humidor is empty.'}</p>
                 {activeView === 'log' && !searchQuery && (
                    <button onClick={() => setActiveView('add')} className="mt-4 text-[#d4af37] text-xs uppercase tracking-widest font-bold border-b border-[#d4af37] pb-0.5 hover:text-white hover:border-white transition-colors">
                        Add First Smoke
                    </button>
                 )}
               </div>
             )}

             {!dataLoading && displayCigars.length > 0 && isTimelineView ? (
                <div className="relative border-l border-stone-800/50 ml-3 space-y-8 my-2 pb-8">
                    {groupCigarsByDate(displayCigars).map((group, idx) => (
                        <div key={idx} className="relative">
                            <div className="flex items-center -ml-[21px] mb-5 pt-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#b45309] ring-4 ring-[#0c0a09]"></div>
                                <span className="ml-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                                    {group.title}
                                </span>
                            </div>
                            <div className="space-y-4 pl-6">
                                {group.items.map(c => renderCigarCard(c))}
                            </div>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="space-y-4">
                    {displayCigars.map(c => renderCigarCard(c))}
                </div>
             )}
          </div>
        );
      default:
        return (
            <Dashboard 
                cigars={cigars} 
                onNavigate={setActiveView} 
                onSelectCigar={setSelectedCigar}
                onToggleStatus={handleToggleStatus}
            />
        );
    }
  };

  if (showSplash || (authLoading && !currentUser)) {
      return <SplashScreen />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleFinishOnboarding} />;
  }
  
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const initials = currentUser.name 
    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() 
    : 'U';

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-200 font-sans selection:bg-[#d4af37]/30" onClick={() => setShowProfileMenu(false)}>
      
      {/* Premium Header */}
      <div className="sticky top-0 z-30 bg-[#0c0a09]/90 backdrop-blur-md border-b border-stone-900/50 px-5 py-4 flex justify-between items-center transition-all duration-300">
        <div 
            onClick={() => { setActiveView('dashboard'); setSelectedCigar(null); }}
            className="cursor-pointer"
        >
             <img 
                src="logo.png" 
                alt="CIGAR AI" 
                className="h-6 w-auto object-contain" 
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML += '<span class="serif text-xl text-[#d4af37] font-semibold tracking-wide">CIGAR AI</span>';
                }}
            />
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
            className="w-8 h-8 rounded-full bg-[#1c1917] border border-stone-800 flex items-center justify-center text-[10px] font-bold text-[#d4af37] hover:border-[#d4af37] transition-colors"
          >
             {initials}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-10 w-48 bg-[#1c1917] border border-stone-800 rounded-lg shadow-2xl overflow-hidden animate-fadeIn z-50">
              <div className="p-3 border-b border-stone-800">
                <p className="text-stone-200 font-medium text-sm truncate serif">{currentUser.name}</p>
                <p className="text-stone-600 text-xs truncate font-sans">{currentUser.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-3 text-xs uppercase tracking-wider text-red-900 hover:text-red-400 hover:bg-stone-900 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-md mx-auto p-5 min-h-[calc(100vh-100px)]">
        {renderContent()}
      </main>

      <ConfirmDialog 
        isOpen={deleteConfirm.isOpen}
        title="Delete Item"
        message={`Remove ${deleteConfirm.name} from your humidor?`}
        onConfirm={proceedWithDelete}
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
      />

      {/* Floating Glass Navigation */}
      <nav className="fixed bottom-6 left-5 right-5 z-40 max-w-md mx-auto">
        <div className="glass-panel rounded-2xl h-16 px-6 flex justify-between items-center shadow-2xl shadow-black/50 border border-white/5">
          <button 
            onClick={() => { setActiveView('dashboard'); setEditingCigar(null); setSelectedCigar(null); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'dashboard' && !selectedCigar ? 'text-[#d4af37]' : 'text-stone-500'}`}
          >
            <LayoutDashboard size={20} strokeWidth={1.5} />
          </button>

          <button 
            onClick={() => { setActiveView('live'); setSelectedCigar(null); }}
             className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'live' ? 'text-[#d4af37]' : 'text-stone-500'}`}
          >
             <Mic size={20} strokeWidth={1.5} />
          </button>
          
          {/* Floating Action Button for ADD */}
          <div className="relative -top-6">
             <button 
                onClick={() => { setActiveView('add'); setEditingCigar(null); setSelectedCigar(null); }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b45309] shadow-xl shadow-amber-900/20 flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95 border-4 border-[#0c0a09]"
             >
                <Plus size={24} />
             </button>
          </div>

           <button 
            onClick={() => { setActiveView('log'); setEditingCigar(null); setSelectedCigar(null); }}
             className={`flex flex-col items-center gap-1 transition-colors ${(['log', 'favorites', 'wishlist'].includes(activeView) || selectedCigar) && activeView !== 'live' ? 'text-[#d4af37]' : 'text-stone-500'}`}
          >
            <NotebookPen size={20} strokeWidth={1.5} />
          </button>

           <button 
            onClick={() => { setActiveView('favorites'); setEditingCigar(null); setSelectedCigar(null); }}
             className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'favorites' ? 'text-[#d4af37]' : 'text-stone-500'}`}
          >
            <Bookmark size={20} strokeWidth={1.5} />
          </button>
        </div>
      </nav>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;