/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, EarnTask, ActivityItem, PromotedLink } from './types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_TASKS,
  INITIAL_ACTIVITIES,
  INITIAL_PROMOTED_LINKS,
} from './data/initialData';
import { ProfileHeader } from './components/ProfileHeader';
import { BalanceCard } from './components/BalanceCard';
import { EarnModal } from './components/EarnModal';
import { SettingsModal } from './components/SettingsModal';
import { AvatarPickerModal } from './components/AvatarPickerModal';
import { WithdrawModal } from './components/WithdrawModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { WebVisitModal } from './components/WebVisitModal';
import { BadgesModal } from './components/BadgesModal';
import { ActivityList } from './components/ActivityList';
import { sound } from './utils/sound';
import confetti from 'canvas-confetti';
import { Sparkles, Zap, Trophy, ShieldCheck, Heart, Cloud, Globe } from 'lucide-react';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  signOut,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
  getRedirectResult,
} from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Local storage loaded state with fallbacks
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('app_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USER_PROFILE;
  });

  const [tasks, setTasks] = useState<EarnTask[]>(() => {
    try {
      const saved = localStorage.getItem('app_user_tasks');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TASKS;
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem('app_user_activities');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ACTIVITIES;
  });

  const [promotedLinks, setPromotedLinks] = useState<PromotedLink[]>(() => {
    try {
      const saved = localStorage.getItem('app_promoted_links');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => item && !item.id?.startsWith('link_demo_'));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Modal visibility states
  const [isEarnOpen, setIsEarnOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWebVisitOpen, setIsWebVisitOpen] = useState(false);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);

  // Quick toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Validate Firestore connection on boot (Mandated by Firebase skill) & check redirect auth
  useEffect(() => {
    testFirestoreConnection();
    // Catch Google Sign In redirect result if redirect flow was triggered on GitHub or mobile
    getRedirectResult(auth).catch((err) => {
      console.warn('Redirect auth result check:', err?.message);
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthChecked(true);

      if (user) {
        // Connected to Firebase! Try to fetch or create user document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const isAdmin = user.email?.toLowerCase() === 'mirazthechotobhai@gmail.com';

        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const updatedProfile: UserProfile = {
              ...data,
              lifetimeVerified: isAdmin ? true : (data.lifetimeVerified || (data.totalVisitedCount || 0) >= 1000),
              totalVisitedCount: isAdmin ? Math.max(data.totalVisitedCount || 0, 1000) : (data.totalVisitedCount || 0),
              username: isAdmin ? '@mirazthechotobhai' : data.username,
            };
            setProfile(updatedProfile);
            if (isAdmin && (!data.lifetimeVerified || (data.totalVisitedCount || 0) < 1000)) {
              setDoc(userDocRef, updatedProfile, { merge: true }).catch(() => {});
            }
          } else {
            // First time user: initialize their Firestore profile
            const initialDoc: UserProfile = {
              ...INITIAL_USER_PROFILE,
              name: user.displayName || user.email?.split('@')[0] || INITIAL_USER_PROFILE.name,
              email: user.email || INITIAL_USER_PROFILE.email,
              avatarUrl: user.photoURL || INITIAL_USER_PROFILE.avatarUrl,
              username: isAdmin ? '@mirazthechotobhai' : user.email ? `@${user.email.split('@')[0]}` : INITIAL_USER_PROFILE.username,
              lifetimeVerified: isAdmin ? true : false,
              totalVisitedCount: isAdmin ? 1000 : 0,
            };
            await setDoc(userDocRef, initialDoc);
            setProfile(initialDoc);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile((prev) => ({ ...prev, ...data }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time Firestore sync for Promoted Links
  useEffect(() => {
    try {
      const linksColRef = collection(db, 'promoted_links');
      const unsubscribe = onSnapshot(
        linksColRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: PromotedLink[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data && !doc.id.startsWith('link_demo_')) {
                list.push({ ...data, id: doc.id } as PromotedLink);
              }
            });
            setPromotedLinks(list);
          } else {
            setPromotedLinks([]);
          }
        },
        (error) => {
          // If Firestore permission or offline, we gracefully fallback to local state
          console.warn('Firestore promoted_links listener note:', error);
        }
      );
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  // Sync to Firestore helper
  const syncProfileToFirebase = useCallback(
    async (updatedProfile: UserProfile) => {
      if (!currentUser) return;
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, updatedProfile, { merge: true });

        // If user configured a promoted URL, sync to promoted_links collection with current Level & XP
        if (updatedProfile.promotedUrl) {
          const linkDocRef = doc(db, 'promoted_links', currentUser.uid);
          const linkData: PromotedLink = {
            id: currentUser.uid,
            userId: currentUser.uid,
            userName: updatedProfile.name,
            userAvatar: updatedProfile.avatarUrl,
            url: updatedProfile.promotedUrl,
            title: updatedProfile.promotedUrlTitle || `${updatedProfile.name}'s Website`,
            coinsAvailable: updatedProfile.balance,
            visitReward: 1,
            durationSeconds: 15,
            active: updatedProfile.promotedUrlActive ?? true,
            level: updatedProfile.level || 1,
            xp: updatedProfile.xp || 0,
            totalVisitedCount: updatedProfile.totalVisitedCount || 0,
            lifetimeVerified: updatedProfile.lifetimeVerified || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(linkDocRef, linkData, { merge: true });

          // Also update local promoted links state so UI reflects it immediately
          setPromotedLinks((prev) => {
            const exists = prev.some((l) => l.id === currentUser.uid);
            if (exists) {
              return prev.map((l) => (l.id === currentUser.uid ? { ...l, ...linkData } : l));
            }
            return [...prev, linkData];
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
      }
    },
    [currentUser]
  );

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_user_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('app_user_tasks', JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('app_user_activities', JSON.stringify(activities));
    } catch {
      // ignore
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem('app_promoted_links', JSON.stringify(promotedLinks));
    } catch {
      // ignore
    }
  }, [promotedLinks]);

  const isBn = profile.language === 'bn';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handler for when visitor earns 1 point after 15s
  const handleRewardVisitor = (
    amount: number,
    linkOwnerId: string,
    linkOwnerName: string,
    linkTitle: string
  ) => {
    handleAddReward(
      amount,
      'coins',
      isBn ? `${linkOwnerName} এর লিংক ভিজিট (${linkTitle})` : `Visited ${linkOwnerName}'s link (${linkTitle})`,
      'earn'
    );

    // Track total visited count for 10-tier badge and 1,000 pts Lifetime YouTube-style Verified badge
    setProfile((prev) => {
      const currentVisited = prev.totalVisitedCount || 0;
      const nextVisited = currentVisited + amount;
      const willBeLifetimeVerified = prev.lifetimeVerified || nextVisited >= 1000;

      // Celebrate 1000 points milestone if just unlocked
      if (!prev.lifetimeVerified && currentVisited < 1000 && nextVisited >= 1000) {
        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        showToast(
          isBn
            ? `🌟 অভিনন্দন! ১,০০০ পয়েন্ট পূর্ণ হয়েছে! আপনি পেয়েছেন অফিসিয়াল আজীবন ভেরিফাইড টিক ব্যাজ!`
            : `🌟 CONGRATULATIONS! 1,000 points reached! You unlocked Lifetime YouTube-style Verified Badge!`
        );
      } else if (Math.floor(nextVisited / 100) > Math.floor(currentVisited / 100) && nextVisited < 1000) {
        // Milestone reached at 100, 200, 300 etc.
        const tier = Math.floor(nextVisited / 100);
        showToast(
          isBn
            ? `🎖️ অভিনন্দন! আপনি নতুন ব্যাজ (টিয়ার ${tier}/১০) আনলক করেছেন!`
            : `🎖️ Level Up! You unlocked Badge Tier ${tier}/10!`
        );
      } else {
        showToast(
          isBn
            ? `🎉 ১৫ সেকেন্ড লিংক ভিজিট সফল! +${amount} পয়েন্ট যোগ হয়েছে!`
            : `🎉 15s Link visit successful! +${amount} point credited!`
        );
      }

      const updated = {
        ...prev,
        totalVisitedCount: nextVisited,
        lifetimeVerified: willBeLifetimeVerified,
      };
      syncProfileToFirebase(updated);
      return updated;
    });
  };

  // Handler for when owner is deducted 1 point for the visit
  const handleDeductOwner = (linkOwnerId: string, amount: number) => {
    // 1. Update local promoted links state
    setPromotedLinks((prev) =>
      prev.map((link) => {
        if (link.userId === linkOwnerId || link.id === linkOwnerId) {
          const newCoins = Math.max(0, link.coinsAvailable - amount);
          return {
            ...link,
            coinsAvailable: newCoins,
            active: newCoins > 0 ? link.active : false,
          };
        }
        return link;
      })
    );

    // 2. If visitor is self-testing their own link, also update profile
    if (currentUser && (currentUser.uid === linkOwnerId || profile.email === linkOwnerId)) {
      setProfile((prev) => {
        const next = { ...prev, balance: Math.max(0, prev.balance - amount) };
        syncProfileToFirebase(next);
        return next;
      });
    }

    // 3. Update Firestore link doc if exists
    if (db) {
      try {
        const linkDocRef = doc(db, 'promoted_links', linkOwnerId);
        getDoc(linkDocRef).then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as PromotedLink;
            const newCoins = Math.max(0, (data.coinsAvailable || 1) - amount);
            updateDoc(linkDocRef, {
              coinsAvailable: newCoins,
              active: newCoins > 0 ? (data.active ?? true) : false,
            }).catch(() => {});
          }
        });
      } catch {
        // ignore
      }
    }
  };

  // Add reward helper
  const handleAddReward = (
    amount: number,
    type: 'coins' | 'gems',
    sourceTitle: string,
    category: 'spin' | 'scratch' | 'earn' | 'bonus'
  ) => {
    let updatedProfileToSave: UserProfile | null = null;

    setProfile((prev) => {
      const newBalance = type === 'coins' ? prev.balance + amount : prev.balance;
      const newGems = type === 'gems' ? prev.gems + amount : prev.gems;
      const addedXp = type === 'coins' ? Math.round(amount * 0.4) : amount * 20;
      let newXp = prev.xp + addedXp;
      let newLevel = prev.level;
      let nextXp = prev.nextLevelXp;

      // Level-up logic
      if (newXp >= nextXp) {
        newLevel += 1;
        newXp = newXp - nextXp;
        nextXp = Math.round(nextXp * 1.3);
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        showToast(
          isBn
            ? `👑 লেভেল আপ! পয়েন্ট পেয়ে আপনি লেভেল ${newLevel}-এ উন্নীত হয়েছেন! আপনার প্রোফাইল এখন আরও উপরে থাকবে!`
            : `👑 Level UP! You reached Level ${newLevel}! Your profile is now boosted to the top!`
        );
      }

      const updated = {
        ...prev,
        balance: newBalance,
        gems: newGems,
        xp: newXp,
        level: newLevel,
        nextLevelXp: nextXp,
      };

      updatedProfileToSave = updated;
      return updated;
    });

    if (updatedProfileToSave) {
      syncProfileToFirebase(updatedProfileToSave);
    }

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: sourceTitle,
      titleBn: sourceTitle,
      amount,
      type,
      timestamp: 'Just now',
      category,
    };

    setActivities((prev) => [newActivity, ...prev.slice(0, 15)]);

    // Save activity to Firestore subcollection if logged in
    if (currentUser) {
      const actDocRef = doc(db, 'users', currentUser.uid, 'activities', newActivity.id);
      setDoc(actDocRef, { ...newActivity, userId: currentUser.uid }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/activities/${newActivity.id}`)
      );
    }
  };

  // Complete a task
  const handleCompleteTask = (taskId: string, reward: number, rewardType: 'coins' | 'gems') => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    const task = tasks.find((t) => t.id === taskId);
    const title = task ? (isBn ? task.titleBn : task.title) : 'Task Reward';
    handleAddReward(reward, rewardType, title, 'earn');
    showToast(
      isBn
        ? `+${reward} ${rewardType === 'coins' ? 'কয়েন' : 'জেমস'} যোগ হয়েছে!`
        : `+${reward} ${rewardType === 'coins' ? 'Coins' : 'Gems'} added to balance!`
    );

    // Save completed task to Firestore subcollection if logged in
    if (currentUser && task) {
      const taskDocRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      setDoc(taskDocRef, { ...task, completed: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/tasks/${taskId}`)
      );
    }
  };

  // Daily bonus claim
  const handleQuickDailyClaim = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (profile.lastClaimedDate === todayStr) {
      showToast(isBn ? 'আজকের ডেইলি বোনাস ইতোমধ্যে নেওয়া হয়েছে!' : 'Already claimed today\'s bonus!');
      return;
    }

    const rewardCoins = 100;
    const nextStreak = profile.streakDays + 1;

    setProfile((prev) => {
      const updated = {
        ...prev,
        streakDays: nextStreak,
        lastClaimedDate: todayStr,
      };
      syncProfileToFirebase(updated);
      return updated;
    });

    handleAddReward(
      rewardCoins,
      'coins',
      isBn ? `ডেইলি বোনাস (দিন ${nextStreak})` : `Daily Bonus (Day ${nextStreak})`,
      'bonus'
    );

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch {
      // ignore
    }

    showToast(
      isBn
        ? `🎁 দৈনিক বোনাস +${rewardCoins} কয়েন সফলভাবে যুক্ত হয়েছে!`
        : `🎁 Daily bonus +${rewardCoins} coins claimed!`
    );
  };

  // Withdraw simulation
  const handleWithdraw = (amountCoins: number, method: string) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        balance: Math.max(0, prev.balance - amountCoins),
      };
      syncProfileToFirebase(updated);
      return updated;
    });

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: `Withdrawal via ${method}`,
      titleBn: `${method} এর মাধ্যমে উইথড্র`,
      amount: amountCoins,
      type: 'coins',
      timestamp: 'Just now',
      category: 'earn',
    };
    setActivities((prev) => [newActivity, ...prev]);

    if (currentUser) {
      const actDocRef = doc(db, 'users', currentUser.uid, 'activities', newActivity.id);
      setDoc(actDocRef, { ...newActivity, userId: currentUser.uid }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/activities/${newActivity.id}`)
      );
    }
  };

  // Reset to initial data
  const handleResetData = () => {
    setProfile(INITIAL_USER_PROFILE);
    setTasks(INITIAL_TASKS);
    setActivities(INITIAL_ACTIVITIES);
    localStorage.removeItem('app_user_profile');
    localStorage.removeItem('app_user_tasks');
    localStorage.removeItem('app_user_activities');
    if (currentUser) {
      syncProfileToFirebase(INITIAL_USER_PROFILE);
    }
    showToast(isBn ? 'সব ডাটা সফলভাবে রিসেট হয়েছে।' : 'Demo data reset successfully.');
  };

  // Dedicated Logout Handler
  const handleLogout = async () => {
    try {
      sound.playClick(profile.soundEnabled);
      await signOut(auth);
      setCurrentUser(null);
      showToast(isBn ? 'লগআউট সম্পন্ন হয়েছে। সাইন ইন করুন।' : 'Signed out successfully.');
    } catch (err: any) {
      console.error('Logout error:', err);
      showToast(err.message || 'Logout failed');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const canClaimDaily = profile.lastClaimedDate !== todayStr;

  // 1. Loading screen while Firebase auth state is being resolved
  if (!authChecked) {
    return (
      <div className="min-h-screen w-full bg-[#0d0f14] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs sm:text-sm font-bold text-zinc-400 font-mono tracking-wider">
          {profile.language === 'bn' ? 'ফায়ারবেস ক্লাউড লোড হচ্ছে...' : 'Connecting to Firebase...'}
        </p>
      </div>
    );
  }

  // 2. Authentication Gate: If logged out, show dedicated Signup & Login Page
  if (!currentUser) {
    return (
      <AuthScreen
        soundEnabled={profile.soundEnabled}
        onSuccess={() => {
          showToast(isBn ? 'স্বাগতম! ড্যাশবোর্ডে প্রবেশ করেছেন।' : 'Welcome to your dashboard!');
        }}
      />
    );
  }

  return (
    <div className="min-h-full flex-1 w-full bg-[#0f1115] text-[#e0e0e0] flex flex-col selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Ambient background glows for Elegant Dark atmosphere */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Banner Toast */}
      {toastMessage && (
        <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300 max-w-[90vw]">
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#1a1c23] text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 border border-amber-500/40 shadow-amber-500/10">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4 fill-amber-400" />
            </span>
            <span className="tracking-wide line-clamp-2">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container with responsive padding */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 relative z-10">
        {/* Navigation Bar / App Title */}
        <header className="flex flex-wrap items-center justify-between gap-2 py-1 px-1">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-[#1a1c23] border border-zinc-800 text-amber-400 shadow-lg shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                Reward Profile
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight font-['Outfit']">
                {isBn ? 'ইউজার প্রোফাইল ড্যাশবোর্ড' : 'User Profile Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick(profile.soundEnabled);
                setIsAuthOpen(true);
              }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[#1a1c23] border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-500/40 transition-all shadow-sm cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-mono max-w-[140px] sm:max-w-[200px] truncate">
                {currentUser ? currentUser.email || 'Firebase User' : isBn ? 'ফায়ারবেস কানেক্ট' : 'Connect Firebase'}
              </span>
            </button>
          </div>
        </header>

        {/* 1. Profile Header (Profile Image + Name + Settings Gear Icon + Firebase Sync + Logout) */}
        <ProfileHeader
          profile={profile}
          currentUser={currentUser}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenBadges={() => setIsBadgesOpen(true)}
          onLogout={handleLogout}
          unreadCount={canClaimDaily ? 2 : 1}
        />

        {/* 2. Balance Overview & Prominent EARN Button */}
        <BalanceCard
          profile={profile}
          onOpenEarn={() => setIsEarnOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
          onOpenWebVisit={() => setIsWebVisitOpen(true)}
          onOpenBadges={() => setIsBadgesOpen(true)}
          onQuickDailyClaim={handleQuickDailyClaim}
          canClaimDaily={canClaimDaily}
        />

        {/* 3. Activity History */}
        <ActivityList activities={activities} isBn={isBn} />
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-zinc-500 border-t border-zinc-900 mt-auto relative z-10">
        <p className="flex items-center justify-center gap-1.5">
          <span>{isBn ? 'ফায়ারবেস ডাটাবেসে রিয়েল-টাইম সংরক্ষিত' : 'Realtime Synced to Firebase Firestore'}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-400 font-mono">go-to-freelance</span>
        </p>
      </footer>

      {/* Modals */}
      <EarnModal
        isOpen={isEarnOpen}
        onClose={() => setIsEarnOpen(false)}
        profile={profile}
        tasks={tasks}
        onClaimDaily={handleQuickDailyClaim}
        onCompleteTask={handleCompleteTask}
        onAddReward={handleAddReward}
        onOpenWebTraffic={() => {
          setIsEarnOpen(false);
          setIsWebVisitOpen(true);
        }}
      />

      <WebVisitModal
        isOpen={isWebVisitOpen}
        onClose={() => setIsWebVisitOpen(false)}
        profile={profile}
        promotedLinks={promotedLinks}
        currentUser={profile}
        links={promotedLinks}
        onRewardVisitor={handleRewardVisitor}
        onDeductOwner={handleDeductOwner}
        onOpenSettings={() => {
          setIsWebVisitOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenBadges={() => {
          setIsWebVisitOpen(false);
          setIsBadgesOpen(true);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateProfile={(updated) => {
          setProfile((prev) => {
            const next = { ...prev, ...updated };
            syncProfileToFirebase(next);
            return next;
          });
          showToast(isBn ? 'প্রোফাইল আপডেট হয়েছে!' : 'Profile updated successfully!');
        }}
        onResetData={handleResetData}
        onOpenAvatarPicker={() => {
          setIsSettingsOpen(false);
          setIsAvatarPickerOpen(true);
        }}
      />

      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatar={profile.avatarUrl}
        onSelectAvatar={(url) => {
          setProfile((prev) => {
            const next = { ...prev, avatarUrl: url };
            syncProfileToFirebase(next);
            return next;
          });
          showToast(isBn ? 'প্রোফাইল ছবি পরিবর্তন হয়েছে!' : 'Avatar changed!');
        }}
        soundEnabled={profile.soundEnabled}
        isBn={isBn}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={profile.balance}
        gems={profile.gems}
        onWithdraw={handleWithdraw}
        soundEnabled={profile.soundEnabled}
        isBn={isBn}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        soundEnabled={profile.soundEnabled}
        isBn={isBn}
      />

      <BadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        earnedPoints={profile.totalVisitedCount || 0}
        soundEnabled={profile.soundEnabled}
        isBn={isBn}
        onOpenWebVisit={() => {
          setIsBadgesOpen(false);
          setIsWebVisitOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        soundEnabled={profile.soundEnabled}
        isBn={isBn}
        onAuthSuccess={(email, displayName, photoURL) => {
          setProfile((prev) => {
            const updated = {
              ...prev,
              email: email || prev.email,
              name: displayName || prev.name,
              avatarUrl: photoURL || prev.avatarUrl,
            };
            syncProfileToFirebase(updated);
            return updated;
          });
        }}
      />
    </div>
  );
}

