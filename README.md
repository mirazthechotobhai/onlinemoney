# Web Remote Controller 📱 📺

An interactive real-time web remote controller and display system built with React, Vite, Tailwind CSS, and Firebase Firestore.

## Features
- **Deterministic Permanent Code**: 1 Gmail account = 1 permanent 6-character code (never changes).
- **Auto-Logout Sync**: Logging out from the remote automatically unlinks and resets the main screen in real time.
- **Top Header Code Input**: Sleek, distraction-free minimalist main screen canvas with code input in the header.
- **Full Touchpad & Keyboard**: Real-time cursor control, directional navigation, and live text synchronization.

---

## 1. Local Server-এ কীভাবে চালাবেন (Run Locally)

### পূর্বশর্ত (Prerequisites)
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm or yarn

### রান করার ধাপ (Steps to run):
```bash
# ১. গিটহাবে থেকে প্রজেক্ট ক্লোন বা ডাউনলোড করার পর ডিরেক্টরিতে যান:
cd web-remote-controller

# ২. ডিপেন্ডেন্সি ইন্সটল করুন:
npm install

# ৩. লোকাল ডেভেলপমেন্ট সার্ভার চালু করুন:
npm run dev
```

সার্ভার চালু হলে ব্রাউজারে ওপেন করুন:
- **মেইন স্ক্রিন (TV Screen)**: [http://localhost:3000](http://localhost:3000)
- **রিমোট কন্ট্রোল (Remote Control)**: [http://localhost:3000?view=remote](http://localhost:3000?view=remote) (অথবা মেইন স্ক্রিনের টপ-রাইটের **"Open Remote"** বাটনে ক্লিক করুন)

---

## 2. GitHub & Vercel-এ ডিপ্লয় করার নিয়ম (Deploy on Vercel)

১. গিটহাব রিপোজিটরিতে কোড পুশ করুন:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
২. [Vercel](https://vercel.com) এ লগইন করে **"Add New Project"** এ যান এবং আপনার GitHub রিপোজিটরি ইমপোর্ট করুন।
৩. Framework preset সিলেক্ট থাকবে: **Vite**
৪. Build Command: `npm run build`
৫. Output Directory: `dist`
৬. **Deploy** বাটনে ক্লিক করুন!

> **নোট**: `vercel.json` ফাইলটি ইতিমধ্যে যুক্ত করা আছে, তাই রিফ্রেশ করলেও কোনো 404 পেজ আসবে না।

---

## 3. Firebase "Unauthorized Domain" সমস্যার সমাধান (Fixing `auth/unauthorized-domain`)

আপনার Vercel ওয়েবসাইট: **`https://onlinemoney-theta.vercel.app/`**

### সমস্যা কেন হয়?
Firebase Authentication-এ নিরাপত্তার স্বার্থে অননুমোদিত কোনো ডোমেইনে Google Sign-In পপ-আপ ব্লক থাকে। আপনি যখন Vercel-এ হোস্ট করেছেন (`onlinemoney-theta.vercel.app`), তখন Firebase-এ একবার শুধু এই ডোমেনটি অনুমতি দিয়ে দিতে হয়। **একবার যোগ করলেই পৃথিবীর যেকোনো জায়গা থেকে যেকোনো পাবলিক ইউজার কোনো সমস্যা ছাড়াই গুগল দিয়ে লগইন করতে পারবে!**

### ১ মিনিটের সহজ সমাধান (Step-by-step Solution):
1. সরাসরি এই লিংকে যান: **[Firebase Authentication Settings (Project: oh-no-tv)](https://console.firebase.google.com/project/oh-no-tv/authentication/settings)**
2. নিচের দিকে **Authorized domains** সেকশনে যান।
3. **"Add domain"** বাটনে ক্লিক করুন।
4. লিখুন: `onlinemoney-theta.vercel.app` (এবং বাড়তি সুবিধার জন্য `*.vercel.app` ও দিতে পারেন)।
5. **Save / Add** বাটনে ক্লিক করুন।
6. ব্যস! এখন আপনার সাইটে পৃথিবীর যেকোনো পাবলিক ভিজিটর কোনো পপ-আপ ব্লকিং ছাড়াই সরাসরি Google Sign-In দিয়ে কানেক্ট করতে পারবে।

---

### ৪. পাবলিক ইউজারদের জন্য বিকল্প (No Popup / No Domain Constraint):
মোবাইল ফোনে (যেমন: Safari, Facebook In-App Browser, Messenger Browser) অনেক সময় ব্রাউজারের নিজস্ব সিকিউরিটির কারণে যেকোনো গুগলের পপ-আপ উইন্ডো ব্লক হয়ে যায়।
পাবলিক ইউজারদের যেন কোনো রকম ঝামেলা না হয়, সেজন্য রিমোট পেজে **"সরাসরি জিমেইল দিয়ে কানেক্ট করুন"** অপশন রাখা হয়েছে:
- যেকোনো ইউজার শুধু তার জিমেইল অ্যাড্রেস লিখবে (যেমন: `example@gmail.com`) এবং **Connect** চাপবে।
- স্বয়ংক্রিয়ভাবে তার সেই জিমেইলের বিপরীতে **স্থায়ী ৬ অক্ষরের কোড** তৈরি হবে এবং টিভি স্ক্রিনে লাইভ যুক্ত হয়ে যাবে!

---

## 4. Environment Variables (ঐচ্ছিক / Optional)
প্রজেক্টটিতে ইতিমধ্যে ডিফল্ট কনফিগারেশন সেট করা আছে। আপনি চাইলে আপনার নিজস্ব Firebase প্রজেক্ট যুক্ত করতে `.env.example` দেখে একটি `.env` ফাইল তৈরি করে নিচের ভ্যারিয়েবলগুলো দিতে পারেন:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_ID=your_firestore_database_id
```
