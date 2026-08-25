import React from 'react';
import { Coins, Gem, ArrowUpRight, Sparkles, Zap, Gift, Trophy, Globe, Award, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/sound';
import { getBadgeTier, BadgeTierIcon } from './VerifiedBadge';

interface BalanceCardProps {
  profile: UserProfile;
  onOpenEarn: () => void;
  onOpenWithdraw: () => void;
  onOpenWebVisit: () => void;
  onOpenBadges?: () => void;
  onQuickDailyClaim: () => void;
  canClaimDaily: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  profile,
  onOpenEarn,
  onOpenWithdraw,
  onOpenWebVisit,
  onOpenBadges,
  onQuickDailyClaim,
  canClaimDaily,
}) => {
  const isBn = profile.language === 'bn';
  const progressPercent = Math.min(100, Math.round((profile.xp / profile.nextLevelXp) * 100));
  const visitedPoints = profile.totalVisitedCount || 0;
  const is1kVerified = profile.lifetimeVerified || visitedPoints >= 1000;
  const currentBadge = getBadgeTier(visitedPoints);
  const progressTo1k = Math.min(100, Math.round((visitedPoints / 1000) * 100));

  return (
    <div id="balance-card-wrapper" className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Primary Wallet / Balance overview with the prominent Golden EARN button */}
      <div className="lg:col-span-2 relative rounded-3xl bg-[#1a1c23] p-6 sm:p-7 text-white shadow-2xl overflow-hidden border border-zinc-800/80 flex flex-col justify-between">
        {/* Background decorative vector elements & glows */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-white">
          <Coins className="w-48 h-48" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                <Coins className="w-3.5 h-3.5" />
              </span>
              {isBn ? 'মোট উপার্জিত ব্যালেন্স' : 'Total Earned Balance'}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {isBn ? 'লাইভ ওয়ালেট' : 'Live Wallet'}
            </span>
          </div>

          {/* Main numeric balances */}
          <div className="flex flex-wrap items-baseline gap-4 my-2">
            <div className="flex items-center gap-2.5">
              <span id="user-coin-balance" className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-['Outfit']">
                {profile.balance.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-400 uppercase tracking-wider">
                {isBn ? 'কয়েন' : 'Coins'}
              </span>
            </div>

            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242731] border border-zinc-800 shadow-inner">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span id="user-gems-balance" className="text-base font-black text-white font-mono">
                {profile.gems}
              </span>
              <span className="text-xs font-bold text-zinc-400">
                {isBn ? 'জেমস' : 'Gems'}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-zinc-400 font-medium mt-2">
            {isBn
              ? `≈ ৳${(profile.balance / 10).toFixed(2)} BDT সমমূল্যের রিয়েল রিওয়ার্ড`
              : `≈ $${(profile.balance / 1000).toFixed(2)} USD Value in Rewards`}
          </p>
        </div>

        {/* Action Row featuring the primary EARN BUTTON */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
          {/* THE PROMINENT EARN BUTTON (User Request in Elegant Dark style) */}
          <button
            id="btn-main-earn-action"
            onClick={() => {
              sound.playSuccess(profile.soundEnabled);
              onOpenEarn();
            }}
            className="group relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black active:scale-98 font-black text-base shadow-[0_15px_35px_-8px_rgba(245,158,11,0.4)] transition-all cursor-pointer overflow-hidden border border-amber-300"
          >
            {/* Animated shimmer highlight effect */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <span className="p-1 rounded-lg bg-black/10 text-black group-hover:rotate-12 transition-transform">
              <Zap className="w-5 h-5 fill-black" />
            </span>
            <span className="tracking-wider text-base uppercase font-['Outfit']">
              {isBn ? '💰 আর্ন করুন (Earn)' : '💰 Earn Rewards'}
            </span>
            <Sparkles className="w-4 h-4 text-black animate-spin" />
          </button>

          {/* Secondary Actions: Web Traffic Visit & Withdraw */}
          <div className="flex items-center gap-2">
            <button
              id="btn-visit-traffic-action"
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                onOpenWebVisit();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all border border-amber-500/30 shadow-md cursor-pointer"
              title={isBn ? '১৫ সেকেন্ড লিংক ভিজিট করে ১ পয়েন্ট আয় করুন' : 'Visit links for 15s to earn 1 point'}
            >
              <Globe className="w-4 h-4 text-amber-400" />
              <span>{isBn ? '🌐 লিঙ্ক এক্সচেঞ্জ' : '🌐 Web Traffic'}</span>
            </button>

            <button
              id="btn-withdraw-balance"
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                onOpenWithdraw();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-[#242731] hover:bg-[#2e323e] active:scale-95 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all border border-zinc-700/80 shadow-md cursor-pointer"
            >
              <span>{isBn ? 'উইথড্র / রিডিম' : 'Redeem'}</span>
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Level & Daily Streak Progress Card */}
      <div className="rounded-3xl bg-[#1a1c23] p-6 text-white shadow-2xl border border-zinc-800/80 flex flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white font-['Outfit']">
                  {isBn ? `লেভেল ${profile.level} অগ্রগতি` : `Level ${profile.level} Progress`}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {profile.xp} / {profile.nextLevelXp} XP
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#0f1115] h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-800 mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-amber-400/90 font-medium px-0.5 mb-3">
            <span>{isBn ? '⚡ আর্ন করুন থেকে লেভেল বৃদ্ধি করুন' : '⚡ Earn points to level up'}</span>
            <span className="font-bold">{isBn ? '👑 টপ র‍্যাংকিং সুবিধা' : '👑 Top Rank Boost'}</span>
          </div>

          <div className="mt-2 mb-2 p-2.5 rounded-2xl bg-[#14161c] border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${is1kVerified ? 'bg-zinc-800 text-zinc-200' : `${currentBadge.bgClass} ${currentBadge.colorClass}`}`}>
                <BadgeTierIcon tier={is1kVerified ? 10 : currentBadge.tier} className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-white block font-['Outfit']">
                  {is1kVerified
                    ? isBn
                      ? 'অফিসিয়াল ভেরিফাইড পার্টনার'
                      : 'YouTube-style Verified'
                    : isBn
                    ? `ব্যাজ: ${currentBadge.nameBn}`
                    : `Badge: ${currentBadge.nameEn}`}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {visitedPoints} / 1,000 pts ({progressTo1k}%)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                if (onOpenBadges) onOpenBadges();
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
            >
              {isBn ? '১০ ব্যাজ' : '10 Badges'}
            </button>
          </div>
        </div>

        {/* Quick Daily Claim Shortcut */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <button
            id="btn-quick-daily-claim"
            onClick={() => {
              if (canClaimDaily) {
                sound.playSuccess(profile.soundEnabled);
                onQuickDailyClaim();
              } else {
                sound.playClick(profile.soundEnabled);
                onOpenEarn();
              }
            }}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              canClaimDaily
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black shadow-lg shadow-amber-500/20 active:scale-98 animate-pulse'
                : 'bg-[#242731] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Gift className="w-4 h-4" />
            {canClaimDaily
              ? isBn
                ? '🎁 আজকের ফ্রি ডেইলি বোনাস নিন (+১০০ কয়েন)'
                : '🎁 Claim Today\'s Free Bonus (+100 Coins)'
              : isBn
              ? '✅ আজকের বোনাস নেওয়া হয়েছে'
              : '✅ Today\'s Bonus Claimed'}
          </button>
        </div>
      </div>
    </div>
  );
};
