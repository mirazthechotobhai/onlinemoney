import React from 'react';
import { Settings, Sparkles, Camera, Award, Flame, Bell, Cloud, LogOut } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/sound';
import { User as FirebaseUser } from 'firebase/auth';
import { VerifiedBadge } from './VerifiedBadge';

interface ProfileHeaderProps {
  profile: UserProfile;
  currentUser: FirebaseUser | null;
  onOpenSettings: () => void;
  onOpenAvatarPicker: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenBadges?: () => void;
  onLogout?: () => void;
  unreadCount?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  currentUser,
  onOpenSettings,
  onOpenAvatarPicker,
  onOpenNotifications,
  onOpenAuth,
  onOpenBadges,
  onLogout,
  unreadCount = 2,
}) => {
  const isBn = profile.language === 'bn';
  const visitedPoints = profile.totalVisitedCount || 0;
  const is1kVerified = profile.lifetimeVerified || visitedPoints >= 1000;

  return (
    <div id="profile-header-container" className="relative w-full rounded-3xl bg-[#1a1c23] p-4 sm:p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-zinc-800/80">
      {/* Ambient background glow inside header */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar with Settings Gear Icon & Firebase Sync button */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-5 sm:mb-6 relative z-10">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#242731] border border-zinc-700/50 text-zinc-300 shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {isBn ? `লেভেল ${profile.level}` : `Level ${profile.level}`}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            {profile.streakDays} {isBn ? 'দিনের স্ট্রিক' : 'Day Streak'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Firebase Cloud Sync / Auth button */}
          <button
            id="btn-firebase-auth-header"
            onClick={() => {
              sound.playClick(profile.soundEnabled);
              onOpenAuth();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
              currentUser
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title="Firebase Cloud Database"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden xs:inline font-mono">
              {currentUser ? (isBn ? 'ক্লাউড সিঙ্কড' : 'Firestore Synced') : isBn ? 'ফায়ারবেস লগইন' : 'Firebase Sync'}
            </span>
            {currentUser && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          {/* Notification Button */}
          <button
            id="btn-notifications-header"
            onClick={() => {
              sound.playClick(profile.soundEnabled);
              onOpenNotifications();
            }}
            className="relative p-2.5 rounded-2xl bg-[#242731] hover:bg-[#2e323e] active:scale-95 transition-all text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 shadow-md cursor-pointer"
            title={isBn ? 'বিজ্ঞপ্তি' : 'Notifications'}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#1a1c23] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Settings Gear Icon (User Requested) */}
          <button
            id="btn-settings-header"
            onClick={() => {
              sound.playClick(profile.soundEnabled);
              onOpenSettings();
            }}
            className="group relative p-2.5 rounded-2xl bg-[#242731] hover:bg-[#2e323e] active:scale-95 transition-all text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-zinc-700 shadow-md cursor-pointer"
            title={isBn ? 'সেটিংস' : 'Settings'}
            aria-label="Settings Gear Icon"
          >
            <Settings className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90 text-amber-400 group-hover:text-amber-300" />
            <span className="sr-only">Settings</span>
          </button>

          {/* Quick Logout Button */}
          {onLogout && (
            <button
              id="btn-logout-header"
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                onLogout();
              }}
              className="group relative p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all text-rose-400 hover:text-rose-300 border border-rose-500/30 shadow-md cursor-pointer"
              title={isBn ? 'লগআউট' : 'Sign Out'}
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              <span className="sr-only">Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Info Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
        {/* Profile Image with avatar change overlay */}
        <div className="relative group">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-amber-500/80 via-zinc-700 to-amber-400/40 shadow-2xl ring-4 ring-amber-500/10">
            <img
              id="profile-avatar-image"
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[22px] bg-[#0f1115]"
            />
            {/* Quick avatar edit trigger */}
            <button
              id="btn-change-avatar"
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                onOpenAvatarPicker();
              }}
              className="absolute inset-1 rounded-[22px] bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-medium backdrop-blur-xs"
              title={isBn ? 'ছবি পরিবর্তন করুন' : 'Change Avatar'}
            >
              <Camera className="w-6 h-6 text-amber-400" />
              <span>{isBn ? 'ছবি বদলান' : 'Change'}</span>
            </button>
          </div>

          {/* Online / VIP Status pip */}
          <div className="absolute -bottom-1 -right-1 p-1 bg-[#1a1c23] rounded-full">
            <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#1a1c23] flex items-center justify-center shadow-sm" title="Online & Active">
              <Sparkles className="w-2.5 h-2.5 text-black" />
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 id="user-display-name" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Outfit']">
              {profile.name}
            </h1>
            
            {/* Dynamic 10-tier Verified Badge & YouTube-style 1k Official Verified Badge */}
            <VerifiedBadge
              points={visitedPoints}
              isVerified={is1kVerified}
              size="md"
              showLabel={true}
              isBn={isBn}
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                if (onOpenBadges) onOpenBadges();
              }}
            />
          </div>

          <p id="user-username-handle" className="text-sm font-medium text-zinc-400 mb-3 flex items-center justify-center sm:justify-start gap-2">
            <span className="text-amber-400/90 font-mono">{profile.username}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 text-xs">{profile.email}</span>
          </p>

          <p id="user-bio-text" className="text-sm text-zinc-300 leading-relaxed max-w-xl mb-3">
            {profile.bio}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/60" />
              <span>{profile.joinedDate}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                if (onOpenBadges) onOpenBadges();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#242731] hover:bg-[#2e323e] border border-zinc-700/60 text-[11px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Award className="w-3 h-3" />
              <span>
                {is1kVerified
                  ? isBn
                    ? 'আজীবন ভেরিফাইড পার্টনার'
                    : 'Lifetime Verified'
                  : isBn
                  ? `ভিজিট পয়েন্ট: ${visitedPoints}/১০০০`
                  : `Visit Points: ${visitedPoints}/1,000`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
