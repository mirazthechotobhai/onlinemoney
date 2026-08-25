import React from 'react';
import { 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  Zap, 
  Star, 
  Flame, 
  Shield, 
  Crown, 
  Gem, 
  Target,
  Medal,
  Compass
} from 'lucide-react';

export interface BadgeTier {
  tier: number;
  minPoints: number;
  nameEn: string;
  nameBn: string;
  badgeType: 'normal' | 'verified_partner';
  icon: string;
  descriptionEn: string;
  descriptionBn: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  {
    tier: 0,
    minPoints: 0,
    nameEn: 'Novice Visitor',
    nameBn: 'নবীন ভিজিটর',
    badgeType: 'normal',
    icon: 'target',
    descriptionEn: 'Start visiting web links to unlock your first badge.',
    descriptionBn: 'প্রথম ব্যাজ আনলক করতে লিঙ্ক ভিজিট করা শুরু করুন।',
    colorClass: 'text-zinc-400',
    bgClass: 'bg-zinc-800/60',
    borderClass: 'border-zinc-700/60',
  },
  {
    tier: 1,
    minPoints: 100,
    nameEn: 'Bronze Explorer',
    nameBn: 'ব্রোঞ্জ এক্সপ্লোরার (১০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'star',
    descriptionEn: 'Earned 100+ points by visiting 100 web links.',
    descriptionBn: '১০০টি ওয়েব লিঙ্ক সফলভাবে ভিজিট করে ১০০ পয়েন্ট অর্জন করেছেন।',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
  },
  {
    tier: 2,
    minPoints: 200,
    nameEn: 'Silver Voyager',
    nameBn: 'সিলভার ভয়েজার (২০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'shield',
    descriptionEn: 'Earned 200+ points from successful 15s visits.',
    descriptionBn: '২০০টি সফল ১৫ সেকেন্ড লিঙ্ক ভিজিট থেকে ২০০ পয়েন্ট অর্জন করেছেন।',
    colorClass: 'text-slate-300',
    bgClass: 'bg-slate-400/15',
    borderClass: 'border-slate-300/40',
  },
  {
    tier: 3,
    minPoints: 300,
    nameEn: 'Gold Pioneer',
    nameBn: 'গোল্ড পাইওনিয়ার (৩০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'medal',
    descriptionEn: '300 points earned across web traffic exchanges.',
    descriptionBn: 'ওয়েব ট্রাফিক এক্সচেঞ্জে ৩০০ পয়েন্ট অর্জন করেছেন।',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/15',
    borderClass: 'border-yellow-400/40',
  },
  {
    tier: 4,
    minPoints: 400,
    nameEn: 'Platinum Surfer',
    nameBn: 'প্লাটিনাম সার্ফার (৪০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'flame',
    descriptionEn: '400+ points milestones reached on profile.',
    descriptionBn: '৪০০+ পয়েন্ট অর্জনের মাইলফলক স্পর্শ করেছেন।',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/15',
    borderClass: 'border-cyan-400/40',
  },
  {
    tier: 5,
    minPoints: 500,
    nameEn: 'Ruby Scout',
    nameBn: 'রুবি স্কাউট (৫০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'gem',
    descriptionEn: 'Halfway to Verified! 500 points completed.',
    descriptionBn: 'ভেরিফায়েড অর্জনের অর্ধেক পথ! ৫০০ পয়েন্ট পূর্ণ।',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-400/40',
  },
  {
    tier: 6,
    minPoints: 600,
    nameEn: 'Emerald Master',
    nameBn: 'এমেরাল্ড মাস্টার (৬০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'sparkles',
    descriptionEn: '600+ web traffic points earned.',
    descriptionBn: '৬০০+ ওয়েব ট্রাফিক পয়েন্ট সফলভাবে অর্জিত।',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-400/40',
  },
  {
    tier: 7,
    minPoints: 700,
    nameEn: 'Sapphire Ace',
    nameBn: 'স্যাফায়ার এস (৭০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'zap',
    descriptionEn: '700 points verified traffic exchanged.',
    descriptionBn: '৭০০ পয়েন্ট ভেরিফায়েড ট্রাফিক সম্পন্ন করেছেন।',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15',
    borderClass: 'border-blue-400/40',
  },
  {
    tier: 8,
    minPoints: 800,
    nameEn: 'Diamond Elite',
    nameBn: 'ডায়মন্ড এলিট (৮০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'shield-check',
    descriptionEn: '800 points completed, almost at Verified Partner.',
    descriptionBn: '৮০০ পয়েন্ট সম্পন্ন, আজীবন ভেরিফায়েড ব্যাজের খুব কাছে।',
    colorClass: 'text-indigo-300',
    bgClass: 'bg-indigo-500/15',
    borderClass: 'border-indigo-400/40',
  },
  {
    tier: 9,
    minPoints: 900,
    nameEn: 'Grandmaster Champion',
    nameBn: 'গ্র্যান্ডমাস্টার চ্যাম্পিয়ন (৯০০ পয়েন্ট)',
    badgeType: 'normal',
    icon: 'crown',
    descriptionEn: '900 points reached. Only 100 more to Lifetime YouTube-style Verified!',
    descriptionBn: '৯০০ পয়েন্ট পূর্ণ। আর মাত্র ১০০ পয়েন্ট হলে আজীবন ভেরিফায়েড ব্যাজ!',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-400/40',
  },
  {
    tier: 10,
    minPoints: 1000,
    nameEn: 'Official Verified Partner',
    nameBn: 'অফিসিয়াল ভেরিফাইড পার্টনার (১০০০+ পয়েন্ট)',
    badgeType: 'verified_partner',
    icon: 'youtube-verified',
    descriptionEn: 'Lifetime Official YouTube-style Verified Badge for 1,000+ points.',
    descriptionBn: '১০০০টি লিঙ্ক ভিজিট সম্পন্ন করে প্রাপ্ত আজীবন অফিসিয়াল ভেরিফায়েড টিক ব্যাজ।',
    colorClass: 'text-zinc-200',
    bgClass: 'bg-zinc-800',
    borderClass: 'border-zinc-500',
  },
];

