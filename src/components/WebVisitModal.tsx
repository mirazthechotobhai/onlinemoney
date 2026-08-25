import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Zap,
  RotateCw,
  Play,
  Pause,
  AlertTriangle,
  Clock,
  Radio,
  Users,
  Crown,
  Trophy,
  Award,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PromotedLink, UserProfile } from '../types';
import { sound } from '../utils/sound';
import { BadgeTierIcon, getBadgeTier, VerifiedBadge } from './VerifiedBadge';

interface WebVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  promotedLinks?: PromotedLink[];
  currentUser?: UserProfile;
  links?: PromotedLink[];
  onRewardVisitor: (amount: number, linkOwnerId: string, linkOwnerName: string, linkTitle: string) => void;
  onDeductOwner: (linkOwnerId: string, amount: number) => void;
  onOpenSettings?: () => void;
  onOpenBadges?: () => void;
}

type VisitStatus = 'idle' | 'visiting' | 'early_closed' | 'success';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 hours

const getVisitsStorageKey = (uid?: string, email?: string) => `link_visits_${uid || email || 'guest'}`;

const getStoredVisits = (storageKey: string): Record<string, number> => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid: Record<string, number> = {};
    for (const [key, timestamp] of Object.entries(parsed)) {
      if (typeof timestamp === 'number' && now - timestamp < TWELVE_HOURS_MS) {
        valid[key] = timestamp;
      }
    }
    return valid;
  } catch {
    return {};
  }
};

