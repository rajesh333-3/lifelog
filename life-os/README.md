# Life Log

> *Capture today. Understand yesterday. Shape tomorrow.*

Life Log is a private, offline-first personal life-tracking PWA and Android app. Every piece of data lives on your device — no accounts, no servers, no cloud sync.

**Live web app:** https://exquisite-maamoul-fbc403.netlify.app  
**Android APK:** `android/app/release/app-release.apk` (sideload or share via Drive)

---

## Install — no App Store needed

### iPhone / iPad (Safari)
1. Open Safari → go to the URL above
2. Tap **Share** → **Add to Home Screen** → **Add**
3. Opens full-screen, works offline

> Use Safari only — Chrome on iOS doesn't support Add to Home Screen correctly.

### Android (Chrome)
1. Open Chrome → go to the URL above
2. Tap **⋮ → Add to Home Screen → Install**
3. Or sideload the release APK directly

---

## What's in the app

### Life Grid
Your entire lifespan visualised as a grid of week-dots. Each dot = one week.

- **Cinematic intro** — the grid pans from birth to your current week on every launch
- **Free pan & zoom** — drag, pinch, or mouse-wheel to explore any era of your life
- **Score colours** — smooth 0→100 HSL spectrum: deep red → amber → rich green. Every 10-point step is visually distinct
- **Dot states** — scored past (vivid colour), unscored past (cool blue-gray), current week (purple conic fill + pulse ring), future (faint outline)
- **Hover glow** — dots brighten with a drop-shadow as your cursor passes over them
- **Tap a dot** — opens a 50/50 split: grid stays in the top half, a week detail drawer slides up from the bottom showing all 7 days with scores, dates, and a tap-to-open button

### Daily Log
Log each day across three pillars — Physical 💪, Mental 🧠, Work 💼.

- Task completion per pillar auto-derives the pillar score (0–100)
- Reflection fields ("What went well" / "Could be better") with inline mic
- Voice journal with append-mode dictation (tap mic → speak → appends to text)
- Life Event toggle — marks the day blue in the grid
- Past days are read-only by default; an Edit button unlocks them
- Future days show only tasks and reminders

### Habits
Create habits per pillar with an emoji. Tap chips each day to check them off.

### Tasks & Eisenhower Matrix
- Tasks created on any day auto-float forward until closed — nothing gets lost
- Commitment tasks seed from your pillar goals and are non-deletable
- **Eisenhower Board** — full-height 2×2 matrix (Do Now / Schedule / Delegate / Drop) with drag-and-drop rearranging between quadrants

### AI Insights
Connect Gemini Flash (cloud) or Ollama (local) in Settings → AI for a weekly narrative check-in. The app works fully without AI — it's entirely optional.

### Search
Animated search bar in the header fills the space between your name and your age pill. Cycles through 12 real-feeling episodic memory queries ("that night we played hockey so late…", "felt sad when my puppy fell sick…") to remind you what the search can find. Opens a full-screen overlay with live results across notes, reflections, tasks, and habits.

### Calendar
Tap the date chip (top-right of grid) to open a full month calendar. Hovering the life grid highlights that week in the calendar in real time.

### Data Export & Import
Settings → Data → Export backs up all days, tasks, habits, and chat logs as a timestamped JSON file (`lifelog-backup-YYYY-MM-DDThh-mm-ss.json`). Import restores from any backup file. A post-export summary shows how many records were saved.

### Onboarding & Tour
First-run wizard collects your name, date of birth, life expectancy, pillar goals, and commitment tasks. A 6-slide welcome tour plays after onboarding — replay anytime from Settings → Tour.

---

## Score colour system

Scores are 0–100. The colour is an HSL interpolation — not buckets:

| Score | Colour | Feeling |
|-------|--------|---------|
| 0     | Deep red | hsl(0, 80%, 47%) |
| 25    | Orange | hsl(34, 86%, 51%) |
| 50    | Amber-yellow | hsl(68, 90%, 55%) — brightest |
| 75    | Yellow-green | hsl(101, 87%, 50%) |
| 100   | Rich green | hsl(135, 80%, 47%) |

A score of 90 and 100 are both green but clearly distinct shades. A score of 0 and 10 are both red but distinct.

---

## Android build & deploy

### Dev server (WiFi testing)
```bash
cd life-os
npm run dev -- --host
# Phone opens http://<your-mac-ip>:5173
```

### Build release APK
```bash
npm run build
npx cap sync android
# Android Studio → Build → Generate Signed APK → release
```
Output: `android/app/release/app-release.apk`

### Install on phone via USB
```bash
adb install -r android/app/release/app-release.apk
# First time (signature mismatch from debug):
adb uninstall com.rajeshtvd.lifeos
adb install android/app/release/app-release.apk
```

### Keystore
- File: `android/lifelog-release.jks`
- Store password / key password: `lifelog123`
- Alias: `lifelog`
- App ID: `com.rajeshtvd.lifeos`

### Sharing with friends
Upload `app-release.apk` to Google Drive and share the download link.
**Do not use WhatsApp** — it compresses and corrupts APKs.

---

## Play Store path (when ready)

**Blockers:** $25 Google Play developer account + a live privacy policy URL.

**Content for the privacy policy:** All data stored on-device only. No data collected or shared except optional Gemini API calls initiated by the user.

**Build an `.aab`** (Play Store requires this, not `.apk`):
```bash
npm run build && npx cap sync android
# Android Studio → Build → Generate Signed Bundle → Android App Bundle
```

**Release tracks:**
- *Internal testing* — instant, no review, max 100 testers. Share via a real Play Store link (no "unknown sources" warning).
- *Production* — Google review ~1–3 days.

**Before each new release:** bump `versionCode` and `versionName` in `android/app/build.gradle`.

---

## Tech stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion v12 |
| Database | Dexie.js v4 (IndexedDB) |
| State | Zustand |
| Drag & drop | @dnd-kit/core |
| PWA | vite-plugin-pwa + Workbox |
| Native | Capacitor 8 (Android) |
| Fonts | Outfit + Inter (Google Fonts) |
| AI | Gemini Flash API or Ollama (local) |

---

## Running locally

```bash
# Node 20+ required
nvm use 20
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

Deploy: drag `dist/` to [netlify.com/drop](https://app.netlify.com/drop).

---

## Data & privacy

All data is stored in IndexedDB on your device. The app makes no network requests except:
- Google Fonts on first load (cached by the service worker after that)
- Your AI provider (Gemini or Ollama) — only when you explicitly trigger an Insights generation

Clearing browser storage or uninstalling the app will erase all data. Use Settings → Data → Export regularly to keep backups.

---

## Roadmap

- [ ] Push notification reminders (times configurable in Settings → Reminders; delivery pending)
- [ ] Streak tracking (habit streaks, task completion streaks)
- [ ] Play Store submission (needs dev account + privacy policy URL)
- [ ] Weekly review summary screen
- [ ] iCloud / Google Drive sync (optional)