export const getBadgeTier = (points: number): BadgeTier => {
  const pts = Math.max(0, points || 0);
  if (pts >= 1000) return BADGE_TIERS[10];
  if (pts >= 900) return BADGE_TIERS[9];
  if (pts >= 800) return BADGE_TIERS[8];
  if (pts >= 700) return BADGE_TIERS[7];
  if (pts >= 600) return BADGE_TIERS[6];
  if (pts >= 500) return BADGE_TIERS[5];
  if (pts >= 400) return BADGE_TIERS[4];
  if (pts >= 300) return BADGE_TIERS[3];
  if (pts >= 200) return BADGE_TIERS[2];
  if (pts >= 100) return BADGE_TIERS[1];
  return BADGE_TIERS[0];
};

/**
 * Unique Icon Component for Each Badge Tier
 */
export const BadgeTierIcon: React.FC<{ tier: number; className?: string }> = ({ tier, className = 'w-5 h-5' }) => {
  switch (tier) {
    case 1:
      // Tier 1: Bronze Explorer (100 pts) - Star
      return <Star className={className} />;
    case 2:
      // Tier 2: Silver Voyager (200 pts) - Shield
      return <Shield className={className} />;
    case 3:
      // Tier 3: Gold Pioneer (300 pts) - Medal
      return <Medal className={className} />;
    case 4:
      // Tier 4: Platinum Surfer (400 pts) - Flame
      return <Flame className={className} />;
    case 5:
      // Tier 5: Ruby Scout (500 pts) - Gem / Ruby Diamond
      return <Gem className={className} />;
    case 6:
      // Tier 6: Emerald Master (600 pts) - Sparkles
      return <Sparkles className={className} />;
    case 7:
      // Tier 7: Sapphire Ace (700 pts) - Zap Lightning
      return <Zap className={className} />;
    case 8:
      // Tier 8: Diamond Elite (800 pts) - ShieldCheck
      return <ShieldCheck className={className} />;
    case 9:
      // Tier 9: Grandmaster Champion (900 pts) - Crown
      return <Crown className={className} />;
    case 10:
      // Tier 10: Lifetime YouTube Official Verified Partner (1000+ pts) - YouTube Official SVG
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-label="Verified">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4-8 8z"
          />
        </svg>
      );
    default:
      // Tier 0: Novice Visitor - Target
      return <Target className={className} />;
  }
};

