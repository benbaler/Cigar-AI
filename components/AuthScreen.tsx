import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../services/firebase';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const getErrorMessage = (error: any) => {
    if (error.code === 'auth/invalid-credential') return 'Invalid credentials.';
    if (error.code === 'auth/email-already-in-use') return 'Email already registered.';
    if (error.code === 'auth/weak-password') return 'Password too weak.';
    return error.message || 'Authentication failed.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: formData.name });
        
        try {
          await setDoc(doc(db, "users", user.uid), {
            name: formData.name,
            email: user.email,
            joinedDate: new Date().toISOString(),
            uid: user.uid
          });
        } catch (fsError) {
          console.error("Error saving user data:", fsError);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center p-6 animate-fadeIn">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#b45309]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm space-y-10 flex flex-col items-center">
        <div className="text-center space-y-3 flex flex-col items-center">
          <img 
            src="logo.png" 
            alt="CIGAR AI" 
            className="w-48 h-auto object-contain drop-shadow-2xl"
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML += '<h1 class="serif text-5xl font-bold text-[#d4af37] tracking-widest drop-shadow-md">CIGAR AI</h1>';
            }}
          />
          <p className="text-stone-500 text-xs uppercase tracking-widest">Digital Sommelier & Logbook</p>
        </div>

        <div className="w-full">
          <div className="flex mb-8 bg-[#1c1917] rounded-xl p-1 border border-stone-800">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${isLogin ? 'bg-[#292524] text-[#d4af37] shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${!isLogin ? 'bg-[#292524] text-[#d4af37] shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#1c1917] border border-stone-800 rounded-xl py-4 pl-12 pr-4 text-sm text-stone-200 focus:outline-none focus:border-[#d4af37] transition-colors placeholder-stone-700"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 group-focus-within:text-[#d4af37] transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#1c1917] border border-stone-800 rounded-xl py-4 pl-12 pr-4 text-sm text-stone-200 focus:outline-none focus:border-[#d4af37] transition-colors placeholder-stone-700"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 group-focus-within:text-[#d4af37] transition-colors" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#1c1917] border border-stone-800 rounded-xl py-4 pl-12 pr-4 text-sm text-stone-200 focus:outline-none focus:border-[#d4af37] transition-colors placeholder-stone-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/10 p-3 rounded-lg border border-red-900/30">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b45309] to-[#d97706] hover:from-[#d97706] hover:to-[#f59e0b] text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-xs">{isLogin ? 'Enter Lounge' : 'Join Club'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-stone-600 uppercase tracking-wide">
           Premium Member Access
        </p>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;