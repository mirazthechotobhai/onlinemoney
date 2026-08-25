import React, { useState } from 'react';
import {
  X,
  LogIn,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Flame,
  Cloud
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { sound } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  soundEnabled: boolean;
  isBn: boolean;
  onAuthSuccess?: (email: string, displayName?: string, photoURL?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  soundEnabled,
  isBn,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      sound.playClick(soundEnabled);
      const res = await signInWithPopup(auth, googleProvider);
      sound.playSuccess(soundEnabled);
      setSuccessMsg(isBn ? 'গুগল দিয়ে সফলভাবে লগইন হয়েছে!' : 'Logged in with Google successfully!');
      if (onAuthSuccess && res.user.email) {
        onAuthSuccess(res.user.email, res.user.displayName || undefined, res.user.photoURL || undefined);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const host = typeof window !== 'undefined' ? window.location.hostname : 'domain';

      if (err.code === 'auth/unauthorized-domain') {
        setError(
          isBn
            ? `⚠️ আপনার ডোমেইন (${host}) Firebase Console-এ অনুমোদিত নয়। Firebase Console > Authentication > Settings > Authorized domains-এ "${host}" যুক্ত করুন।`
            : `⚠️ Domain (${host}) is not authorized in Firebase Console > Authentication > Settings > Authorized domains.`
        );
      } else if (err.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          setError(
            isBn
              ? '⚠️ ব্রাউজার পপ-আপ ব্লক করেছে। পপ-আপ অ্যালাও করুন।'
              : '⚠️ Browser blocked popup window. Please allow popups.'
          );
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError(
          isBn
            ? 'গুগল সাইন ইন উইন্ডোটি বন্ধ করা হয়েছে।'
            : 'Sign in popup was closed.'
        );
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      sound.playClick(soundEnabled);
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(res.user, { displayName: name.trim() });
        }
        sound.playSuccess(soundEnabled);
        setSuccessMsg(isBn ? 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!' : 'Account created & connected to Firebase!');
        if (onAuthSuccess && res.user.email) {
          onAuthSuccess(res.user.email, name.trim() || undefined);
        }
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        sound.playSuccess(soundEnabled);
        setSuccessMsg(isBn ? 'সফলভাবে লগইন হয়েছে!' : 'Signed in successfully!');
        if (onAuthSuccess && res.user.email) {
          onAuthSuccess(res.user.email, res.user.displayName || undefined, res.user.photoURL || undefined);
        }
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      sound.playClick(soundEnabled);
      await signOut(auth);
      setSuccessMsg(isBn ? 'লগআউট সম্পন্ন হয়েছে।' : 'Signed out successfully.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1a1c23] border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-white space-y-5 max-h-[92dvh] sm:max-h-[88vh] my-auto overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                {currentUser
                  ? isBn
                    ? 'ফায়ারবেস অ্যাকাউন্ট'
                    : 'Firebase Account'
                  : isBn
                  ? 'ফায়ারবেস লগইন / সাইন আপ'
                  : 'Firebase Sync & Login'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-1">
                {isBn
                  ? 'ক্লাউডে সকল ডাটা, কয়েন ও প্রোফাইল সেভ রাখুন'
                  : 'Sync all rewards, profile & Gmail to Firebase'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick(soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-zinc-400 hover:text-white transition-colors border border-zinc-800 shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          /* Logged In View */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#14161c] border border-zinc-800 space-y-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-400/40"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-white font-['Outfit']">
                      {currentUser.displayName || 'Firebase User'}
                    </h4>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">{currentUser.email}</p>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isBn ? 'লাইভ ফায়ারবেস ক্লাউড কানেক্টেড' : 'Live Firestore Synced'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span>UID: <span className="font-mono text-zinc-300">{currentUser.uid.slice(0, 10)}...</span></span>
                <span className="text-amber-400 font-bold">Project: go-to-freelance</span>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium">
                {successMsg}
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {isBn ? 'লগআউট করুন' : 'Sign Out of Firebase'}
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up View */
          <div className="space-y-4">
            {/* Google Sign-in button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-[#242731] hover:bg-[#2e323e] active:scale-98 border border-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>{isBn ? 'Google (Gmail) দিয়ে সাইন ইন করুন' : 'Continue with Google Account'}</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <div className="flex-1 h-px bg-zinc-800" />
              <span>{isBn ? 'অথবা ইমেইল ও পাসওয়ার্ড' : 'OR EMAIL & PASSWORD'}</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-[#14161c] p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isBn ? 'লগইন' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isBn ? 'নতুন অ্যাকাউন্ট (সাইন আপ)' : 'Sign Up'}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    {isBn ? 'আপনার নাম' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Miraz Hossain"
                      required={mode === 'register'}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-xs focus:outline-hidden focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {isBn ? 'ইমেইল (Gmail / Email)' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-xs focus:outline-hidden focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {isBn ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-xs focus:outline-hidden focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {loading
                    ? isBn
                      ? 'লোড হচ্ছে...'
                      : 'Connecting...'
                    : mode === 'register'
                    ? isBn
                      ? 'ফায়ারবেসে অ্যাকাউন্ট তৈরি করুন'
                      : 'Create Firebase Account'
                    : isBn
                    ? 'লগইন করুন'
                    : 'Sign In'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
