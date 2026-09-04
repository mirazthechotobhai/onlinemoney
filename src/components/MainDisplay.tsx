import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Radio,
  KeyRound,
  AlertCircle,
  Tv,
  Smartphone,
  X,
  Lock
} from 'lucide-react';
import { remoteSync } from '../services/remoteSync';
import { RemoteMessage, RemoteSession } from '../types';
import {
  activateSessionOnMain,
  deactivateSession,
  listenToSession,
  getSession
} from '../services/sessionService';

interface MainDisplayProps {
  onToggleSplitView?: () => void;
  isSplitView?: boolean;
}

export const MainDisplay: React.FC<MainDisplayProps> = ({
  onToggleSplitView,
  isSplitView = false,
}) => {
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  // Firebase Cloud Pairing Code State
  const [inputCode, setInputCode] = useState<string>('');
  const [activeSession, setActiveSession] = useState<RemoteSession | null>(() => {
    const savedCode = typeof window !== 'undefined' ? localStorage.getItem('main_active_session_code') : null;
    if (savedCode) {
      return {
        code: savedCode,
        userId: 'persisted',
        status: 'active',
        createdAt: Date.now(),
        lastActive: Date.now(),
      };
    }
    return null;
  });
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Screen text state (sent via keyboard from remote or typed directly)
  const [remoteText, setRemoteText] = useState<string>('');

  // Power state
  const [isPowerOn, setIsPowerOn] = useState<boolean>(true);

  // Laser Pointer state
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPointerActive, setIsPointerActive] = useState<boolean>(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Audio synthesizer
  const playSound = (freq = 440, type: OscillatorType = 'sine', duration = 0.08) => {
    try {
      if (typeof window === 'undefined') return;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Reusable action dispatcher for both local BroadcastChannel & Firebase cloud stream
  const executeRemoteAction = (msg: RemoteMessage) => {
    if (msg.sender === 'main') return;

    setIsConnected(true);
    setLastPingTime(Date.now());

    switch (msg.type) {
      case 'ping': {
        remoteSync.send({
          type: 'pong',
          sender: 'main',
          payload: { timestamp: Date.now() },
        });
        break;
      }

      case 'pong': {
        setIsConnected(true);
        break;
      }

      case 'pointer_move': {
        if (msg.payload?.pointer) {
          setIsPointerActive(true);
          setPointerPos((prev) => {
            const dx = msg.payload?.pointer?.dx ?? 0;
            const dy = msg.payload?.pointer?.dy ?? 0;
            const newX = Math.min(99, Math.max(1, prev.x + dx));
            const newY = Math.min(99, Math.max(1, prev.y + dy));
            return { x: newX, y: newY };
          });
        }
        break;
      }

      case 'pointer_click': {
        setPointerPos((curr) => {
          setClickRipple({ x: curr.x, y: curr.y, id: Date.now() });
          return curr;
        });
        playSound(587, 'triangle', 0.1);
        break;
      }

      case 'back_press': {
        playSound(280, 'sine', 0.08);
        setRemoteText((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
        break;
      }

      case 'power_toggle': {
        playSound(220, 'square', 0.2);
        setIsPowerOn((p) => !p);
        break;
      }

      case 'text_input': {
        const char = msg.payload?.char || '';
        if (char) {
          setRemoteText((prev) => prev + char);
          playSound(520 + Math.random() * 100, 'sine', 0.04);
        }
        break;
      }

      case 'text_backspace': {
        setRemoteText((prev) => prev.slice(0, -1));
        playSound(300, 'sine', 0.04);
        break;
      }

      case 'text_clear': {
        setRemoteText('');
        playSound(200, 'sine', 0.08);
        break;
      }

      case 'text_set': {
        const fullText = msg.payload?.text ?? '';
        setRemoteText(fullText);
        break;
      }

      case 'logout': {
        // Remote logged out - auto logout on the main website!
        localStorage.removeItem('main_active_session_code');
        setActiveSession(null);
        setInputCode('');
        setIsConnected(false);
        setRemoteText('');
        break;
      }
    }
  };

  // Keyboard support on the main screen directly as well
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when pairing input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Backspace') {
        setRemoteText((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
        playSound(300, 'sine', 0.04);
      } else if (e.key === 'Escape') {
        setRemoteText('');
        playSound(200, 'sine', 0.08);
      } else if (e.key === 'Enter') {
        setRemoteText((prev) => prev + ' ');
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setRemoteText((prev) => prev + e.key);
        playSound(520 + Math.random() * 100, 'sine', 0.04);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subscribe to local remote events
  useEffect(() => {
    remoteSync.send({
      type: 'ping',
      sender: 'main',
      payload: { timestamp: Date.now() },
    });

    const unsubscribe = remoteSync.subscribe((msg: RemoteMessage) => {
      executeRemoteAction(msg);
    });

    const pingInterval = setInterval(() => {
      remoteSync.send({
        type: 'ping',
        sender: 'main',
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
      clearInterval(pingInterval);
      clearInterval(checkInterval);
    };
  }, [lastPingTime]);

  // Listen to Firestore paired session messages
  const lastProcessedFirestoreMsgId = useRef<string>('');
  useEffect(() => {
    if (!activeSession?.code || activeSession.code === 'STANDALONE') return;

    const unsubFirestore = listenToSession(activeSession.code, (session) => {
      if (!session) {
        // Do not clear active session on brief Firestore disconnection
        return;
      }

      // If remote logged out, auto logout the main website!
      if (session.status === 'logged_out' || session.lastMessage?.type === 'logout') {
        localStorage.removeItem('main_active_session_code');
        setActiveSession(null);
        setInputCode('');
        setIsConnected(false);
        setRemoteText('');
        return;
      }

      setActiveSession((prev) => ({ ...(prev || {}), ...session, status: 'active' } as RemoteSession));
      setIsConnected(true);

      if (session.lastMessage && session.lastMessage.id !== lastProcessedFirestoreMsgId.current) {
        lastProcessedFirestoreMsgId.current = session.lastMessage.id;
        executeRemoteAction(session.lastMessage);
      }
    });

    return () => unsubFirestore();
  }, [activeSession?.code]);

  // Handle Pairing Code submission on Main Display
  const handleActivatePairingCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setPairingError('Please enter a valid permanent code (e.g. 6 letters/digits).');
      return;
    }

    setIsActivating(true);
    setPairingError(null);

    const result = await activateSessionOnMain(cleanCode);
    setIsActivating(false);

    if (result.success && result.session) {
      setActiveSession(result.session);
      setIsConnected(true);
      playSound(660, 'sine', 0.2);
      localStorage.setItem('main_active_session_code', cleanCode);
    } else {
      setPairingError(result.error || 'Failed to activate code in Firebase.');
    }
  };

  // Restore and sync previous session code on load - stays active until explicit logout
  useEffect(() => {
    const savedCode = localStorage.getItem('main_active_session_code');
    if (savedCode && savedCode !== 'STANDALONE') {
      getSession(savedCode).then((docData) => {
        if (!docData || docData.status === 'logged_out') {
          // Previously logged out on remote - clear local storage
          localStorage.removeItem('main_active_session_code');
          setActiveSession(null);
          setIsConnected(false);
        } else {
          activateSessionOnMain(savedCode).then((res) => {
            if (res.success && res.session) {
              setActiveSession(res.session);
              setIsConnected(true);
            }
          });
        }
      });
    }
  }, []);

  // Construct URL for remote tab
  const getRemoteUrl = () => {
    if (typeof window === 'undefined') return '?view=remote';
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'remote');
    return url.toString();
  };

  const handleOpenRemoteNewTab = () => {
    const remoteUrl = getRemoteUrl();
    const newWindow = window.open(remoteUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const link = document.createElement('a');
      link.href = remoteUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDisconnectSession = async () => {
    if (activeSession?.code && activeSession.code !== 'STANDALONE') {
      await deactivateSession(activeSession.code);
    }
    localStorage.removeItem('main_active_session_code');
    setActiveSession(null);
    setInputCode('');
  };

  // Standby / Power Off
  if (!isPowerOn) {
    return (
      <div className="relative min-h-screen w-full bg-black flex items-center justify-center cursor-none">
        {/* Pitch black screen when powered off */}
      </div>
    );
  }

  return (
    <div
      id="main-display-container"
      className="relative min-h-screen w-full bg-black text-white flex flex-col font-sans overflow-hidden selection:bg-blue-600 selection:text-white"
    >
      {/* Top Header with Website Name, Code Input Option, and Open Remote Button */}
      <header
        id="main-header"
        className="w-full bg-zinc-950/90 border-b border-zinc-800/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 z-30 backdrop-blur-md sticky top-0"
      >
        {/* Website Name */}
        <div id="website-name" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <Tv className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm sm:text-base md:text-lg text-white tracking-tight whitespace-nowrap">
            Web Remote Controller
          </span>
        </div>

        {/* Header Code Input Option */}
        <div className="flex items-center justify-center relative">
          {activeSession && activeSession.code !== 'STANDALONE' ? (
            <div id="header-linked-code-badge" className="flex items-center gap-2 bg-zinc-900/90 border border-emerald-500/40 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">Linked:</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400 tracking-wider">
                  {activeSession.code}
                </span>
              </div>
              <button
                onClick={handleDisconnectSession}
                title="Disconnect / Change Code"
                className="text-[10px] font-mono text-zinc-400 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <form onSubmit={handleActivatePairingCode} className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative flex items-center">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none hidden sm:inline-block" />
                <input
                  id="header-screen-code-input"
                  type="text"
                  maxLength={10}
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setPairingError(null);
                  }}
                  placeholder="ENTER CODE"
                  className="sm:pl-8 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-center font-mono font-bold text-xs sm:text-sm tracking-widest text-white outline-none placeholder:text-zinc-500 uppercase w-28 sm:w-36 transition-all"
                />
              </div>
              <button
                id="header-screen-activate-button"
                type="submit"
                disabled={isActivating || !inputCode.trim()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                {isActivating ? 'Connecting...' : 'Connect'}
              </button>
            </form>
          )}

          {/* Pairing Error Banner */}
          {pairingError && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 text-xs text-red-300 bg-red-950/95 border border-red-800/90 px-3.5 py-1.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{pairingError}</span>
              <button
                onClick={() => setPairingError(null)}
                className="ml-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Remote Open Button */}
        <button
          id="header-open-remote-btn"
          onClick={handleOpenRemoteNewTab}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all shadow-xs cursor-pointer hover:border-zinc-600 shrink-0"
          title="Open Remote Control in New Tab"
        >
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Open Remote</span>
          <span className="sm:hidden">Remote</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75 hidden md:inline-block" />
        </button>
      </header>

      {/* Main Viewport Content Area: Fullscreen empty canvas showing only the bold text */}
      <div className="flex-1 w-full flex items-center justify-center relative">
        <div
          id="fullscreen-text-viewport"
          className="w-full h-full min-h-[calc(100vh-65px)] flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20 text-center select-none"
        >
          {remoteText ? (
            <h1
              id="remote-live-bold-text"
              className="font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-white tracking-tight break-words max-w-7xl leading-tight select-text"
            >
              {remoteText}
              <span className="inline-block w-2 sm:w-3.5 md:w-5 h-8 sm:h-14 md:h-18 lg:h-22 bg-blue-500 ml-2 sm:ml-4 align-middle animate-pulse rounded-xs" />
            </h1>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              {/* Ultra-minimal blinking cursor when completely empty */}
              <span className="inline-block w-2.5 sm:w-4 md:w-5 h-12 sm:h-18 md:h-24 bg-zinc-700 animate-pulse rounded-xs" />
              {!activeSession && (
                <p className="text-zinc-600 text-xs sm:text-sm font-mono tracking-wider">
                  Enter remote pairing code in the header to link
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Discreet disconnect link at bottom-right if session is active */}
      {activeSession && activeSession.code !== 'STANDALONE' && (
        <div className="fixed bottom-2.5 right-4 z-20 opacity-25 hover:opacity-100 transition-opacity">
          <button
            onClick={handleDisconnectSession}
            title="Click to disconnect/unpair"
            className="text-[10px] font-mono text-zinc-500 hover:text-red-400 transition-colors cursor-pointer bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/80 flex items-center gap-1"
          >
            <span>Linked: {activeSession.code}</span>
            <span className="text-zinc-600">•</span>
            <span className="hover:underline">Disconnect</span>
          </button>
        </div>
      )}

      {/* Optional Pointer / Touchpad Virtual Cursor */}
      {isPointerActive && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${pointerPos.x}%`,
            top: `${pointerPos.y}%`,
          }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50" />
        </div>
      )}

      {/* Click Ripple Effect */}
      {clickRipple && (
        <div
          key={clickRipple.id}
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${clickRipple.x}%`,
            top: `${clickRipple.y}%`,
          }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-blue-500/20 animate-ping" />
        </div>
      )}
    </div>
  );
};
