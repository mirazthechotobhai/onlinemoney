export interface UserProfile {
  id?: string;
  name: string;
  username: string;
  bio: string;
  email: string;
  avatarUrl: string;
  joinedDate: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  balance: number; // Coins
  gems: number;
  streakDays: number;
  lastClaimedDate: string | null;
  language: 'bn' | 'en';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  promotedUrl?: string;
  promotedUrlTitle?: string;
  promotedUrlActive?: boolean;
  totalVisitedCount?: number;
  lifetimeVerified?: boolean;
}

export interface PromotedLink {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  url: string;
  title: string;
  coinsAvailable: number;
  visitReward: number; // default 1
  durationSeconds: number; // default 15
  active: boolean;
  level?: number;
  xp?: number;
  totalVisitedCount?: number;
  lifetimeVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarnTask {
  id: string;
  title: string;
  titleBn: string;
  reward: number;
  rewardType: 'coins' | 'gems';
  icon: string;
  category: 'daily' | 'social' | 'quest';
  completed: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  titleBn: string;
  amount: number;
  type: 'coins' | 'gems';
  timestamp: string;
  category: 'earn' | 'bonus' | 'spin' | 'scratch';
}
