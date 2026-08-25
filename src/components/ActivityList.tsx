import React from 'react';
import { History, Coins, Gem, ArrowDownLeft, Gift, Disc, Sparkles } from 'lucide-react';
import { ActivityItem } from '../types';

interface ActivityListProps {
  activities: ActivityItem[];
  isBn: boolean;
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities, isBn }) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'spin':
        return <Disc className="w-4 h-4 text-purple-400" />;
      case 'scratch':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'bonus':
        return <Gift className="w-4 h-4 text-amber-400" />;
      default:
        return <Coins className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full rounded-3xl bg-[#1a1c23] border border-zinc-800/80 p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <History className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-white font-['Outfit']">
            {isBn ? 'সাম্প্রতিক আর্নিং হিস্টোরি' : 'Recent Earning Activity'}
          </h3>
        </div>
        <span className="text-xs text-zinc-400 font-medium tracking-wide">
          {isBn ? 'সর্বশেষ রেকর্ড' : 'Latest records'}
        </span>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            {isBn ? 'এখনো কোনো কার্যক্রম নেই' : 'No recent activity yet'}
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#242731] border border-zinc-700/50">
                  {getIcon(act.category)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {isBn ? act.titleBn || act.title : act.title}
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    {act.timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-bold text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <span>+{act.amount}</span>
                {act.type === 'coins' ? (
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Gem className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
