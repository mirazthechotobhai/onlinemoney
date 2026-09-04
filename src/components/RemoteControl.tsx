import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Home,
  RotateCcw,
  Power,
  Volume2,
  VolumeX,
  Volume1,
  Keyboard as KeyboardIcon,
  MousePointer2,
  Tv,
  CheckCircle2,
  Wifi,
  Sparkles,
  Delete,
  CornerDownLeft,
  Space,
  Maximize2,
  Sliders,
  Send,
  X,
  LogIn,
  LogOut,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  Lock,
  Globe,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { remoteSync } from '../services/remoteSync';
import { DirectionKey, RemoteSession } from '../types';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export interface SimpleAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}
import {
  createRemoteSession,
  getPermanentCodeForUser,
  deactivateSession,
  listenToSession
} from '../services/sessionService';

interface RemoteControlProps {
  isEmbedded?: boolean;
}

const ALPHABET_KEYS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '?', '!'],
];

const QWERTY_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const NUM_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const QUICK_WORDS = ['HELLO', 'WELCOME', 'OK', 'YES', 'NO', 'THANKS'];

export const RemoteControl: React.FC<RemoteControlProps> = ({ isEmbedded = false }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  // Firebase Google Auth & Pairing Code State
  const [currentUser, setCurrentUser] = useState<User | SimpleAuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('remote_custom_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [pairingCode, setPairingCode] = useState<string>(() => {
    return localStorage.getItem('remote_pairing_code') || '';
  });
  const [sessionStatus, setSessionStatus] = useState<'none' | 'waiting' | 'active'>('none');
  const [firebaseSyncState, setFirebaseSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [domainCopied, setDomainCopied] = useState<boolean>(false);
  const [showDirectEmailInput, setShowDirectEmailInput] = useState<boolean>(false);
  const [directEmail, setDirectEmail] = useState<string>('');

  // Keyboard drawer open state
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(true);
  const [keyboardLayout, setKeyboardLayout] = useState<'alphabet' | 'qwerty'>('alphabet');
  const [typedText, setTypedText] = useState<string>('');
  const [isCapsLock, setIsCapsLock] = useState<boolean>(true);

  // Touchpad state
  const touchpadRef = useRef<HTMLDivElement>(null);
  const [isTouching, setIsTouching] = useState<boolean>(false);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const [touchpadSensitivity, setTouchpadSensitivity] = useState<number>(1.5);
  const [lastActionFeedback, setLastActionFeedback] = useState<string>('Ready');

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.removeItem('remote_custom_user');
        setUnauthorizedDomain(null);
        // Deterministic permanent code for this Gmail account
        const permCode = getPermanentCodeForUser(user.email, user.uid);
        setPairingCode(permCode);
        localStorage.setItem('remote_pairing_code', permCode);
        
        setFirebaseSyncState('saving');
        const res = await createRemoteSession(permCode, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });

        if (res.success) {
          setFirebaseSyncState('saved');
          setAuthError(null);
          if (res.isAlreadyActive) {
            setSessionStatus('active');
            setIsConnected(true);
          } else {
            setSessionStatus('waiting');
          }
        } else {
          setFirebaseSyncState('error');
          setAuthError(res.error || 'Failed to save permanent code in Firebase');
        }

        remoteSync.setActiveFirebaseCode(permCode);
      } else {
        // If not a google auth user, check if we have a direct custom user stored in localStorage
        const savedCustom = localStorage.getItem('remote_custom_user');
        if (savedCustom) {
          try {
            const parsed: SimpleAuthUser = JSON.parse(savedCustom);
            setCurrentUser(parsed);
            const permCode = getPermanentCodeForUser(parsed.email, parsed.uid);
            setPairingCode(permCode);
            remoteSync.setActiveFirebaseCode(permCode);
            createRemoteSession(permCode, {
              uid: parsed.uid,
              email: parsed.email,
              displayName: parsed.displayName,
              photoURL: parsed.photoURL,
            }).then((res) => {
              if (res.success) {
                setFirebaseSyncState('saved');
                if (res.isAlreadyActive) {
                  setSessionStatus('active');
                  setIsConnected(true);
                } else {
                  setSessionStatus('waiting');
                }
              }
            });
            return;
          } catch {}
        }

        setCurrentUser(null);
        setSessionStatus('none');
        setFirebaseSyncState('idle');
        remoteSync.setActiveFirebaseCode(null);
      }
    });

    return () => unsub();
  }, []);

  // Listen to Firestore session status changes for this pairing code
  useEffect(() => {
    if (!pairingCode || !currentUser) return;

    const unsubSession = listenToSession(pairingCode, (session) => {
      if (session) {
        if (session.status === 'active') {
          setSessionStatus('active');
          setIsConnected(true);
        } else {
          setSessionStatus('waiting');
        }
      }
    });

    return () => unsubSession();
  }, [pairingCode, currentUser]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    setUnauthorizedDomain(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const permCode = getPermanentCodeForUser(user.email, user.uid);
      setPairingCode(permCode);
      localStorage.setItem('remote_pairing_code', permCode);
      localStorage.removeItem('remote_custom_user');

      setFirebaseSyncState('saving');
      const res = await createRemoteSession(permCode, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      if (res.success) {
        setFirebaseSyncState('saved');
        setAuthError(null);
        if (res.isAlreadyActive) {
          setSessionStatus('active');
          setIsConnected(true);
        } else {
          setSessionStatus('waiting');
        }
      } else {
        setFirebaseSyncState('error');
        setAuthError(res.error || 'Failed to save permanent code to Firebase');
      }

      remoteSync.setActiveFirebaseCode(permCode);
      triggerFeedback('Google Signed In');
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      const isUnauthorized =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain') ||
        err?.message?.includes('authorized domain');

      if (isUnauthorized) {
        const currentHost = window.location.hostname || 'your-domain.vercel.app';
        setUnauthorizedDomain(currentHost);
        setShowDirectEmailInput(true);
        setAuthError(`Firebase Unauthorized Domain: "${currentHost}" ডোমেনটি Firebase Console এ অনুমোদিত নয়। নিচের নির্দেশিকা দেখুন অথবা সরাসরি জিমেইল লিখে কানেক্ট করুন।`);
      } else {
        setAuthError(err?.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDirectEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = directEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('দয়া করে একটি সঠিক জিমেইল বা ইমেইল অ্যাড্রেস লিখুন (যেমন: name@gmail.com)');
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);
    try {
      const customUid = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const permCode = getPermanentCodeForUser(cleanEmail, customUid);
      const customUser: SimpleAuthUser = {
        uid: customUid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        photoURL: null,
      };

      localStorage.setItem('remote_custom_user', JSON.stringify(customUser));
      localStorage.setItem('remote_pairing_code', permCode);
      setCurrentUser(customUser);
      setPairingCode(permCode);

      setFirebaseSyncState('saving');
      const res = await createRemoteSession(permCode, {
        uid: customUser.uid,
        email: customUser.email,
        displayName: customUser.displayName,
        photoURL: customUser.photoURL,
      });

      if (res.success) {
        setFirebaseSyncState('saved');
        setAuthError(null);
        if (res.isAlreadyActive) {
          setSessionStatus('active');
          setIsConnected(true);
        } else {
          setSessionStatus('waiting');
        }
      } else {
        setFirebaseSyncState('error');
        setAuthError(res.error || 'Failed to save permanent code in Firebase');
      }

      remoteSync.setActiveFirebaseCode(permCode);
      triggerFeedback('Connected via Gmail');
    } catch (err: any) {
      console.error('Direct email login error:', err);
      setAuthError(err?.message || 'Failed to connect. Check internet connection.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCopyDomain = () => {
    if (!unauthorizedDomain) return;
    navigator.clipboard.writeText(unauthorizedDomain).then(() => {
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2000);
    });
  };

  const handleSignOut = async () => {
    try {
      if (pairingCode) {
        // Send local broadcast to immediately inform main website in the same browser
        remoteSync.send({
          type: 'logout',
          sender: 'remote',
          payload: { timestamp: Date.now() },
        });

        // Set status: 'logged_out' in Firestore so any remote and cross-device screens log out immediately
        await deactivateSession(pairingCode);
      }
      await signOut(auth).catch(() => {});
      setCurrentUser(null);
      setPairingCode('');
      localStorage.removeItem('remote_pairing_code');
      localStorage.removeItem('remote_custom_user');
      remoteSync.setActiveFirebaseCode(null);
      setSessionStatus('none');
      setFirebaseSyncState('idle');
      setIsConnected(false);
      triggerFeedback('Signed Out');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleRetrySync = async () => {
    if (!currentUser || !pairingCode) return;
    setFirebaseSyncState('saving');

    const res = await createRemoteSession(pairingCode, {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
    });

    if (res.success) {
      setFirebaseSyncState('saved');
      setAuthError(null);
      if (res.isAlreadyActive) {
        setSessionStatus('active');
        setIsConnected(true);
      }
    } else {
      setFirebaseSyncState('error');
      setAuthError(res.error || 'Failed to save permanent code in Firebase');
    }

    remoteSync.setActiveFirebaseCode(pairingCode);
    triggerFeedback('Sync Retried');
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCodeCopied(true);
    triggerFeedback('Code Copied');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Haptic & Audio click feedback
  const triggerFeedback = (actionName: string) => {
    setLastActionFeedback(actionName);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }
  };

  // Channel sync listener
  useEffect(() => {
    // Initial handshake ping
    remoteSync.send({
      type: 'ping',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });

    const unsubscribe = remoteSync.subscribe((msg) => {
      if (msg.sender === 'remote') return;
      setIsConnected(true);
      setLastPingTime(Date.now());
      if (msg.type === 'ping') {
        remoteSync.send({
          type: 'pong',
          sender: 'remote',
          payload: { timestamp: Date.now() },
        });
      }
    });

    const pingTimer = setInterval(() => {
      remoteSync.send({
        type: 'ping',
        sender: 'remote',
        payload: { timestamp: Date.now() },
      });
    }, 2500);

    const checkInterval = setInterval(() => {
      if (Date.now() - lastPingTime > 6500 && lastPingTime > 0) {
        setIsConnected(false);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(pingTimer);
      clearInterval(checkInterval);
    };
  }, [lastPingTime]);

  // Physical keyboard listener on remote tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modifier keys like Ctrl/Meta are held (e.g. shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleDirection('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDirection('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDirection('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleDirection('right');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleOk();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key.length === 1) {
        // Type single character
        handleKeyPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typedText]);

  // Command handlers
  const handleDirection = (dir: DirectionKey) => {
    triggerFeedback(`D-Pad: ${dir.toUpperCase()}`);
    remoteSync.send({
      type: 'direction_press',
      sender: 'remote',
      payload: { direction: dir, timestamp: Date.now() },
    });
  };

  const handleOk = () => {
    triggerFeedback('OK Pressed');
    remoteSync.send({
      type: 'ok_press',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });
  };

  const handleBack = () => {
    triggerFeedback('Back Pressed');
    remoteSync.send({
      type: 'back_press',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });
    // Also remove from local typed preview if any
    setTypedText((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const handleHome = () => {
    triggerFeedback('Home Pressed');
    remoteSync.send({
      type: 'home_press',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });
  };

  const handlePower = () => {
    triggerFeedback('Power Toggle');
    remoteSync.send({
      type: 'power_toggle',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });
  };

  const handleVolume = (delta: number) => {
    triggerFeedback(delta > 0 ? 'Vol Up' : delta < 0 ? 'Vol Down' : 'Mute');
    remoteSync.send({
      type: 'volume_change',
      sender: 'remote',
      payload: { volumeDelta: delta, timestamp: Date.now() },
    });
  };

  // Keyboard typing handlers
  const handleKeyPress = (char: string) => {
    const finalChar = isCapsLock ? char.toUpperCase() : char.toLowerCase();
    triggerFeedback(`Key: ${finalChar}`);
    setTypedText((prev) => prev + finalChar);

    remoteSync.send({
      type: 'text_input',
      sender: 'remote',
      payload: { char: finalChar, timestamp: Date.now() },
    });
  };

  const handleBackspace = () => {
    triggerFeedback('Backspace');
    setTypedText((prev) => prev.slice(0, -1));
    remoteSync.send({
      type: 'text_backspace',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });
  };

  const handleClearText = () => {
    triggerFeedback('Clear Text');
    setTypedText('');
    remoteSync.send({
      type: 'text_clear',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });
  };

  const handleDirectTextChange = (text: string) => {
    setTypedText(text);
    remoteSync.send({
      type: 'text_set',
      sender: 'remote',
      payload: { text, timestamp: Date.now() },
    });
  };

  const handleQuickWord = (word: string) => {
    const textToSend = (typedText.length > 0 && !typedText.endsWith(' ') ? ' ' : '') + word + ' ';
    triggerFeedback(`Word: ${word}`);
    setTypedText((prev) => prev + textToSend);

    for (const char of textToSend) {
      remoteSync.send({
        type: 'text_input',
        sender: 'remote',
        payload: { char, timestamp: Date.now() },
      });
    }
  };

  // Touchpad touch & mouse drag events
  const startDrag = (clientX: number, clientY: number) => {
    setIsTouching(true);
    lastTouchPos.current = { x: clientX, y: clientY };
  };

  const processDrag = (clientX: number, clientY: number) => {
    if (!lastTouchPos.current) return;
    const dx = (clientX - lastTouchPos.current.x) * (touchpadSensitivity * 0.4);
    const dy = (clientY - lastTouchPos.current.y) * (touchpadSensitivity * 0.4);

    lastTouchPos.current = { x: clientX, y: clientY };

    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      remoteSync.send({
        type: 'pointer_move',
        sender: 'remote',
        payload: {
          pointer: { x: 0, y: 0, dx, dy },
          timestamp: Date.now(),
        },
      });
    }
  };

  const endDrag = () => {
    setIsTouching(false);
    lastTouchPos.current = null;
  };

  const handleTouchpadClick = () => {
    triggerFeedback('Touchpad Tap / Click');
    remoteSync.send({
      type: 'pointer_click',
      sender: 'remote',
      payload: { timestamp: Date.now() },
    });
  };

  return (
    <div
      className={`min-h-screen w-full bg-slate-200 text-zinc-100 flex flex-col items-center justify-center p-3 sm:p-6 select-none font-sans ${
        isEmbedded ? 'min-h-full bg-transparent p-2' : ''
      }`}
    >
      {/* Remote Shell / Body - Professional Polish Aesthetic */}
      <div className="w-full max-w-[340px] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col relative overflow-hidden text-white">
        {/* Top Header Tracking Tag */}
        <div className="text-zinc-500 text-[10px] uppercase tracking-widest text-center font-mono font-medium mb-4">
          Remote Interface v2.0
        </div>

        {/* Top Status & Brand Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[11px] font-mono text-zinc-400">
              {isConnected ? 'Sync Active' : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="remote-power-button"
              onClick={handlePower}
              title="Power Toggle (Standby)"
              className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-red-950/80 border border-zinc-700 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* GOOGLE SIGN IN & PAIRING CODE CARD (Requested: gmail diye login korbe remote theke ekta code dibe and seta firebase a save hobe) */}
        <div className="mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2.5">
          {!currentUser ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Google / Gmail Sign-in</span>
                <span className="text-[10px] font-mono text-zinc-500">Firebase Cloud</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Log in with your Gmail to generate your permanent 6-digit sync code and pair with the TV.
              </p>

              {/* Unauthorized Domain Diagnostic Box */}
              {unauthorizedDomain && (
                <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-800/80 text-[11px] text-amber-200 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Firebase: Unauthorized Domain</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    আপনার এই ডোমেনটি Firebase Console-এ অনুমোদিত নয়:
                  </p>
                  <div className="flex items-center justify-between bg-black/70 border border-amber-800/80 rounded px-2.5 py-1.5 font-mono text-[11px] text-amber-300">
                    <span className="truncate font-bold">{unauthorizedDomain}</span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="ml-2 text-[10px] px-2 py-0.5 bg-amber-700 hover:bg-amber-600 rounded text-white font-sans flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      {domainCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{domainCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-300 leading-normal flex flex-col gap-1.5 pt-1 border-t border-amber-900/40">
                    <p>
                      <strong>১-ক্লিকে সমাধান:</strong> Firebase Console-এ গিয়ে <strong>Authorized domains</strong>-এ এই ডোমেনটি <strong>Add domain</strong> করুন।
                    </p>
                    <a
                      href="https://console.firebase.google.com/project/oh-no-tv/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-xs transition-colors shadow-sm"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Firebase Settings খুলুন (Authorized Domains) ↗</span>
                    </a>
                  </div>
                </div>
              )}

              {authError && !unauthorizedDomain && (
                <div className="text-[10px] text-red-400 bg-red-950/40 p-1.5 rounded border border-red-900/50">
                  {authError}
                </div>
              )}

              {/* Primary Google One-Click Sign-In Button with Official Google G Logo */}
              <button
                id="remote-google-signin-button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full py-2.5 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>

              {/* Seamless Public Connect by entering Gmail directly */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 font-medium text-zinc-300">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>অথবা সরাসরি জিমেইল দিয়ে কানেক্ট করুন</span>
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                    100% কাজ করবে
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  যেকোনো ডিভাইস বা মোবাইলে পপ-আপ ছাড়াই আপনার স্থায়ী কোড দিয়ে কানেক্ট হবে:
                </p>

                <form onSubmit={handleDirectEmailLogin} className="flex flex-col gap-1.5 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="email"
                      value={directEmail}
                      onChange={(e) => setDirectEmail(e.target.value)}
                      placeholder="আপনার জিমেইল লিখুন (যেমন: name@gmail.com)"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSigningIn || !directEmail.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-all active:scale-95 shadow-sm"
                    >
                      Connect
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Signed-in User Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full border border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-[11px] font-medium text-zinc-200 truncate">
                      {currentUser.displayName || 'Google Account'}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-900 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="font-mono text-[9px]">Exit</span>
                </button>
              </div>

              {/* Pairing Code Display */}
              <div className="bg-zinc-900 border border-blue-500/40 rounded-lg p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-blue-400" />
                    <span className="text-zinc-300 font-mono uppercase tracking-wider font-semibold">Permanent Code</span>
                    {firebaseSyncState === 'saved' && (
                      <span className="text-emerald-400 flex items-center gap-0.5 text-[9px] font-mono">
                        <Check className="w-2.5 h-2.5" /> Synced
                      </span>
                    )}
                    {firebaseSyncState === 'saving' && (
                      <span className="text-blue-400 flex items-center gap-0.5 text-[9px] font-mono animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing...
                      </span>
                    )}
                  </div>

                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${
                    sessionStatus === 'active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold'
                      : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                  }`}>
                    {sessionStatus === 'active' ? '● TV Paired & Active' : '○ Waiting for Screen'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="font-mono text-xl font-bold tracking-widest text-blue-400 select-all">
                    {pairingCode || '------'}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyCode}
                      title="Copy Permanent Code"
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer text-xs flex items-center gap-1"
                    >
                      {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px] font-mono">{codeCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {authError ? (
                  <div className="text-[10px] text-red-400 bg-red-950/40 p-1.5 rounded border border-red-900/50 flex items-center justify-between">
                    <span>{authError}</span>
                    <button
                      onClick={handleRetrySync}
                      className="text-[9px] text-blue-400 underline cursor-pointer hover:text-blue-300 ml-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400">
                    {sessionStatus === 'active'
                      ? '✓ Permanent link active. It remains connected until you click Exit.'
                      : 'Fixed for this Gmail. Activate once on the main screen to keep it connected permanently.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action feedback HUD */}
        <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-400 mb-5">
          <span className="text-zinc-500">Status:</span>
          <span className="font-semibold text-zinc-200 truncate max-w-[190px]">{lastActionFeedback}</span>
        </div>

        {/* SECTION 1: TOUCHPAD AREA */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Touchpad Area
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <span className="text-zinc-500">Speed:</span>
              <button
                onClick={() => setTouchpadSensitivity((s) => (s === 1 ? 1.5 : s === 1.5 ? 2.2 : 1))}
                className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
              >
                {touchpadSensitivity === 1 ? '1x' : touchpadSensitivity === 1.5 ? '1.5x' : '2x'}
              </button>
            </div>
          </div>

          <div
            ref={touchpadRef}
            id="remote-touchpad-area"
            onClick={handleTouchpadClick}
            onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
            onMouseMove={(e) => {
              if (isTouching) processDrag(e.clientX, e.clientY);
            }}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={(e) => {
              if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) processDrag(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={endDrag}
            className={`w-full aspect-video bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-center group cursor-crosshair relative overflow-hidden select-none transition-colors ${
              isTouching
                ? 'bg-zinc-700/80 border-blue-500 shadow-inner'
                : 'hover:border-zinc-600'
            }`}
          >
            {/* Subtle Touchpad Grid */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="text-center pointer-events-none z-10 flex flex-col items-center gap-1 text-zinc-500">
              <div
                className={`w-7 h-7 rounded-full border border-zinc-600 flex items-center justify-center transition-transform ${
                  isTouching ? 'scale-110 border-blue-400 text-blue-400' : 'group-hover:text-zinc-300'
                }`}
              >
                <MousePointer2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {isTouching ? 'Moving Pointer...' : 'Touchpad Area'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: D-PAD CONTROLLER (3x3 Grid Matching Design) */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="grid grid-cols-3 grid-rows-3 gap-2">
            <div />
            {/* Direction UP (Upore) */}
            <button
              id="dpad-up"
              onClick={() => handleDirection('up')}
              title="Up (Upore)"
              className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 active:bg-zinc-600 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />

            {/* Direction LEFT (Bame) */}
            <button
              id="dpad-left"
              onClick={() => handleDirection('left')}
              title="Left (Bame)"
              className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 active:bg-zinc-600 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Center OK BUTTON (Blue accented) */}
            <button
              id="dpad-ok"
              onClick={handleOk}
              title="OK (Select)"
              className="w-12 h-12 bg-blue-600 border border-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md hover:bg-blue-500 active:scale-90 transition-all cursor-pointer"
            >
              OK
            </button>

            {/* Direction RIGHT (Dane) */}
            <button
              id="dpad-right"
              onClick={() => handleDirection('right')}
              title="Right (Dane)"
              className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 active:bg-zinc-600 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div />
            {/* Direction DOWN (Niche) */}
            <button
              id="dpad-down"
              onClick={() => handleDirection('down')}
              title="Down (Niche)"
              className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 active:bg-zinc-600 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <div />
          </div>
        </div>

        {/* SECTION 3: NAVIGATION BUTTONS (Back, Home, and Keyboard Toggle) */}
        <div className="flex justify-between px-3 mb-6">
          {/* Back button */}
          <button
            id="remote-back-button"
            onClick={handleBack}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors active:scale-95">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 uppercase font-mono">
              Back
            </span>
          </button>

          {/* Home button */}
          <button
            id="remote-home-button"
            onClick={handleHome}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors active:scale-95">
              <Home className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 uppercase font-mono">
              Home
            </span>
          </button>

          {/* KEYBOARD ICON BUTTON (Requested: "remote a ekta option thakbe keyword icon seta click korle all abcd mane alpabed cole asbe") */}
          <button
            id="remote-keyboard-toggle-button"
            onClick={() => {
              setIsKeyboardOpen((open) => !open);
              triggerFeedback(isKeyboardOpen ? 'Keyboard Closed' : 'Keyboard Opened');
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                isKeyboardOpen
                  ? 'bg-blue-900 border border-blue-600 text-blue-300 shadow-md shadow-blue-500/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 group-hover:text-white'
              }`}
            >
              <KeyboardIcon className="w-4 h-4" />
            </div>
            <span
              className={`text-[10px] uppercase font-mono font-semibold ${
                isKeyboardOpen ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-400'
              }`}
            >
              Keybd
            </span>
          </button>
        </div>

        {/* Audio Volume Bar */}
        <div className="flex items-center justify-between px-2 pt-3 border-t border-zinc-800/80 mb-3 text-zinc-400">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleVolume(-10)}
              title="Volume Down"
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
            >
              <Volume1 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleVolume(0)}
              title="Mute Toggle"
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleVolume(10)}
              title="Volume Up"
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Volume</span>
        </div>

        {/* SECTION 4: VIRTUAL ALPHABET KEYBOARD (Matching Professional Polish Theme) */}
        {isKeyboardOpen && (
          <div
            id="remote-virtual-keyboard-panel"
            className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2.5 mt-2 animate-fade-in"
          >
            {/* Keyboard Header & Layout Switcher */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <KeyboardIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-semibold text-zinc-300 font-mono">
                  {keyboardLayout === 'alphabet' ? 'Alphabet (A-Z)' : 'QWERTY'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setKeyboardLayout((l) => (l === 'alphabet' ? 'qwerty' : 'alphabet'))}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                >
                  {keyboardLayout === 'alphabet' ? 'QWERTY' : 'A-Z'}
                </button>
                <button
                  onClick={() => setIsKeyboardOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white cursor-pointer"
                  title="Close Keyboard"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Typing & Direct Input on Remote */}
            <div className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg p-1.5 flex items-center justify-between gap-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
              <input
                id="remote-direct-text-input"
                type="text"
                value={typedText}
                onChange={(e) => handleDirectTextChange(e.target.value)}
                placeholder="Type here or tap buttons below..."
                className="font-mono text-xs text-white bg-transparent outline-none flex-1 min-h-[22px] px-1 placeholder:text-zinc-500"
              />
              {typedText && (
                <button
                  onClick={handleClearText}
                  title="Clear All"
                  className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-red-900/60 text-zinc-300 hover:text-red-200 transition-colors cursor-pointer shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Numbers Row */}
            <div className="grid grid-cols-10 gap-1">
              {NUM_KEYS.map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-blue-600 active:text-white border border-zinc-800 text-xs font-mono font-medium text-zinc-300 active:scale-95 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Main Alphabet / Letter Keys (Design: grid grid-cols-7 gap-1 with aspect-square buttons) */}
            {keyboardLayout === 'alphabet' ? (
              // Alphabet A-Z layout
              <div className="flex flex-col gap-1">
                {ALPHABET_KEYS.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-7 gap-1">
                    {row.map((letter) => (
                      <button
                        key={letter}
                        onClick={() => handleKeyPress(letter)}
                        className="w-full aspect-square flex items-center justify-center text-xs font-medium text-zinc-300 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white active:bg-blue-600 active:text-white rounded transition-colors active:scale-90 cursor-pointer"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              // QWERTY Layout
              <div className="flex flex-col gap-1">
                {QWERTY_KEYS.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {row.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="flex-1 py-2 rounded text-xs font-medium text-zinc-300 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white active:bg-blue-600 active:text-white transition-colors active:scale-90 cursor-pointer"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Controls (Space, Backspace, Caps) */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setIsCapsLock((c) => !c)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                  isCapsLock
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                a/A
              </button>

              <button
                id="keyboard-space-button"
                onClick={() => handleKeyPress(' ')}
                className="flex-1 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Space className="w-3.5 h-3.5 text-zinc-500" />
                <span>Space</span>
              </button>

              <button
                id="keyboard-backspace-button"
                onClick={handleBackspace}
                title="Backspace"
                className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Delete className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layout Engagement Caption & Accent Bar (Design HTML: Full Alphabet Layout Engaged) */}
            <div className="mt-1 text-center text-[9px] text-zinc-500 font-mono italic">
              Full Alphabet Layout Engaged
            </div>
          </div>
        )}

        {/* Decorative Bottom Home Bar Accent (Matching Design HTML) */}
        <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mt-4" />
      </div>

      {/* Helper message below remote */}
      <div className="mt-4 text-center max-w-xs text-xs text-slate-500 font-mono">
        <span>Web Remote Controller • Dual-screen sync active</span>
      </div>
    </div>
  );
};
