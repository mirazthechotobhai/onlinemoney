import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Flame,
  Globe,
  Coins,
  Gem,
  Eye,
  EyeOff,
  ArrowRight,
  HelpCircle,
  Layers
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  doc,
  setDoc
} from '../services/firebase';
import { sound } from '../utils/sound';
import { INITIAL_USER_PROFILE } from '../data/initialData';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onSuccess?: () => void;
  soundEnabled?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  soundEnabled = true,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  const isBn = lang === 'bn';

  // Email format validator
  const validateEmail = (val: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(val.trim());
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      sound.playClick(soundEnabled);
      const res = await signInWithPopup(auth, googleProvider);
      sound.playSuccess(soundEnabled);
      setSuccessMsg(isBn ? '🎉 গুগল দিয়ে সফলভাবে লগইন হয়েছে!' : '🎉 Logged in with Google successfully!');

      // Ensure Firestore user document exists
      if (res.user) {
        const userDocRef = doc(db, 'users', res.user.uid);
        const newDoc: UserProfile = {
          ...INITIAL_USER_PROFILE,
          id: res.user.uid,
          name: res.user.displayName || res.user.email?.split('@')[0] || INITIAL_USER_PROFILE.name,
          email: res.user.email || INITIAL_USER_PROFILE.email,
          avatarUrl: res.user.photoURL || INITIAL_USER_PROFILE.avatarUrl,
          username: res.user.email ? `@${res.user.email.split('@')[0]}` : INITIAL_USER_PROFILE.username,
        };
        await setDoc(userDocRef, newDoc, { merge: true });
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const host = typeof window !== 'undefined' ? window.location.hostname : 'domain';

      if (err.code === 'auth/unauthorized-domain') {
        setError(
          isBn
            ? `⚠️ আপনার ডোমেইন (${host}) Firebase Console-এ অথরাইজ করা নেই! সমাধান: Firebase Console > Authentication > Settings > Authorized domains-এ গিয়ে "${host}" ডোমেইনটি যোগ (Add Domain) করুন।`
            : `⚠️ Domain (${host}) is not authorized in Firebase Console! Fix: Go to Firebase Console > Authentication > Settings > Authorized domains and add "${host}".`
        );
      } else if (err.code === 'auth/popup-blocked') {
        try {
          // If popup is blocked by browser, attempt redirect method
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          setError(
            isBn
              ? '⚠️ ব্রাউজার পপ-আপ ব্লক করেছে। অনুগ্রহ করে ব্রাউজার সেটিংসে পপ-আপ অ্যালাও করুন।'
              : '⚠️ Browser blocked popup window. Please allow popups or enable third-party cookies.'
          );
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError(
          isBn
            ? 'ℹ️ গুগল সাইন ইন উইন্ডোটি সম্পন্ন হওয়ার আগেই বন্ধ করা হয়েছে।'
            : 'ℹ️ Sign-in popup was closed before completion.'
        );
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError(
          isBn
            ? 'আরেকটি সাইন-ইন রিকোয়েস্ট চলমান রয়েছে।'
            : 'Another sign-in request is already in progress.'
        );
      } else {
        setError(
          isBn
            ? (err.message || 'গুগল সাইন ইন সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।')
            : (err.message || 'Failed to sign in with Google')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Email format validation
    if (!validateEmail(cleanEmail)) {
      setError(
        isBn
          ? '⚠️ অনুগ্রহ করে একটি সঠিক ও কার্যকর Gmail বা ইমেইল ঠিকানা প্রদান করুন (যেমন: example@gmail.com)'
          : '⚠️ Please provide a valid email address (e.g. example@gmail.com)'
      );
      sound.playClick(soundEnabled);
      return;
    }

    // 2. Password length validation
    if (password.length < 6) {
      setError(
        isBn
          ? '⚠️ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : '⚠️ Password must be at least 6 characters long.'
      );
      sound.playClick(soundEnabled);
      return;
    }

    // 3. Confirm password in registration mode
    if (tab === 'register' && password !== confirmPassword) {
      setError(
        isBn
          ? '⚠️ পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না! পুনরায় চেক করুন।'
          : '⚠️ Passwords do not match! Please re-verify.'
      );
      sound.playClick(soundEnabled);
      return;
    }

    setLoading(true);

    try {
      sound.playClick(soundEnabled);

      if (tab === 'register') {
        // Firebase Auth Create User
        const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);

        const displayName = name.trim() || cleanEmail.split('@')[0];
        if (displayName) {
          try {
            await updateProfile(res.user, { displayName });
          } catch {
            // ignore
          }
        }

        // Store initial user profile in Firestore
        const userDocRef = doc(db, 'users', res.user.uid);
        const initialDoc: UserProfile = {
          ...INITIAL_USER_PROFILE,
          id: res.user.uid,
          name: displayName,
          email: cleanEmail,
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          username: `@${cleanEmail.split('@')[0]}`,
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          balance: 15, // Starter bonus
          gems: 5,
        };
        await setDoc(userDocRef, initialDoc, { merge: true });

        sound.playSuccess(soundEnabled);
        setSuccessMsg(
          isBn
            ? '✨ অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ফায়ারবেসে ডাটা সংরক্ষিত হয়েছে।'
            : '✨ Account created & credentials securely saved in Firebase!'
        );
      } else {
        // Firebase Auth Sign In User
        await signInWithEmailAndPassword(auth, cleanEmail, password);

        sound.playSuccess(soundEnabled);
        setSuccessMsg(isBn ? '🎉 সফলভাবে লগইন হয়েছে! স্বাগতম।' : '🎉 Signed in successfully! Welcome back.');
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Firebase Auth Error:', err.code, err.message);

      let translatedError = isBn
        ? 'অথেনটিকেশন ব্যর্থ হয়েছে। আপনার ইমেইল ও পাসওয়ার্ড চেক করুন।'
        : 'Authentication failed. Please verify credentials.';

      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          translatedError = isBn
            ? '❌ ভুল ইমেইল বা পাসওয়ার্ড! অনুগ্রহ করে সঠিক Gmail/ইমেইল ও পাসওয়ার্ড দিন।'
            : '❌ Invalid email or password. Please verify your credentials.';
          break;
        case 'auth/user-not-found':
          translatedError = isBn
            ? '❌ এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে আগে "সাইন আপ" করুন।'
            : '❌ No account found with this email. Please sign up first.';
          break;
        case 'auth/email-already-in-use':
          translatedError = isBn
            ? '❌ এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে "লগইন" ট্যাবে যান।'
            : '❌ This email is already registered. Please switch to Sign In.';
          break;
        case 'auth/invalid-email':
          translatedError = isBn
            ? '❌ ইমেইল ঠিকানাটি সঠিক নয়। সঠিক ফরম্যাটে লিখুন।'
            : '❌ The email address format is invalid.';
          break;
        case 'auth/weak-password':
          translatedError = isBn
            ? '❌ পাসওয়ার্ডটি খুব দুর্বল। কমপক্ষে ৬ বা তার বেশি অক্ষরের পাসওয়ার্ড দিন।'
            : '❌ Weak password. Use at least 6 characters.';
          break;
        case 'auth/too-many-requests':
          translatedError = isBn
            ? '⚠️ অনেকবার ভুল চেষ্টা করা হয়েছে। অ্যাকাউন্ট সাময়িকভাবে বন্ধ, কিছুক্ষণ পর চেষ্টা করুন।'
            : '⚠️ Access to this account has been temporarily disabled due to many failed login attempts.';
          break;
        default:
          translatedError = err.message || translatedError;
      }

      setError(translatedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0f14] text-white flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language switcher top bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
            PROFILE & REWARDS
          </span>
        </div>
        <button
          onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          className="px-3 py-1 rounded-xl bg-[#1a1c23] border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          {lang === 'bn' ? '🇧🇩 বাংলা' : '🇺🇸 English'}
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="relative w-full max-w-md bg-[#161820] border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black shadow-lg shadow-amber-500/20 mb-1">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['Outfit']">
            {tab === 'login'
              ? isBn
                ? 'লগইন করুন'
                : 'Welcome Back'
              : isBn
              ? 'নতুন অ্যাকাউন্ট খুলুন'
              : 'Create Account'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            {isBn
              ? 'আপনার ফায়ারবেস ক্লাউড ওয়ালেট ও রিওয়ার্ডস অ্যাক্সেস করুন'
              : 'Secure Firebase authentication & persistent cloud profile'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 rounded-2xl bg-[#101218] p-1.5 border border-zinc-800/80 mb-6">
          <button
            id="tab-btn-login"
            type="button"
            onClick={() => {
              sound.playClick(soundEnabled);
              setTab('login');
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'login'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isBn ? 'লগইন (Sign In)' : 'Sign In'}</span>
          </button>

          <button
            id="tab-btn-register"
            type="button"
            onClick={() => {
              sound.playClick(soundEnabled);
              setTab('register');
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'register'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isBn ? 'সাইন আপ (Sign Up)' : 'Sign Up'}</span>
          </button>
        </div>

        {/* Google 1-Tap Sign In */}
        <div className="mb-5">
          <button
            id="btn-google-auth"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-[#1f222c] hover:bg-[#282c39] active:scale-98 border border-zinc-700/80 text-white font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
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
            <span>{isBn ? 'গুগল (Gmail) অ্যাকাউন্ট দিয়ে প্রবেশ করুন' : 'Continue with Google Account'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-5">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] font-mono tracking-wider">
            {isBn ? 'অথবা ইমেইল ও পাসওয়ার্ড' : 'OR WITH EMAIL & PASSWORD'}
          </span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 mb-4 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {isBn ? 'আপনার পূর্ণ নাম' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  id="input-auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isBn ? 'যেমন: মিরাজ হোসেন' : 'e.g. Miraz Hossain'}
                  required={tab === 'register'}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#101218] border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                {isBn ? 'বৈধ Gmail বা ইমেইল' : 'Valid Gmail / Email'}
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {isBn ? 'ফায়ারবেসে সংরক্ষণ হবে' : 'Saved to Firebase'}
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                id="input-auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="miraz@gmail.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#101218] border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <span className="text-[10px] text-zinc-500">
                {isBn ? 'কমপক্ষে ৬ অক্ষর' : 'Min. 6 chars'}
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                id="input-auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#101218] border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  id="input-auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required={tab === 'register'}
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#101218] border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>{isBn ? 'ফায়ারবেসে যোগাযোগ হচ্ছে...' : 'Processing with Firebase...'}</span>
              </div>
            ) : (
              <>
                {tab === 'register' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>
                  {tab === 'register'
                    ? isBn
                      ? 'ফায়ারবেসে সাইন আপ করুন'
                      : 'Create Firebase Account'
                    : isBn
                    ? 'লগইন করুন'
                    : 'Sign In to Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Features Footer */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'ফায়ারবেস সুরক্ষিত' : 'Firebase Encrypted'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{isBn ? 'ক্লাউড ব্যালেন্স সিঙ্ক' : 'Cloud Balance Sync'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