interface VerifiedBadgeProps {
  points?: number;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isBn?: boolean;
  onClick?: () => void;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  points = 0,
  isVerified = false,
  size = 'md',
  showLabel = false,
  isBn = false,
  onClick,
}) => {
  const currentBadge = getBadgeTier(points);
  const is1kVerified = isVerified || points >= 1000;

  // Icon sizing
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badgeWrapperClasses = {
    sm: 'p-0.5',
    md: 'p-1',
    lg: 'p-1.5',
  };

  // 1. YouTube-style Official Verified Badge (Tier 10, 1000+ points / Lifetime Verified)
  if (is1kVerified) {
    return (
      <div
        id="profile-verified-badge-official"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 ${onClick ? 'cursor-pointer group' : ''}`}
        title={isBn ? 'ভেরিফাইড' : 'Verified'}
      >
        {/* YouTube style clean round checkmark / pill checkmark */}
        <span className="relative flex items-center justify-center">
          <BadgeTierIcon tier={10} className={`${iconSizes[size]} text-zinc-400 group-hover:text-zinc-200 drop-shadow-sm transition-colors`} />
        </span>

        {showLabel && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isBn ? 'ভেরিফাইড' : 'Verified'}
          </span>
        )}
      </div>
    );
  }

  // 2. Tier 1 to 9 dynamic progressive badge (100, 200, 300 ... 900 points)
  if (currentBadge.tier > 0) {
    return (
      <div
        id={`profile-badge-tier-${currentBadge.tier}`}
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 ${onClick ? 'cursor-pointer group' : ''}`}
        title={
          isBn
            ? `${currentBadge.nameBn} — ${points}/1000 পয়েন্ট (১০০০ পয়েন্টে আজীবন ভেরিফায়েড ব্যাজ পাওয়া যাবে)`
            : `${currentBadge.nameEn} — ${points}/1,000 pts (1,000 pts unlocks YouTube-Style Lifetime Verified)`
        }
      >
        <div
          className={`rounded-full ${badgeWrapperClasses[size]} ${currentBadge.bgClass} border ${currentBadge.borderClass} ${currentBadge.colorClass} flex items-center justify-center shadow-xs transition-transform group-hover:scale-110`}
        >
          <BadgeTierIcon tier={currentBadge.tier} className={iconSizes[size]} />
        </div>

        {showLabel && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentBadge.bgClass} ${currentBadge.colorClass} border ${currentBadge.borderClass}`}
          >
            {isBn ? `ব্যাজ ${currentBadge.tier}/১০` : `Badge ${currentBadge.tier}/10`}
          </span>
        )}
      </div>
    );
  }

  // Tier 0: Beginner Visitor
  return (
    <div
      id="profile-badge-tier-0"
      onClick={onClick}
      className={`inline-flex items-center gap-1 ${onClick ? 'cursor-pointer group' : ''}`}
      title={
        isBn
          ? `নবীন ভিজিটর — ${points}/১০০ পয়েন্ট অর্জন করলে প্রথম ব্রোঞ্জ ব্যাজ আনলক হবে (১০০০ পয়েন্টে আজীবন ভেরিফায়েড)`
          : `Novice Visitor — Reach 100 points for first badge (${points}/100 pts). 1,000 pts unlocks YouTube Verified!`
      }
    >
      <div className={`rounded-full ${badgeWrapperClasses[size]} bg-zinc-800/80 border border-zinc-700/60 text-zinc-500 flex items-center justify-center group-hover:text-zinc-400`}>
        <BadgeTierIcon tier={0} className={iconSizes[size]} />
      </div>
    </div>
  );
};