export const WebVisitModal: React.FC<WebVisitModalProps> = ({
  isOpen,
  onClose,
  profile,
  promotedLinks,
  currentUser,
  links,
  onRewardVisitor,
  onDeductOwner,
}) => {
  const [activeVisitingLink, setActiveVisitingLink] = useState<PromotedLink | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [totalDuration, setTotalDuration] = useState(15);
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('idle');
  const [visitedTimestamps, setVisitedTimestamps] = useState<Record<string, number>>({});
  const [isMainPageActive, setIsMainPageActive] = useState(false);
  const [, setIframeError] = useState(false);

  const openedTabRef = useRef<Window | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef(15);
  const totalDurationRef = useRef(15);
  const isTargetTabFocusedRef = useRef(false);
  const targetTabActiveStartRef = useRef<number | null>(null);

  const userProfile = profile || currentUser || {
    id: 'user_default',
    name: 'User',
    email: '',
    avatarUrl: '',
    balance: 0,
    gems: 0,
    level: 1,
    xp: 0,
    dailyStreak: 0,
    tasksCompleted: 0,
    language: 'bn' as const,
    notificationsEnabled: true,
    soundEnabled: true,
    totalVisitedCount: 0,
  };

  const storageKey = getVisitsStorageKey(userProfile.id, userProfile.email);

  // Sync ref with state
  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // ignore
    }
  };

  // Complete a successful 15-second visit
  const handleVisitSuccess = (link: PromotedLink) => {
    if (timerRef.current) clearInterval(timerRef.current);
    isTargetTabFocusedRef.current = false;
    targetTabActiveStartRef.current = null;
    countdownRef.current = 0;
    setCountdown(0);
    setSecondsSpent(totalDurationRef.current);

    // Automatically close the opened new tab!
    if (openedTabRef.current && !openedTabRef.current.closed) {
      try {
        openedTabRef.current.close();
      } catch (e) {
        console.log('Browser tab close note:', e);
      }
    }

    // Success sound & Confetti
    sound.playSuccess(userProfile.soundEnabled);
    triggerConfetti();

    // Grant visitor reward (+1 point) and deduct owner (-1 point)
    const rewardAmount = link.visitReward || 1;
    onRewardVisitor(
      rewardAmount,
      link.userId,
      link.userName || 'Public User',
      link.title
    );
    onDeductOwner(link.userId, rewardAmount);

    // Record visit timestamp to hide this profile/link for 12 hours
    const completedTime = Date.now();
    setVisitedTimestamps((prev) => {
      const updated = {
        ...prev,
        [link.id]: completedTime,
        [link.userId]: completedTime,
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Instantly return to public profiles list so the user immediately sees the remaining other profiles!
    setActiveVisitingLink(null);
    setVisitStatus('idle');
  };

  // When visitor switches back to main page: PAUSE and credit any time spent on the target tab
  const pauseActiveVisit = () => {
    setIsMainPageActive(true);
    if (isTargetTabFocusedRef.current && targetTabActiveStartRef.current !== null) {
      const elapsedMs = Date.now() - targetTabActiveStartRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      if (elapsedSec > 0) {
        const nextCountdown = Math.max(0, countdownRef.current - elapsedSec);
        countdownRef.current = nextCountdown;
        setCountdown(nextCountdown);
        setSecondsSpent(totalDurationRef.current - nextCountdown);
        if (nextCountdown <= 0 && activeVisitingLink) {
          handleVisitSuccess(activeVisitingLink);
          return;
        }
      }
    }
    isTargetTabFocusedRef.current = false;
    targetTabActiveStartRef.current = null;
  };

  // When visitor switches to the target tab (or clicks away from main page): RESUME countdown
  const resumeActiveVisit = () => {
    setIsMainPageActive(false);
    if (!isTargetTabFocusedRef.current) {
      isTargetTabFocusedRef.current = true;
      targetTabActiveStartRef.current = Date.now();
    }
  };

  // Window Focus & Visibility tracking
  useEffect(() => {
    const handleMainPageFocused = () => {
      pauseActiveVisit();
    };

    const handleMainPageBlurred = () => {
      resumeActiveVisit();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pauseActiveVisit();
      } else {
        resumeActiveVisit();
      }
    };

    window.addEventListener('focus', handleMainPageFocused);
    window.addEventListener('blur', handleMainPageBlurred);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleMainPageBlurred);
    window.addEventListener('pageshow', handleMainPageFocused);

    return () => {
      window.removeEventListener('focus', handleMainPageFocused);
      window.removeEventListener('blur', handleMainPageBlurred);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleMainPageBlurred);
      window.removeEventListener('pageshow', handleMainPageFocused);
    };
  }, [activeVisitingLink]);

  // Load and refresh stored 12-hour visits whenever user or modal opens
  useEffect(() => {
    setVisitedTimestamps(getStoredVisits(storageKey));
  }, [storageKey, isOpen]);

  const allLinks = promotedLinks || links || [];
  const isBn = userProfile.language === 'bn';

  // Filter valid real public links and sort by Profile Level (Highest Level on Top):
  // 1. Exclude demo links & inactive links & links with <1 coin
  // 2. Exclude own links
  // 3. 12-Hour Cooldown: Completely hide profiles that were visited within the last 12 hours!
  // 4. Primary Ranking: Profile Level (descending) - Higher level is ALWAYS at the top!
  const now = Date.now();
  const publicProfiles = allLinks
    .filter((link) => {
      if (!link || !link.active) return false;
      if (link.id?.startsWith('link_demo_')) return false;
      if ((link.coinsAvailable || 0) < 1) return false;

      // Check if own link
      const isOwnLink =
        link.userId === userProfile.id ||
        link.userId === (userProfile as any).userId ||
        (userProfile.email && (link.userId === userProfile.email || link.id === userProfile.email));
      if (isOwnLink) return false;

      // 12-Hour Cooldown: Hide if visited within last 12 hours
      const lastVisit = visitedTimestamps[link.id] || visitedTimestamps[link.userId];
      if (lastVisit && now - lastVisit < TWELVE_HOURS_MS) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 1. Primary rank: Level descending (Highest level profile stays on top)
      const levelA = a.level ?? 1;
      const levelB = b.level ?? 1;
      if (levelB !== levelA) {
        return levelB - levelA;
      }
      // 2. Secondary rank: XP descending
      const xpA = a.xp ?? 0;
      const xpB = b.xp ?? 0;
      if (xpB !== xpA) {
        return xpB - xpA;
      }
      // 3. Tertiary rank: Total completed visits / points
      const visitsA = a.totalVisitedCount ?? 0;
      const visitsB = b.totalVisitedCount ?? 0;
      if (visitsB !== visitsA) {
        return visitsB - visitsA;
      }
      // 4. Quaternary: Available Coins
      return (b.coinsAvailable || 0) - (a.coinsAvailable || 0);
    });

  // Start visiting a link from scratch (15s)
  const startVisiting = (link: PromotedLink) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = link.durationSeconds || 15;
    setActiveVisitingLink(link);
    setTotalDuration(duration);
    totalDurationRef.current = duration;
    setCountdown(duration);
    countdownRef.current = duration;
    setSecondsSpent(0);
    setVisitStatus('visiting');
    setIframeError(false);
    
    // User is heading to the new tab
    setIsMainPageActive(false);
    isTargetTabFocusedRef.current = true;
    targetTabActiveStartRef.current = Date.now();
    sound.playClick(userProfile.soundEnabled);

    // Format target link
    const formattedUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;

    // Open new tab
    try {
      const newTab = window.open(formattedUrl, '_blank');
      openedTabRef.current = newTab;
    } catch {
      openedTabRef.current = null;
    }
  };

  // Resume visiting without resetting countdown (continues remaining seconds!)
  const resumeVisiting = (link: PromotedLink) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setActiveVisitingLink(link);
    setVisitStatus('visiting');
    setIframeError(false);

    // User is resuming the target tab
    setIsMainPageActive(false);
    isTargetTabFocusedRef.current = true;
    targetTabActiveStartRef.current = Date.now();
    sound.playClick(userProfile.soundEnabled);

    const formattedUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;

    if (!openedTabRef.current || openedTabRef.current.closed) {
      try {
        const newTab = window.open(formattedUrl, '_blank');
        openedTabRef.current = newTab;
      } catch {
        openedTabRef.current = null;
      }
    } else {
      try {
        openedTabRef.current.focus();
      } catch {
        // ignore
      }
    }
  };

  // Real-time Tab Lifecycle & Countdown Monitoring effect
  useEffect(() => {
    if (visitStatus !== 'visiting' || !activeVisitingLink) return;

    timerRef.current = setInterval(() => {
      // 1. Check if user closed the tab before completion!
      if (openedTabRef.current && openedTabRef.current.closed && countdownRef.current > 0) {
        clearInterval(timerRef.current!);
        isTargetTabFocusedRef.current = false;
        targetTabActiveStartRef.current = null;
        setVisitStatus('early_closed');
        sound.playClick(userProfile.soundEnabled);
        return;
      }

      // 2. If user is actively on the target tab, count down the time
      if (isTargetTabFocusedRef.current && targetTabActiveStartRef.current !== null) {
        const currentNow = Date.now();
        const elapsedMs = currentNow - targetTabActiveStartRef.current;
        const elapsedSec = Math.floor(elapsedMs / 1000);

        if (elapsedSec > 0) {
          targetTabActiveStartRef.current = currentNow - (elapsedMs % 1000);
          const nextCountdown = Math.max(0, countdownRef.current - elapsedSec);
          countdownRef.current = nextCountdown;
          setCountdown(nextCountdown);
          setSecondsSpent(totalDurationRef.current - nextCountdown);

          // 3. Check if countdown completed!
          if (nextCountdown <= 0) {
            handleVisitSuccess(activeVisitingLink);
          }
        }
      }
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visitStatus, activeVisitingLink, userProfile.soundEnabled, onRewardVisitor, onDeductOwner, storageKey]);

  const handleCloseActiveVisit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (openedTabRef.current && !openedTabRef.current.closed) {
      try {
        openedTabRef.current.close();
      } catch {
        // ignore
      }
    }
    setVisitStatus('idle');
    setActiveVisitingLink(null);
  };

  const handleCloseModal = () => {
    handleCloseActiveVisit();
    onClose();
  };

  if (!isOpen) return null;

  const progressPercentage = Math.min(100, Math.round(((totalDuration - countdown) / totalDuration) * 100));
  const currentBadge = getBadgeTier(userProfile.totalVisitedCount || 0);

  return (
    <div
      id="web-visit-fullscreen-page"
      className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#0c0e14] flex flex-col text-white animate-in fade-in duration-200 overflow-hidden"
    >
      {/* Fullscreen Header Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3.5 bg-[#12141a]/95 backdrop-blur-md border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={handleCloseModal}
            className="p-2 sm:p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-700/60"
            title={isBn ? 'ফিরে যান' : 'Back to Dashboard'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-black text-white flex items-center gap-2 font-['Outfit'] tracking-tight">
                {isBn ? 'লিংক এক্সচেঞ্জ' : 'Link Exchange'}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 hidden xs:block">
                {isBn
                  ? '১৫ সেকেন্ড লাইভ ভিজিট করুন এবং প্রতি ভিজিটে ১ পয়েন্ট অর্জন করুন'
                  : 'Visit websites for 15 seconds to earn 1 point per visit'}
              </p>
            </div>
          </div>
        </div>

        {/* User Stats & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Score Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171922] border border-zinc-800 text-xs font-mono">
            <BadgeTierIcon tier={userProfile.lifetimeVerified ? 10 : currentBadge.tier} className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white">{userProfile.totalVisitedCount || 0}</span>
            <span className="text-[10px] text-zinc-400 uppercase">{isBn ? 'পয়েন্ট' : 'pts'}</span>
          </div>

          <button
            onClick={handleCloseModal}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={isBn ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Fullscreen Scrollable Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto space-y-4">
        
        {/* Active 15s Visiting Mode Viewer */}
        {activeVisitingLink ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Progress & Live Tracker Card */}
            <div className="p-4 sm:p-6 rounded-3xl bg-[#14161c] border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  {/* Visual Circular Timer Display */}
                  <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                    <div
                      className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${
                        visitStatus === 'success'
                          ? 'border-emerald-500'
                          : visitStatus === 'early_closed'
                          ? 'border-rose-500'
                          : isMainPageActive
                          ? 'border-amber-400/50'
                          : 'border-amber-400 border-t-transparent animate-spin'
                      }`}
                    />
                    <div className="text-center">
                      <span className="text-xl sm:text-2xl font-black font-mono text-white">
                        {visitStatus === 'success' ? '✓' : countdown}
                      </span>
                      <span className="block text-[9px] sm:text-[10px] text-zinc-400 uppercase font-mono">
                        {visitStatus === 'success' ? (isBn ? 'সম্পন্ন' : 'DONE') : (isBn ? 'সেকেন্ড' : 'SEC')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {activeVisitingLink.title}
                      </h3>
                      
                      {visitStatus === 'success' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isBn ? 'সফলভাবে সম্পন্ন' : 'Completed'}
                        </span>
                      )}

                      {visitStatus === 'early_closed' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {isBn ? 'ট্যাব আগে বন্ধ করা হয়েছে' : 'Tab Closed Early'}
                        </span>
                      )}

                      {visitStatus === 'visiting' && isMainPageActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Pause className="w-3 h-3 text-amber-400" />
                          {isBn ? 'টাইমার পজ আছে (মূল পেজে আছেন)' : 'Timer Paused (Main Page)'}
                        </span>
                      )}

                      {visitStatus === 'visiting' && !isMainPageActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                          <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                          {isBn ? 'নতুন ট্যাবে টাইমার চলছে...' : 'Tab Timer Running...'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-1 font-mono mt-0.5">
                      {activeVisitingLink.url}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] sm:text-xs mt-1.5 font-medium">
                      {visitStatus === 'visiting' && isMainPageActive && (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Pause className="w-3 h-3" />
                          {isBn
                            ? `⏸️ আপনি মূল পেজে আছেন — টাইমার স্থগিত। বাকি ${countdown}s পার করতে ওপেন হওয়া ট্যাবে যান!`
                            : `⏸️ Paused while viewing main page. Return to opened tab to resume remaining ${countdown}s!`}
                        </span>
                      )}

                      {visitStatus === 'visiting' && !isMainPageActive && (
                        <span className="text-emerald-300">
                          {isBn
                            ? `💡 ওপেন হওয়া নতুন ট্যাবে থাকুন (${countdown} সেকেন্ড বাকি)`
                            : `💡 Please stay on the opened new tab (${countdown}s remaining)`}
                        </span>
                      )}

                      {visitStatus === 'success' && (
                        <span className="text-emerald-400 font-bold">
                          {isBn ? '🎉 ১৫ সেকেন্ড পূর্ণ হয়েছে! ট্যাব স্বয়ংক্রিয়ভাবে বন্ধ হয়েছে।' : '🎉 15s completed! Tab auto-closed.'}
                        </span>
                      )}

                      {visitStatus === 'early_closed' && (
                        <span className="text-rose-400">
                          {isBn
                            ? `⚠️ ১৫ সেকেন্ড পূর্ণ হওয়ার আগেই বন্ধ হয়েছে (বাকি ছিল ${countdown}s)`
                            : `⚠️ Closed early! ${countdown}s was remaining.`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  {visitStatus === 'early_closed' && (
                    <>
                      <button
                        onClick={() => resumeVisiting(activeVisitingLink)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>
                          {isBn ? `ট্যাব পুনরায় খুলুন (বাকি ${countdown}s চলবে)` : `Resume Tab (${countdown}s left)`}
                        </span>
                      </button>

                      <button
                        onClick={() => startVisiting(activeVisitingLink)}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title={isBn ? 'নতুন করে ১৫ সেকেন্ড শুরু করুন' : 'Restart 15 seconds'}
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>{isBn ? 'পুনরায় ১৫s শুরু' : 'Restart 15s'}</span>
                      </button>
                    </>
                  )}

                  {visitStatus === 'visiting' && (
                    <button
                      onClick={() => resumeVisiting(activeVisitingLink)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {isBn
                          ? `ট্যাবে ফিরে যান (বাকি ${countdown}s চলবে)`
                          : `Return to Tab (${countdown}s left)`}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={handleCloseActiveVisit}
                    className="px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {visitStatus === 'success' ? (isBn ? 'তালিকায় ফিরুন' : 'Back to List') : (isBn ? 'বাতিল' : 'Cancel')}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>
                    {isBn ? 'অগ্রগতি:' : 'Progress:'} {totalDuration - countdown}/{totalDuration} {isBn ? 'সেকেন্ড' : 'sec'}
                  </span>
                  <span className={visitStatus === 'success' ? 'text-emerald-400 font-bold' : isMainPageActive ? 'text-amber-300' : 'text-amber-400'}>
                    {progressPercentage}% {isMainPageActive && visitStatus === 'visiting' ? (isBn ? '(পজ করা)' : '(Paused)') : ''}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-800/90 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      visitStatus === 'success'
                        ? 'bg-emerald-500'
                        : visitStatus === 'early_closed'
                        ? 'bg-rose-500'
                        : isMainPageActive
                        ? 'bg-amber-400/60'
                        : 'bg-gradient-to-r from-amber-500 to-amber-300'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Paused on Main Page Notice Banner */}
            {visitStatus === 'visiting' && isMainPageActive && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Pause className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {isBn ? 'টাইমার সাময়িকভাবে স্থগিত আছে' : 'Timer is currently paused'}
                    </h4>
                    <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                      {isBn
                        ? `আপনি মূল পেজে ফিরে এসেছেন, তাই সময় বন্ধ রয়েছে। পয়েন্ট অর্জনের জন্য ওপেন হওয়া ট্যাবে থাকুন। আপনার বাকি রয়েছে মাত্র ${countdown} সেকেন্ড (নতুন করে শুরু করার প্রয়োজন নেই)।`
                        : `You navigated back to the main page, so the timer is paused. Return to the opened tab to finish the remaining ${countdown}s (it will resume seamlessly).`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => resumeVisiting(activeVisitingLink)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 self-end sm:self-center flex items-center gap-1.5 active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isBn ? `ট্যাবে যান (বাকি ${countdown}s চলবে)` : `Go to Tab (${countdown}s left)`}</span>
                </button>
              </div>
            )}

            {/* Early Closed Warning Banner */}
            {visitStatus === 'early_closed' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {isBn ? 'ট্যাবটি বন্ধ করা হয়েছে!' : 'Tab Was Closed!'}
                    </h4>
                    <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                      {isBn
                        ? `আপনার এখনো ${countdown} সেকেন্ড বাকি ছিল। নিচে ক্লিক করে পুনরায় ট্যাবটি ওপেন করুন এবং বাকি ${countdown} সেকেন্ড পূর্ণ করে পয়েন্ট অর্জন করুন (নতুন করে শুরু হবে না)।`
                        : `You still had ${countdown}s remaining. Reopen the tab to complete the remaining ${countdown}s without losing your progress.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => resumeVisiting(activeVisitingLink)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isBn ? `ট্যাব খুলুন (বাকি ${countdown}s চলবে)` : `Reopen (${countdown}s left)`}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {visitStatus === 'success' && (
              <div className="p-4 sm:p-6 rounded-3xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-200 shadow-xl">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black text-white">
                        {isBn ? '🎉 অভিনন্দন! ১৫ সেকেন্ড ভিজিট সফল!' : '🎉 Congratulations! 15s Visit Success!'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-black uppercase">
                        +1 Point
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 leading-relaxed">
                      {isBn
                        ? `নতুন ওপেন হওয়া ট্যাবটি স্বয়ংক্রিয়ভাবে বন্ধ করা হয়েছে। আপনার অ্যাকাউন্টে +১ পয়েন্ট যুক্ত হয়েছে (এই প্রোফাইলটি পরবর্তী ১২ ঘণ্টার জন্য তালিকা থেকে হাইড থাকবে)।`
                        : `The opened new tab has been auto-closed. +1 Point credited to your balance (This profile is hidden from your list for the next 12 hours).`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseActiveVisit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0 self-end sm:self-center"
                >
                  {isBn ? 'তালিকায় ফিরুন' : 'Back to List'}
                </button>
              </div>
            )}

            {/* Live Traffic Session Active Monitor */}
            <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#141722] to-[#0f1118] border border-zinc-800 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5 shadow-2xl min-h-[320px]">
              {/* Pulsing Target Website Radar Icon */}
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Globe className="w-10 h-10 animate-pulse" />
                </div>
                {!isMainPageActive && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div className="space-y-2 max-w-lg">
                <h3 className="text-lg sm:text-xl font-black text-white font-['Outfit'] tracking-tight">
                  {activeVisitingLink.title}
                </h3>
                <p className="text-xs sm:text-sm font-mono text-amber-400/90 break-all px-3 py-1.5 rounded-xl bg-black/40 border border-zinc-800/80 inline-block">
                  {activeVisitingLink.url}
                </p>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {isBn
                    ? isMainPageActive
                      ? '⏸️ টাইমার স্থগিত রয়েছে। ওপেন হওয়া নতুন ট্যাবে থাকলে স্বয়ংক্রিয়ভাবে টাইমার চলবে এবং ১৫ সেকেন্ড পূর্ণ হলে ট্যাব বন্ধ হয়ে +১ পয়েন্ট জমা হবে।'
                      : '⚡ টাইমার নতুন ট্যাবে চলছে! ১৫ সেকেন্ড পূর্ণ হওয়ামাত্রই ট্যাব স্বয়ংক্রিয়ভাবে বন্ধ হয়ে আপনার ব্যালেন্সে পয়েন্ট যোগ হবে।'
                    : isMainPageActive
                    ? '⏸️ Timer is paused. Switch to the target tab to continue the 15-second countdown.'
                    : '⚡ Active session running on the new tab! The tab will auto-close and grant points when 15s is complete.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
                <button
                  onClick={() => {
                    const formattedUrl = activeVisitingLink.url.startsWith('http')
                      ? activeVisitingLink.url
                      : `https://${activeVisitingLink.url}`;
                    const newTab = window.open(formattedUrl, '_blank');
                    openedTabRef.current = newTab;
                    resumeActiveVisit();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isBn ? 'ট্যাব ওপেন রাখুন / যান' : 'Focus / Reopen Tab'}</span>
                </button>
                <button
                  onClick={handleCloseActiveVisit}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {isBn ? 'বাতিল করুন' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Level Ranking Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2 font-['Outfit'] text-xs sm:text-sm">
                    <span>{isBn ? '👑 প্রোফাইল লেভেল র‍্যাংকিং' : '👑 Profile Level Ranking'}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider">
                      {isBn ? 'টপ পজিশন' : 'TOP RANK'}
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5 leading-relaxed">
                    {isBn
                      ? 'যাঁদের প্রোফাইল লেভেল যত বেশি, তাঁদের প্রোফাইল সবসময় শীর্ষে থাকবে। "আর্ন করুন" থেকে পয়েন্ট সংগ্রহ করে প্রোফাইল লেভেল বাড়ান!'
                      : 'Profiles with higher levels always rank at the top! Earn points in "Earn Rewards" to level up and reach #1.'}
                  </p>
                </div>
              </div>
            </div>

            {/* List Header & Remaining Count */}
            <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  {isBn ? 'উপলব্ধ প্রোফাইলসমূহ' : 'Available Profiles'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold text-[10px]">
                  {publicProfiles.length} {isBn ? 'টি বাকি' : 'remaining'}
                </span>
              </div>

              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                {isBn ? '⏱️ ১টি প্রোফাইল ১২ ঘণ্টায় ১ বার ভিজিট করা যাবে' : '⏱️ 1 visit per profile every 12 hours'}
              </span>
            </div>

            {/* List of Community Links */}
            {publicProfiles.length > 0 ? (
              <div className="space-y-3">
                {publicProfiles.map((link, index) => {
                  const serialNumber = index + 1;
                  const itemLevel = link.level || 1;
                  const isTopOne = index === 0;
                  const isTopTwo = index === 1;
                  const isTopThree = index === 2;

                  return (
                    <div
                      key={link.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm ${
                        isTopOne
                          ? 'bg-gradient-to-r from-amber-500/10 via-[#161822] to-[#14161c] border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
                          : isTopTwo
                          ? 'bg-gradient-to-r from-slate-500/10 via-[#161822] to-[#14161c] border-slate-500/40 hover:border-slate-400'
                          : isTopThree
                          ? 'bg-gradient-to-r from-amber-800/10 via-[#161822] to-[#14161c] border-amber-700/40 hover:border-amber-600'
                          : 'bg-[#14161c] border-zinc-800 hover:border-amber-500/40 hover:bg-[#171a23]'
                      }`}
                    >
                      {/* Left: Serial Number + Profile Info + Website details */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto flex-1">
                        {/* Serial Number Tag */}
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border flex flex-col items-center justify-center text-xs font-black font-mono shrink-0 shadow-inner ${
                            isTopOne
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/20'
                              : isTopTwo
                              ? 'bg-slate-500/20 border-slate-400 text-slate-200'
                              : isTopThree
                              ? 'bg-amber-800/20 border-amber-600 text-amber-400'
                              : 'bg-[#1d202a] border-zinc-700/80 text-zinc-300'
                          }`}
                        >
                          {isTopOne ? (
                            <>
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[10px] leading-none">#1</span>
                            </>
                          ) : isTopTwo ? (
                            <>
                              <Trophy className="w-3.5 h-3.5 text-slate-300" />
                              <span className="text-[10px] leading-none">#2</span>
                            </>
                          ) : isTopThree ? (
                            <>
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[10px] leading-none">#3</span>
                            </>
                          ) : (
                            <span>#{serialNumber}</span>
                          )}
                        </div>

                        {/* Profile Avatar */}
                        <div className="relative shrink-0">
                          <img
                            src={link.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${link.userId}`}
                            alt={link.userName}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-zinc-700 bg-zinc-800 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          {isTopOne && (
                            <span className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-amber-400 text-black shadow-md">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        {/* Public Profile & Website Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {link.userName || 'Public User'}
                            </span>
                            
                            {/* Profile Level Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border shadow-xs ${
                                itemLevel >= 10
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                                  : itemLevel >= 5
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : itemLevel >= 2
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              <Zap className="w-2.5 h-2.5 fill-current" />
                              <span>{isBn ? `লেভেল ${itemLevel}` : `LVL ${itemLevel}`}</span>
                            </span>

                            <VerifiedBadge
                              isVerified={true}
                              lifetimeVerified={link.lifetimeVerified || (link.totalVisitedCount || 0) >= 1000}
                              totalVisitedCount={link.totalVisitedCount || 100}
                              size="sm"
                              className="scale-90"
                            />
                            
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 font-mono">
                              {link.coinsAvailable || 0} {isBn ? 'পয়েন্ট' : 'pts'}
                            </span>
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1">
                              {link.title}
                            </h4>
                            <span className="text-[10px] text-zinc-500">•</span>
                            <span className="text-[11px] font-mono text-amber-400/90 truncate max-w-[200px] sm:max-w-[280px]">
                              {link.url}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Timer requirement + Action button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80 shrink-0">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{link.durationSeconds || 15}s</span>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-400" />
                          <span>+{link.visitReward || 1} {isBn ? 'পয়েন্ট' : 'Pt'}</span>
                        </div>

                        <button
                          onClick={() => startVisiting(link)}
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isBn ? 'ভিজিট করুন' : 'Visit Profile'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Clean Empty State */
              <div className="text-center py-16 px-4 rounded-3xl bg-[#14161c] border border-dashed border-zinc-800 space-y-3 max-w-md mx-auto shadow-sm my-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-white font-['Outfit']">
                    {isBn ? 'সব প্রোফাইল সফলভাবে ভিজিট করা হয়েছে!' : 'All available profiles visited!'}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isBn
                      ? 'প্রতিটি প্রোফাইল ১২ ঘণ্টায় ১ বার ভিজিট করা যায়। নতুন কোনো সদস্য লিংক যুক্ত করলে বা ১২ ঘণ্টা পূর্ণ হলে পুনরায় ভিজিট করতে পারবেন।'
                      : 'Each profile can be visited once every 12 hours. Newly added profiles or cooled down links will appear here.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Fullscreen Sticky Bottom Status Bar */}
      <footer className="px-3 sm:px-6 lg:px-8 py-3 bg-[#12141a]/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] sm:text-xs">
            {isBn ? '১৫ সেকেন্ড রিয়েল-টাইম লাইভ ট্র্যাফিক ভেরিফিকেশন সক্রিয়' : '15s Real-time Live Traffic Exchange Active'}
          </span>
        </div>

        <button
          onClick={handleCloseModal}
          className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
        </button>
      </footer>
    </div>
  );
};



