import React, { useState } from 'react';
import { X, Sparkles, Disc, CalendarCheck, CheckCircle, Flame, Gift, ArrowRight, Zap, PlayCircle, Share2, Award, Coins, Gem, Globe, Link2, Timer, ExternalLink, Crown, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, EarnTask } from '../types';
import { sound } from '../utils/sound';

interface EarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  tasks: EarnTask[];
  onClaimDaily: () => void;
  onCompleteTask: (taskId: string, reward: number, rewardType: 'coins' | 'gems') => void;
  onAddReward: (amount: number, type: 'coins' | 'gems', sourceTitle: string, category: 'spin' | 'scratch' | 'earn') => void;
  onOpenWebTraffic?: () => void;
}

const DAILY_REWARDS_TABLE = [
  { day: 1, coins: 50, gems: 0 },
  { day: 2, coins: 100, gems: 0 },
  { day: 3, coins: 150, gems: 1 },
  { day: 4, coins: 200, gems: 0 },
  { day: 5, coins: 300, gems: 2 },
  { day: 6, coins: 450, gems: 3 },
  { day: 7, coins: 1000, gems: 10 },
];

const SPIN_PRIZES = [
  { label: '50 Coins', amount: 50, type: 'coins' as const, color: '#f59e0b', textColor: '#000' },
  { label: '100 Coins', amount: 100, type: 'coins' as const, color: '#3b82f6', textColor: '#fff' },
  { label: '2 Gems', amount: 2, type: 'gems' as const, color: '#06b6d4', textColor: '#000' },
  { label: '250 Coins', amount: 250, type: 'coins' as const, color: '#8b5cf6', textColor: '#fff' },
  { label: '500 Coins', amount: 500, type: 'coins' as const, color: '#10b981', textColor: '#fff' },
  { label: 'JACKPOT 1000', amount: 1000, type: 'coins' as const, color: '#ec4899', textColor: '#fff' },
  { label: '5 Gems', amount: 5, type: 'gems' as const, color: '#0284c7', textColor: '#fff' },
  { label: '150 Coins', amount: 150, type: 'coins' as const, color: '#f97316', textColor: '#fff' },
];

