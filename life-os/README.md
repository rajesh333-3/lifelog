# Life Log

> *Capture today. Understand yesterday. Shape tomorrow.*  
> Write your story, one day at a time.

Life Log is a private, offline-first personal life-tracking PWA. Every piece of data lives on your device — no accounts, no servers, no cloud.

**Live app:** https://exquisite-maamoul-fbc403.netlify.app

---

## What's in v1

### Life Grid
Your entire life visualised as a grid of weeks. Each dot is one week — lived weeks fill with colour based on how you logged them. Tap any dot to open that week's log or revisit the past.

### Daily Log
Log each day across three pillars (Physical, Mental, Work) with 0–100 sliders. Add a reflection, a voice journal entry, and mark life events. Auto-saves as you type.

### Habits
Track daily habits per pillar. Toggle them done each day — streaks and consistency tracked automatically.

### Eisenhower Task Matrix
Drag tasks into four quadrants: Do Now, Schedule, Delegate, Drop. Tasks float forward every day until you close them — nothing falls through the cracks.

### Insights
Pillar trend charts over 7, 30, or 90 days. Streaks, best days, and an AI-generated weekly narrative (requires AI configuration in Settings).

### Calendar Picker
Tap the date button in the header to open a month calendar. Hover the life grid to highlight that week in the calendar live.

### AI Integration
Connect Ollama (local) or Gemini (cloud) in Settings → AI to unlock the weekly narrative. The app works fully without AI — it is entirely optional.

### Welcome Tour
A 6-slide onboarding tour shown on first launch. Replay anytime via Settings → Tour.

### PWA / Installable
Installable from the browser on iOS (Safari → Add to Home Screen) and Android (Chrome → Install app). Works fully offline after first load.

---

## Pending — Next Release

These features are visible in the UI but not yet active. A notice is shown in the app when you try to use them.

| Feature | Status | Notes |
|---|---|---|
| **Push Notifications** | Coming next release | Reminder times can be set in Settings → Reminders but no notifications fire yet. Web Push + service worker integration pending. |
| **Data Export & Import** | Coming next release | All data lives in IndexedDB on-device. Until export is implemented, clearing browser storage or uninstalling the app will erase all data permanently. **Back up your device regularly in the meantime.** |
| **Native App (Android)** | Android done ✓ | APK builds and installs on device. See [Android Deployment](#android-deployment) below. |
| **Native App (iOS)** | Coming next release | Capacitor is configured. Packaging to `.ipa` and App Store submission pending. |
| **Hobbies in Insights** | Coming next release | Hobby logs are tracked per day but not yet visualised in the Insights charts. |

---

## Tech stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Database | Dexie.js (IndexedDB) |
| State | Zustand |
| Charts | Recharts |
| Drag & drop | @dnd-kit/core |
| PWA | vite-plugin-pwa + Workbox |
| Native | Capacitor (iOS + Android) |
| Fonts | Outfit + Inter (Google Fonts) |

---

## Running locally

```bash
# Node 20+ required
nvm use 20

npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## Deploying

Drag the `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop) for a one-click deploy.

Or serve with any static host — the app is entirely client-side.

---

## Android Deployment

### Prerequisites

- Android Studio (latest) with the `android/` project open
- Node 20+ and the project dependencies installed (`npm install`)
- A physical Android device or emulator (API 23+)

### 1 — Build the web assets

Every time you change the React source, rebuild before packaging:

```bash
npm run build
npx cap sync android
```

`cap sync` copies the `dist/` output into the Android project and updates any Capacitor plugins.

### 2 — Test on your device (debug build)

1. Connect your phone via USB and enable **Developer Options → USB Debugging**
2. In Android Studio click **Run ▶** (or press `Shift+F10`)
3. Select your device and wait ~30 s for the install

The debug APK is also available at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
You can share this file directly (WhatsApp, email, Google Drive). Recipients need to enable **Settings → Install unknown apps** on their phone.

### 3 — Share with friends via Play Console Internal Testing (recommended)

This gives friends a proper Play Store install link with no "unknown source" warnings.

1. **Create a Google Play Developer account** at [play.google.com/console](https://play.google.com/console) — one-time $25 USD fee.
2. **Generate a signed release build:**
   - In Android Studio: **Build → Generate Signed Bundle / APK**
   - Choose **Android App Bundle (.aab)** — Play Store requires this format
   - Create a keystore on first run (**keep the `.jks` file and passwords safe — losing it means you can never push updates**)
   - Build type: **release**
3. The `.aab` file is saved at:
   ```
   android/app/release/app-release.aab
   ```
4. **In Play Console:**
   - Create a new app → fill in the title and default language
   - Go to **Testing → Internal testing → Create new release**
   - Upload the `.aab` file
   - Under **Testers**, add your friends' Gmail addresses
   - Publish the release — it goes live in minutes (no review for internal track)
5. Share the opt-in link with friends — they install directly from the Play Store

### 4 — Publish publicly on the Play Store

1. Complete the store listing (description, screenshots — at least 2, feature graphic)
2. Fill in the content rating questionnaire
3. Add a privacy policy URL (required — can be a simple one-page site)
4. Move the release from Internal Testing to **Production**
5. Submit for review — initial review takes 1–3 days; updates are usually same-day

### Known build fix

If you see `Duplicate class kotlin.collections.jdk8` errors, the root `android/build.gradle` already contains the fix — it substitutes `kotlin-stdlib-jdk7/jdk8` with `kotlin-stdlib:1.8.22` to resolve the Kotlin 1.8+ class merge conflict.

---

## Data & privacy

- **All data is on your device.** Nothing is ever sent to a server.
- The only network requests are Google Fonts (loaded at startup) and optionally your AI provider (Ollama or Gemini) when generating narratives.
- Clearing browser data or uninstalling will permanently delete all logs. Export is coming in the next release — until then, keep regular device backups.

---

## Roadmap

- [ ] Push notification reminders
- [ ] JSON export & import (full backup/restore)
- [x] Android APK — builds and deploys to device
- [ ] Capacitor iOS packaging
- [ ] Hobbies in Insights charts
- [ ] iCloud / Google Drive sync (optional)
- [ ] Lock screen widget (native only)
- [ ] Shareable day card (single-day image export)
