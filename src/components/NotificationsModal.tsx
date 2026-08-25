import React from 'react';
import { X, Bell, Sparkles, Gift, Flame, Trophy } from 'lucide-react';
import { sound } from '../utils/sound';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  isBn: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  isBn,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      title: isBn ? '🎉 ডেইলি বোনাস তৈরি আছে!' : '🎉 Daily Bonus Ready!',
      desc: isBn ? 'আপনার আজকের ১০০ কয়েন এবং স্ট্রিক রিওয়ার্ড সংগ্রহ করুন।' : 'Claim your 100 daily coins & keep your streak alive.',
      time: isBn ? '১০ মিনিট আগে' : '10m ago',
      icon: Gift,
      color: 'text-amber-400',
    },
    {
      id: 'n2',
      title: isBn ? '🔥 ৫ দিনের স্ট্রিক সম্পূর্ণ!' : '🔥 5-Day Streak Active!',
      desc: isBn ? 'আপনি টানা ৫ দিন সক্রিয় আছেন। লেভেল আপের কাছাকাছি!' : 'You are on a 5-day streak! Extra XP unlocked.',
      time: isBn ? '১ ঘন্টা আগে' : '1h ago',
      icon: Flame,
      color: 'text-orange-400',
    },
    {
      id: 'n3',
      title: isBn ? '🏆 লাকি স্পিন চ্যালেঞ্জ' : '🏆 Lucky Spin Challenge',
      desc: isBn ? 'আজকের ফ্রি স্পিন ঘুরিয়ে ১০০০ কয়েন পর্যন্ত জিতুন!' : 'Spin the lucky wheel today to win up to 1000 coins.',
      time: isBn ? '৩ ঘন্টা আগে' : '3h ago',
      icon: Trophy,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1a1c23] border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-white space-y-4 max-h-[92dvh] sm:max-h-[88vh] my-auto overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              {isBn ? 'বিজ্ঞপ্তি সমূহ' : 'Notifications'}
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playClick(soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-zinc-400 hover:text-white transition-colors border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className="p-3.5 rounded-2xl bg-[#14161c] border border-zinc-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#242731] border border-zinc-700/50 mt-0.5">
                  <Icon className={`w-4 h-4 ${n.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white font-['Outfit']">{n.title}</h4>
                    <span className="text-[10px] text-zinc-500 font-medium">{n.time}</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{n.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            sound.playClick(soundEnabled);
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-[#242731] hover:bg-[#2e323e] border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          {isBn ? 'বন্ধ করুন' : 'Close'}
        </button>
      </div>
    </div>
  );
};
