# ProfileRewards - Web & Android App (Capacitor)

ProfileRewards is a complete Web & Native Android Application built with React, TypeScript, Tailwind CSS, Capacitor 8, and Firebase Firestore/Auth.

---

## 📱 Android App (How to build APK / AAB)

This repository includes a full native **Android Studio** project in the `android/` directory configured with Capacitor.

### Prerequisites
- [Android Studio](https://developer.android.com/studio) installed on your computer
- Node.js (v18+) & npm

### Steps to Build Android APK:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build Web Assets & Sync with Android**:
   ```bash
   npm run cap:sync
   ```

3. **Open Project in Android Studio**:
   ```bash
   npx cap open android
   ```
   *(Or simply launch Android Studio and select "Open" -> choose the `android/` directory from this project).*

4. **Build APK in Android Studio**:
   - In Android Studio, go to the top menu: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - Once completed, click **locate** to get the compiled `.apk` file to install on any Android phone!
   - For Google Play Store release: select **Build** > **Generate Signed Bundle / APK** -> **Android App Bundle (.aab)**.

---

## 💻 Web Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite Dev Server
npm run dev
```

---

## 📦 GitHub Deployment

```bash
git init
git add .
git commit -m "Complete Web & Android App with Capacitor"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```
