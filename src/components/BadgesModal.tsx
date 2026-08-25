import React from 'react';
import { X, ShieldCheck, Award, Sparkles, CheckCircle2, Lock, ArrowRight, Zap, Target } from 'lucide-react';
import { BADGE_TIERS, getBadgeTier, BadgeTierIcon } from './VerifiedBadge';
import { sound } from '../utils/sound';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedPoints: number;
  soundEnabled: boolean;
  isBn?: boolean;
  onOpenWebVisit?: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  earnedPoints,
  soundEnabled,
  isBn = false,
  onOpenWebVisit,
}) => {
  if (!isOpen) return null;

  const currentTier = getBadgeTier(earnedPoints);
  const is1kVerified = earnedPoints >= 1000;
  const progressTo1k = Math.min(100, Math.round((earnedPoints / 1000) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92dvh] my-auto bg-[#1a1c23] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800/90 flex items-center justify-between bg-[#14161c]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 font-['Outfit']">
                {isBn ? 'প্রোফাইল ভেরিফিকেশন ও ব্যাজ রোডম্যাপ' : 'Profile Verification & 10 Badges'}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-zinc-400">
                {isBn
                  ? '১০০০টি লিঙ্ক ভিজিট সম্পন্ন করে পান আজীবন YouTube স্টাইল ভেরিফাইড টিক ব্যাজ'
                  : 'Complete 1,000 link visits to unlock the Official YouTube-style Verified Badge'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick(soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Current Status Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#14161c] border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                  {isBn ? 'আপনার বর্তমান অগ্রগতি' : 'YOUR LIVE STATUS'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {earnedPoints.toLocaleString()} / 1,000{' '}
                    <span className="text-xs sm:text-sm font-bold text-amber-400 font-sans">
                      {isBn ? 'পয়েন্ট অর্জিত' : 'Points Earned'}
                    </span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {is1kVerified ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isBn ? 'আজীবন ভেরিফাইড (Lifetime Verified)' : 'Lifetime Verified Partner'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    {isBn ? `লেভেল ব্যাজ ${currentTier.tier}/১০` : `Tier ${currentTier.tier}/10 Badge`}
                  </span>
                )}
              </div>
            </div>

            {/* Progress to 1,000 Points Official Verified */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>
                  {isBn
                    ? is1kVerified
                      ? 'অভিনন্দন! আপনি ১০০০+ পয়েন্ট পূর্ণ করে ভেরিফাইড হয়েছেন'
                      : `ভেরিফাইড ব্যাজ পেতে আর মাত্র ${Math.max(0, 1000 - earnedPoints)} পয়েন্ট বাকি`
                    : is1kVerified
                    ? 'Target achieved: Lifetime Verified Active'
                    : `${Math.max(0, 1000 - earnedPoints)} more points needed for Verified Badge`}
                </span>
                <span className="text-amber-400 font-bold">{progressTo1k}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    is1kVerified
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300'
                  }`}
                  style={{ width: `${progressTo1k}%` }}
                />
              </div>
            </div>
          </div>

          {/* 10 Badge Tier Grid / Progression Roadmap */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {isBn ? '১০টি ব্যাজের রোডম্যাপ (প্রতি ১০০ পয়েন্টে ১টি নতুন ব্যাজ)' : '10 Badge RoadMap (1 Badge per 100 Points)'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BADGE_TIERS.filter((b) => b.tier > 0).map((badge) => {
                const isUnlocked = earnedPoints >= badge.minPoints;
                const isCurrent = currentTier.tier === badge.tier;

                return (
                  <div
                    key={badge.tier}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 relative ${
                      badge.tier === 10
                        ? isUnlocked
                          ? 'bg-zinc-800/90 border-zinc-500 ring-1 ring-zinc-400/30'
                          : 'bg-[#14161c] border-zinc-800'
                        : isUnlocked
                        ? `${badge.bgClass} ${badge.borderClass}`
                        : 'bg-[#14161c]/60 border-zinc-800/60 opacity-60'
                    }`}
                  >
                    {/* Badge Icon */}
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 flex items-center justify-center ${
                        badge.tier === 10
                          ? 'bg-zinc-700 text-white'
                          : `${badge.bgClass} ${badge.colorClass}`
                      }`}
                    >
                      <BadgeTierIcon tier={badge.tier} className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {isBn ? badge.nameBn : badge.nameEn}
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-black font-extrabold">
                              CURRENT
                            </span>
                          )}
                        </h5>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                          {badge.minPoints} pts
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        {isBn ? badge.descriptionBn : badge.descriptionEn}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold">
                        {isUnlocked ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {isBn ? 'আনলকড (অর্জিত)' : 'Unlocked'}
                          </span>
                        ) : (
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {isBn
                              ? `${badge.minPoints - earnedPoints} পয়েন্ট বাকি`
                              : `${badge.minPoints - earnedPoints} pts left`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#14161c] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400 text-center sm:text-left">
            {isBn
              ? '💡 লিঙ্ক এক্সচেঞ্জ থেকে প্রতি ১৫ সেকেন্ড ভিজিটে ১ পয়েন্ট অর্জন করুন।'
              : '💡 Earn 1 point per 15s visit in Web Traffic Exchange.'}
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenWebVisit && (
              <button
                onClick={() => {
                  sound.playClick(soundEnabled);
                  onClose();
                  onOpenWebVisit();
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>{isBn ? 'পয়েন্ট অর্জন করুন' : 'Visit Links Now'}</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick(soundEnabled);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {isBn ? 'ঠিক আছে' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
