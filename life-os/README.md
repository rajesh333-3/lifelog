# Life Log

> *Capture today. Understand yesterday. Shape tomorrow.*  
> Write your story, one day at a time.

Life Log is a private, offline-first personal life-tracking PWA. Every piece of data lives on your device — no accounts, no servers, no cloud.

**Live app:** https://exquisite-maamoul-fbc403.netlify.app

---

## Use it right now — no install needed

The app is a PWA. You can install it on your home screen in seconds, no App Store required.

### iPhone / iPad (Safari)
1. Open **Safari** and go to https://exquisite-maamoul-fbc403.netlify.app
2. Tap the **Share** button (box with arrow at the bottom of the screen)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** — the app icon appears on your home screen
5. Open it from the home screen — it runs full-screen, works offline, and feels native

> Chrome on iOS does **not** support Add to Home Screen properly. Use Safari.

### Android (Chrome)
1. Open **Chrome** and go to https://exquisite-maamoul-fbc403.netlify.app
2. Tap the **three-dot menu** (top right)
3. Tap **Add to Home Screen** or **Install app**
4. Tap **Install** — the app installs like a native app
5. Open from your home screen — full-screen, offline-ready

> Samsung Internet also supports this. Firefox on Android does not.

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

---

## Pending — Next Release

These features are visible in the UI but not yet active. A notice is shown in the app when you try to use them.

| Feature | Status | Notes |
|---|---|---|
| **Push Notifications** | Coming next release | Reminder times can be set in Settings → Reminders but no notifications fire yet. Web Push + service worker integration pending. |
| **Data Export & Import** | Coming next release | All data lives in IndexedDB on-device. Until export is implemented, clearing browser storage or uninstalling the app will erase all data permanently. **Back up your device regularly in the meantime.** |
| **Native App (iOS / Android)** | In progress | Capacitor projects generated. Requires Xcode / Android Studio to build. See below. |
| **Hobbies in Insights** | Coming next release | Hobby logs are tracked per day but not yet visualised in the Insights charts. |

---

## Native app development (Capacitor)

The `ios/` and `android/` Capacitor projects are already generated in this repo.

### Prerequisites

**Android**
- [Android Studio](https://developer.android.com/studio) (includes the Android SDK and emulator)
- Java 17+ (Android Studio bundles it)

**iOS**
- Mac with [Xcode](https://apps.apple.com/app/xcode/id497799835) installed (free, App Store)
- CocoaPods — install via Homebrew:
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  brew install cocoapods
  ```
- Then add the iOS platform (one-time):
  ```bash
  npx cap add ios
  ```

### Run on device or simulator

```bash
# 1. Build the web app
npm run build

# 2. Push web assets to native projects
npx cap sync

# 3. Open in Android Studio
npx cap open android

# 4. Open in Xcode (requires iOS setup above)
npx cap open ios
```

In Android Studio: wait for Gradle sync → click **Run**. Select a device or emulator.  
In Xcode: select your target device → click **Run** (▶).

### Keeping native projects in sync

Any time you change code, rebuild and sync:
```bash
npm run build && npx cap sync
```

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
| Native | Capacitor 8 (iOS + Android) |
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

## Data & privacy

- **All data is on your device.** Nothing is ever sent to a server.
- The only network requests are Google Fonts (loaded at startup) and optionally your AI provider (Ollama or Gemini) when generating narratives.
- Clearing browser data or uninstalling will permanently delete all logs. Export is coming in the next release — until then, keep regular device backups.

---

## Roadmap

- [ ] Push notification reminders
- [ ] JSON export & import (full backup/restore)
- [ ] Capacitor iOS + Android packaging → App Store / Play Store
- [ ] Hobbies in Insights charts
- [ ] iCloud / Google Drive sync (optional)
- [ ] Lock screen widget (native only)
- [ ] Shareable day card (single-day image export)