export const EarnModal: React.FC<EarnModalProps> = ({
  isOpen,
  onClose,
  profile,
  tasks,
  onClaimDaily,
  onCompleteTask,
  onAddReward,
  onOpenWebTraffic,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'traffic' | 'spin' | 'scratch' | 'daily'>('tasks');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinPrizeResult, setSpinPrizeResult] = useState<string | null>(null);

  // Scratch card state
  const [isScratched, setIsScratched] = useState(false);
  const [scratchReward, setScratchReward] = useState<{ amount: number; type: 'coins' | 'gems' }>({ amount: 250, type: 'coins' });
  const [scratchClaimed, setScratchClaimed] = useState(false);

  // Ad preview simulation state
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(5);

  const isBn = profile.language === 'bn';

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // ignore if confetti fails
    }
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinPrizeResult(null);
    sound.playClick(profile.soundEnabled);

    // Pick a random prize
    const randomIndex = Math.floor(Math.random() * SPIN_PRIZES.length);
    const selectedPrize = SPIN_PRIZES[randomIndex];
    const segmentAngle = 360 / SPIN_PRIZES.length;
    // Calculate final rotation so the pointer stops on the segment
    const extraRounds = 5 * 360;
    const targetAngle = extraRounds + (360 - (randomIndex * segmentAngle + segmentAngle / 2));

    setSpinRotation((prev) => prev + targetAngle);

    // Play ticking sounds
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      sound.playSpinTick(profile.soundEnabled);
      tickCount++;
      if (tickCount > 15) clearInterval(tickInterval);
    }, 180);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinPrizeResult(
        isBn
          ? `অভিনন্দন! আপনি জিতেছেন ${selectedPrize.amount} ${selectedPrize.type === 'coins' ? 'কয়েন' : 'জেমস'}!`
          : `Awesome! You won ${selectedPrize.amount} ${selectedPrize.type === 'coins' ? 'Coins' : 'Gems'}!`
      );
      sound.playSuccess(profile.soundEnabled);
      triggerConfetti();
      onAddReward(
        selectedPrize.amount,
        selectedPrize.type,
        isBn ? 'লাকি স্পিন পুরষ্কার' : 'Lucky Spin Prize',
        'spin'
      );
    }, 3200);
  };

  const handleScratchReveal = () => {
    if (isScratched || scratchClaimed) return;
    setIsScratched(true);
    setScratchClaimed(true);
    sound.playSuccess(profile.soundEnabled);
    triggerConfetti();
    onAddReward(
      scratchReward.amount,
      scratchReward.type,
      isBn ? 'স্ক্র্যাচ কার্ড পুরষ্কার' : 'Mystery Scratch Reward',
      'scratch'
    );
  };

  const resetScratchCard = () => {
    const randomCoins = [100, 150, 200, 300, 500][Math.floor(Math.random() * 5)];
    setScratchReward({ amount: randomCoins, type: 'coins' });
    setIsScratched(false);
    setScratchClaimed(false);
  };

  const handleWatchAd = (task: EarnTask) => {
    setIsWatchingAd(true);
    setAdTimer(5);
    sound.playClick(profile.soundEnabled);

    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWatchingAd(false);
          onCompleteTask(task.id, task.reward, task.rewardType);
          sound.playSuccess(profile.soundEnabled);
          triggerConfetti();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] my-auto bg-[#1a1c23] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-[#14161c] border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 font-['Outfit']">
                {isBn ? 'আর্নিং সেন্টার' : 'Earn Rewards Hub'}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1">
                {isBn ? 'টাস্ক সম্পন্ন করুন, স্পিন করুন এবং ফ্রিতে কয়েন জিতুন' : 'Complete tasks, spin & win free reward coins'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick(profile.soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-zinc-300 hover:text-white transition-colors border border-zinc-800 shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 sm:pt-3 border-b border-zinc-800/80 bg-[#14161c]/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks'
                ? 'border-amber-400 text-amber-400 bg-[#242731]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {isBn ? 'টাস্ক ও মিশন' : 'Tasks & Quests'}
          </button>

          <button
            onClick={() => setActiveTab('traffic')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'traffic'
                ? 'border-amber-400 text-amber-400 bg-[#242731]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>{isBn ? 'ওয়েব ট্র্যাফিক' : 'Web Traffic'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-mono">15s</span>
          </button>

          <button
            onClick={() => setActiveTab('spin')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'spin'
                ? 'border-amber-400 text-amber-400 bg-[#242731]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc className="w-4 h-4" />
            {isBn ? 'লাকি স্পিন' : 'Lucky Spin'}
          </button>

          <button
            onClick={() => setActiveTab('scratch')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'scratch'
                ? 'border-amber-400 text-amber-400 bg-[#242731]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isBn ? 'স্ক্র্যাচ কার্ড' : 'Scratch Card'}
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'daily'
                ? 'border-amber-400 text-amber-400 bg-[#242731]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            {isBn ? 'দৈনিক স্ট্রিক' : '7-Day Streak'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#0f1115]">
          {/* Level & Ranking Boost Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#1a1c23] to-[#161822] border border-amber-500/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 shadow-sm">
                  <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {isBn ? 'প্রোফাইল লেভেল ও র‍্যাংকিং বুস্ট' : 'Profile Level & Ranking Boost'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black font-mono">
                      {isBn ? `লেভেল ${profile.level}` : `LVL ${profile.level}`}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-['Outfit'] mt-0.5">
                    {isBn ? 'পয়েন্ট সংগ্রহ করে লেভেল বাড়ান এবং সবার উপরে থাকুন' : 'Earn points to level up and rank at the very top'}
                  </h3>
                </div>
              </div>

              {/* XP Progress indicator */}
              <div className="sm:text-right shrink-0 bg-black/30 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-zinc-800/80">
                <div className="text-[11px] text-zinc-400 font-mono flex items-center sm:justify-end gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{profile.xp}</span> / {profile.nextLevelXp} XP
                </div>
                <div className="w-full sm:w-36 h-2 bg-zinc-800 rounded-full overflow-hidden mt-1.5 border border-zinc-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, (profile.xp / Math.max(1, profile.nextLevelXp)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 mt-2.5 pt-2 border-t border-zinc-800/60 leading-relaxed">
              {isBn
                ? '💡 তথ্য: "আর্ন করুন" থেকে যেকোনো টাস্ক বা স্পিন থেকে প্রাপ্ত পয়েন্ট আপনার প্রোফাইল লেভেল বৃদ্ধি করে। যাঁর লেভেল যত বেশি, তাঁর ওয়েবসাইট লিঙ্ক তালিকায় সবার উপরে থাকবে!'
                : '💡 Info: Points and XP earned from tasks, spins, and activities directly increase your profile level. Higher-level profiles are ranked highest on the public list!'}
            </p>
          </div>

          {/* TAB 1: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#1a1c23] border border-zinc-800 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-sm text-white font-['Outfit']">
                    {isBn ? 'আজকের স্পেশাল চ্যালেঞ্জ' : 'Today\'s Special Challenge'}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {isBn ? 'সবগুলো টাস্ক শেষ করে মেগা বোনাস আনলক করুন' : 'Finish all tasks to unlock 500 bonus XP'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    {tasks.filter((t) => t.completed).length} / {tasks.length} {isBn ? 'সম্পন্ন' : 'Done'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      task.completed
                        ? 'bg-[#14161c] border-zinc-900 opacity-60'
                        : 'bg-[#1a1c23] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          task.completed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {task.completed ? <CheckCircle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {isBn ? task.titleBn : task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 font-mono">
                            +{task.reward} {task.rewardType === 'coins' ? (isBn ? 'কয়েন' : 'Coins') : (isBn ? 'জেমস' : 'Gems')}
                          </span>
                          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider bg-[#242731] px-2 py-0.5 rounded-md border border-zinc-800">
                            {task.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {task.completed ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {isBn ? 'ক্লেইমড' : 'Claimed'}
                        </span>
                      ) : task.id === 'task_watch_preview' ? (
                        <button
                          onClick={() => handleWatchAd(task)}
                          disabled={isWatchingAd}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" />
                          {isWatchingAd ? `${adTimer}s...` : isBn ? 'ভিডিও দেখুন' : 'Watch'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onCompleteTask(task.id, task.reward, task.rewardType);
                            sound.playSuccess(profile.soundEnabled);
                            triggerConfetti();
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                        >
                          <span>{isBn ? 'ক্লেইম করুন' : 'Claim'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: WEB TRAFFIC & 15S VISIT */}
          {activeTab === 'traffic' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171a22] to-[#1e2433] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shrink-0 mt-0.5">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white font-['Outfit'] flex items-center gap-2">
                      {isBn ? 'ওয়েব ট্র্যাফিক এক্সচেঞ্জ (১৫ সেকেন্ড)' : 'Web Traffic Exchange (15s)'}
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                        +1 Point / Visit
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {isBn
                        ? 'অন্য ইউজারদের ওয়েবসাইট বা লিংক ১৫ সেকেন্ড ভিজিট করে ১ পয়েন্ট আয় করুন। আপনার প্রোমোশনাল লিংক সেট করা থাকলে আপনার ব্যালেন্স থেকে ১ পয়েন্ট খরচ করে অন্য ইউজাররা আপনার লিংক ভিজিট করবে।'
                        : 'Visit community links for 15 seconds to earn 1 point. Link owner is charged 1 point as exchange fee.'}
                    </p>
                  </div>
                </div>

                {onOpenWebTraffic && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWebTraffic();
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0 uppercase tracking-wider"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{isBn ? 'ট্র্যাফিক হাব খুলুন' : 'Open Traffic Hub'}</span>
                  </button>
                )}
              </div>

              {/* Status information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#1a1c23] border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Timer className="w-4 h-4" />
                    <span>{isBn ? '১৫ সেকেন্ড রিয়েলটাইম টাইমার' : '15-Second Active Timer'}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isBn
                      ? 'ভিজিট শুরু হলে ১৫ সেকেন্ডের স্বয়ংক্রিয় কাউন্টডাউন শুরু হয়। সময় শেষ হলেই সাথে সাথে ১ পয়েন্ট যুক্ত হবে।'
                      : 'Automatic 15-second countdown validates the visit and instantly credits +1 point.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#1a1c23] border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Link2 className="w-4 h-4" />
                    <span>{isBn ? 'আপনার প্রোফাইল লিংক প্রমোশন' : 'Your Profile Promotion Link'}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {profile.promotedUrl ? (
                      <span className="font-mono text-zinc-300">{profile.promotedUrl}</span>
                    ) : (
                      isBn ? 'প্রোফাইল সেটিংসে আপনার নিজস্ব লিংক বসিয়ে সক্রিয় করুন।' : 'Set your own link in Profile Settings.'
                    )}
                  </p>
                </div>
              </div>

              {onOpenWebTraffic && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWebTraffic();
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#242731] hover:bg-[#2d313e] text-white text-xs font-bold border border-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>{isBn ? 'কমিউনিটি লিংকগুলো দেখতে ক্লিক করুন' : 'View Community Links & Start Earning'}</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SPIN WHEEL */}
          {activeTab === 'spin' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* Pointer indicator */}
                <div className="absolute -top-3 z-30 flex flex-col items-center">
                  <div className="w-5 h-7 bg-amber-400 clip-triangle shadow-lg rotate-180" />
                </div>

                {/* Rotating Wheel Container */}
                <div
                  className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-2xl overflow-hidden relative transition-transform duration-[3000ms] ease-out"
                  style={{
                    transform: `rotate(${spinRotation}deg)`,
                    background: 'conic-gradient(#f59e0b 0deg 45deg, #3b82f6 45deg 90deg, #06b6d4 90deg 135deg, #8b5cf6 135deg 180deg, #10b981 180deg 225deg, #ec4899 225deg 270deg, #0284c7 270deg 315deg, #f97316 315deg 360deg)',
                  }}
                >
                  {/* Wheel center pin */}
                  <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#0f1115] border-4 border-amber-400 flex items-center justify-center shadow-lg z-20">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>

              {spinPrizeResult && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold text-center animate-bounce text-sm shadow-md">
                  {spinPrizeResult}
                </div>
              )}

              <button
                onClick={handleSpinWheel}
                disabled={isSpinning}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-black font-black text-base shadow-[0_15px_30px_-8px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Disc className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? (isBn ? 'স্পিন হচ্ছে...' : 'Spinning...') : isBn ? 'এখনই স্পিন করুন!' : 'SPIN NOW!'}
              </button>
            </div>
          )}

          {/* TAB 3: SCRATCH CARD */}
          {activeTab === 'scratch' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <div className="text-center">
                <h4 className="font-bold text-base text-white font-['Outfit']">
                  {isBn ? 'লাকি স্ক্র্যাচ কার্ড' : 'Lucky Scratch Card'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {isBn ? 'কার্ডে ট্যাপ করুন লুকানো পুরষ্কার দেখতে' : 'Tap on the card below to reveal your surprise reward'}
                </p>
              </div>

              <div
                onClick={handleScratchReveal}
                className={`relative w-72 h-44 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${
                  isScratched
                    ? 'bg-[#1a1c23] border-amber-400 shadow-2xl scale-105'
                    : 'bg-[#14161c] border-dashed border-amber-400/60 hover:border-amber-400 hover:scale-102 shadow-xl'
                }`}
              >
                {isScratched ? (
                  <div className="text-center space-y-2 animate-in zoom-in-75 duration-300">
                    <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-spin" />
                    <h3 className="text-2xl font-black text-white font-['Outfit']">
                      +{scratchReward.amount} {scratchReward.type === 'coins' ? (isBn ? 'কয়েন!' : 'Coins!') : 'Gems!'}
                    </h3>
                    <p className="text-xs text-emerald-400 font-semibold">
                      {isBn ? '🎉 আপনার ওয়ালেটে যোগ হয়েছে!' : '🎉 Added to your wallet!'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mx-auto animate-pulse border border-amber-500/20">
                      <Gift className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                      {isBn ? 'ঘষতে ট্যাপ করুন 👆' : 'Tap to Scratch 👆'}
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      {isBn ? '৫০ থেকে ৫০০ কয়েন জেতার সুযোগ' : 'Win up to 500 Coins'}
                    </p>
                  </div>
                )}
              </div>

              {isScratched && (
                <button
                  onClick={resetScratchCard}
                  className="px-5 py-2.5 rounded-xl bg-[#242731] hover:bg-[#2e323e] border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
                >
                  {isBn ? 'আরেকটি কার্ড নিন' : 'Try Another Card'}
                </button>
              )}
            </div>
          )}

          {/* TAB 4: 7-DAY STREAK */}
          {activeTab === 'daily' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#1a1c23] border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white font-['Outfit']">
                      {profile.streakDays} {isBn ? 'দিনের ধারাবাহিক স্ট্রিক' : 'Days Current Streak'}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {isBn ? 'প্রতিদিন অ্যাপে এসে কয়েন ও জেমস দ্বিগুণ করুন' : 'Check in daily without breaking streak to earn mega gems'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DAILY_REWARDS_TABLE.map((item) => {
                  const isPast = item.day <= profile.streakDays;
                  const isCurrent = item.day === profile.streakDays;
                  return (
                    <div
                      key={item.day}
                      className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                          : isPast
                          ? 'bg-[#1a1c23] border-emerald-500/30 text-emerald-400'
                          : 'bg-[#14161c] border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="font-mono">Day {item.day}</span>
                        {isPast && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>

                      <div className="my-2">
                        <span className="text-base font-extrabold text-white block font-['Outfit']">
                          +{item.coins}
                        </span>
                        <span className="text-[10px] text-zinc-400 uppercase font-medium">
                          {isBn ? 'কয়েন' : 'Coins'}
                        </span>
                        {item.gems > 0 && (
                          <span className="text-[10px] font-bold text-cyan-400 block mt-0.5">
                            +{item.gems} Gems
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-bold mt-1">
                        {isPast ? (isBn ? 'ক্লেইমড' : 'Claimed') : (isBn ? 'লকড' : 'Locked')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#14161c] border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Coins className="w-4 h-4 text-amber-400" />
            {profile.balance.toLocaleString()} {isBn ? 'কয়েন ব্যালেন্স' : 'Coins Balance'}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <Gem className="w-4 h-4 text-cyan-400" />
            {profile.gems} {isBn ? 'জেমস' : 'Gems'}
          </span>
        </div>
      </div>
    </div>
  );
};
