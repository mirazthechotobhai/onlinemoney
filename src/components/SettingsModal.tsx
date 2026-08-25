import React, { useState } from 'react';
import { X, Settings, Volume2, VolumeX, Bell, Globe, Moon, Sun, User, Mail, Sparkles, Check, RotateCcw, Link2, ExternalLink, Flame, Info, Eye, LogOut, ShieldCheck, Download, FolderArchive, Loader2, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/sound';
import { User as FirebaseUser } from 'firebase/auth';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  currentUser?: FirebaseUser | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetData: () => void;
  onOpenAvatarPicker: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  onUpdateProfile,
  onResetData,
  onOpenAvatarPicker,
  onLogout,
}) => {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [email, setEmail] = useState(profile.email);
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled);
  const [language, setLanguage] = useState<'bn' | 'en'>(profile.language);
  const [promotedUrl, setPromotedUrl] = useState(profile.promotedUrl || '');
  const [promotedUrlTitle, setPromotedUrlTitle] = useState(profile.promotedUrlTitle || '');
  const [promotedUrlActive, setPromotedUrlActive] = useState(profile.promotedUrlActive ?? true);
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const isBn = language === 'bn';

  if (!isOpen) return null;

  const handleDownloadFullZip = async () => {
    setIsDownloadingZip(true);
    sound.playClick(soundEnabled);
    try {
      const link = document.createElement('a');
      link.href = '/profilerewards-main.zip';
      link.download = 'profilerewards-main.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      sound.playSuccess(soundEnabled);
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      username,
      bio,
      email,
      soundEnabled,
      notificationsEnabled,
      language,
      promotedUrl: promotedUrl.trim(),
      promotedUrlTitle: promotedUrlTitle.trim(),
      promotedUrlActive,
    });
    sound.playSuccess(soundEnabled);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1a1c23] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col text-white overflow-hidden max-h-[92dvh] sm:max-h-[88vh] my-auto">
        {/* Header with Gear Icon */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-[#14161c] border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shrink-0">
              <Settings className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                {isBn ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1">
                {isBn ? 'আপনার প্রোফাইল ও অ্যাপ সেটিংস কাস্টমাইজ করুন' : 'Manage your preferences and profile details'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick(soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-zinc-300 hover:text-white transition-colors border border-zinc-800 shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6 bg-[#0f1115]">
          {/* Avatar shortcut */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#14161c] border border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-400/40"
              />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {isBn ? 'প্রোফাইল ছবি' : 'Profile Avatar'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {isBn ? 'কাস্টম ছবি সিলেক্ট করুন' : 'Choose or upload custom avatar'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick(soundEnabled);
                onOpenAvatarPicker();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
            >
              {isBn ? 'ছবি বদলান' : 'Change'}
            </button>
          </div>

          {/* User Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                {isBn ? 'পুরো নাম (Display Name)' : 'Display Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-sm focus:outline-hidden focus:border-amber-400 transition-colors"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                {isBn ? 'ইউজারনেম (Username)' : 'Username Handle'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-sm focus:outline-hidden focus:border-amber-400 font-mono transition-colors"
                  placeholder="@username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                {isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-sm focus:outline-hidden focus:border-amber-400 transition-colors"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                {isBn ? 'বায়ো / স্ট্যাটাস (Bio)' : 'Bio / Status'}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-sm focus:outline-hidden focus:border-amber-400 transition-colors resize-none"
                placeholder="Tell something about yourself..."
              />
            </div>
          </div>

          {/* Promotional URL & Traffic Exchange Section (User Requested Feature) */}
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    {isBn ? 'প্রমোশনাল লিংক ও ট্র্যাফিক এক্সচেঞ্জ' : 'Promote Your Website / URL'}
                  </h4>
                  <span className="text-[10px] text-amber-400 font-medium">
                    {isBn ? '১৫ সেকেন্ড ভিজিট = ১ পয়েন্ট এক্সচেঞ্জ' : '15s Visit = 1 Point Traffic Exchange'}
                  </span>
                </div>
              </div>

              {/* Toggle switch for promo link */}
              <button
                type="button"
                onClick={() => setPromotedUrlActive(!promotedUrlActive)}
                className={`w-11 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  promotedUrlActive ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
                title={isBn ? 'প্রমোশন চালু/বন্ধ করুন' : 'Enable/Disable Promotion'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    promotedUrlActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-[#14161c] border border-amber-500/20 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed">
                  {isBn
                    ? 'আপনার লিংক এখানে সেভ করুন। অন্য ব্যবহারকারী যখন এই লিংক ওপেন করে ১৫ সেকেন্ড ব্রাউজ করবেন, তখন তিনি ১ পয়েন্ট আয় করবেন এবং আপনার ব্যালেন্স থেকে ১ পয়েন্ট কমে যাবে।'
                    : 'Add your URL here. When other users open and view this link for 15 seconds, they will earn 1 point, and 1 point will be deducted from your coin balance.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-zinc-400 border-t border-zinc-800">
                <span>{isBn ? 'আপনার বর্তমান ব্যালেন্স:' : 'Your Available Balance:'}</span>
                <span className="font-bold text-amber-400">
                  {profile.balance} {isBn ? 'পয়েন্ট (ভিজিট সাপোর্ট)' : 'Points'}
                </span>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>{isBn ? 'ওয়েবসাইট / লিংক URL' : 'Website / Promotion URL'}</span>
                  {promotedUrl && (
                    <a
                      href={promotedUrl.startsWith('http') ? promotedUrl : `https://${promotedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> {isBn ? 'টেস্ট ওপেন' : 'Test Open'}
                    </a>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={promotedUrl}
                    onChange={(e) => setPromotedUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-sm focus:outline-hidden focus:border-amber-400 transition-colors font-mono text-xs"
                    placeholder="https://yourwebsite.com or https://youtube.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  {isBn ? 'লিংকের নাম বা টাইটেল (Title)' : 'Link Title / Description'}
                </label>
                <input
                  type="text"
                  value={promotedUrlTitle}
                  onChange={(e) => setPromotedUrlTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-sm focus:outline-hidden focus:border-amber-400 transition-colors"
                  placeholder={isBn ? 'যেমন: আমার ইউটিউব চ্যানেল / পোর্টফোলিও' : 'e.g. My YouTube Channel / Portfolio'}
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {isBn ? 'অ্যাপ সেটিংস' : 'App Preferences'}
            </h4>

            {/* Language Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#14161c] border border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  {isBn ? 'ভাষা (Language)' : 'Language'}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#0f1115] p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'bn' ? 'bg-amber-500 text-black shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'en' ? 'bg-amber-500 text-black shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Sound FX Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#14161c] border border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                )}
                <span className="text-xs font-semibold text-zinc-200">
                  {isBn ? 'সাউন্ড ইফেক্ট (Sound FX)' : 'Sound Effects'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                  soundEnabled ? 'bg-emerald-500' : 'bg-[#242731]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#14161c] border border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  {isBn ? 'ডেইলি রিমাইন্ডার ও নোটিফিকেশন' : 'Daily Streak Reminders'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                  notificationsEnabled ? 'bg-amber-500' : 'bg-[#242731]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Account & Firebase Authentication Section */}
          <div className="p-4 rounded-2xl bg-[#14161c] border border-zinc-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  {isBn ? 'অ্যাকাউন্ট ও ফায়ারবেস অথেনটিকেশন' : 'Account & Firebase Auth'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {currentUser?.email || profile.email ? (isBn ? 'সংযুক্ত' : 'Connected') : (isBn ? 'গেস্ট' : 'Guest')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 bg-[#1a1c23] p-2.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 truncate pr-2">
                <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate font-mono text-zinc-300 text-[11px]">
                  {currentUser?.email || profile.email || 'No email attached'}
                </span>
              </div>
              {currentUser?.uid && (
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                  UID: {currentUser.uid.slice(0, 6)}...
                </span>
              )}
            </div>

            {/* Logout button */}
            {onLogout && (
              <button
                id="btn-logout-settings"
                type="button"
                onClick={() => {
                  sound.playClick(soundEnabled);
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-98 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>{isBn ? 'অ্যাকাউন্ট থেকে লগআউট করুন (Log Out)' : 'Sign Out / Log Out'}</span>
              </button>
            )}
          </div>

          {/* Export Full Project ZIP Button & Android App Information */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#1a1c23] to-[#161822] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <FolderArchive className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-['Outfit']">
                  {isBn ? 'সম্পূর্ণ ওয়েবসাইট ও অ্যান্ড্রয়েড প্রজেক্ট জিপ' : 'Download Web & Android Project (.ZIP)'}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isBn
                    ? 'GitHub, Android Studio (APK তৈরি) বা লোকাল মেশিনে রান করার জন্য সব ফাইল ডাউনলোড করুন।'
                    : 'Download complete source code with native Android Studio Capacitor project included.'}
                </p>
              </div>
            </div>

            <button
              id="btn-download-project-zip"
              type="button"
              onClick={handleDownloadFullZip}
              disabled={isDownloadingZip}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95 shrink-0 uppercase tracking-wider"
            >
              {isDownloadingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{isBn ? 'জিপ তৈরি হচ্ছে...' : 'Zipping...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-black" />
                  <span>{isBn ? 'ZIP ডাউনলোড' : 'Export ZIP'}</span>
                </>
              )}
            </button>
          </div>

          {/* Android App Ready Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#1a1c23] to-[#161822] border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white font-['Outfit']">
                    {isBn ? 'অ্যান্ড্রয়েড অ্যাপ (Capacitor Android)' : 'Android App Ready (Capacitor)'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    {isBn ? 'প্রস্তুত' : 'NATIVE READY'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isBn
                    ? 'Android Studio-তে `android` ফোল্ডার ওপেন করে সরাসরি APK এবং AAB রিলিজ তৈরি করতে পারবেন।'
                    : 'Open the `android/` directory in Android Studio to build & run your production APK.'}
                </p>
              </div>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                sound.playClick(soundEnabled);
                onResetData();
                onClose();
              }}
              className="w-full py-2.5 text-xs text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/40 rounded-xl transition-colors border border-zinc-800/80 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span>{isBn ? 'ডাটা ডিফল্টে রিসেট করুন (Reset Data)' : 'Reset Data to Default'}</span>
            </button>
          </div>

          {/* Save Action */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playClick(soundEnabled);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-xs font-bold text-zinc-300 transition-colors cursor-pointer border border-zinc-800"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-black shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              {isSaved ? <Check className="w-4 h-4 text-black" /> : <Sparkles className="w-4 h-4 text-black" />}
              <span>{isSaved ? (isBn ? 'সংরক্ষিত!' : 'Saved!') : isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
