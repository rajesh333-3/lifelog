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
| **Native App (iOS / Android)** | Coming next release | Capacitor is configured. Packaging to `.ipa` / `.apk` and App Store submission pending. |
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

## Data & privacy

- **All data is on your device.** Nothing is ever sent to a server.
- The only network requests are Google Fonts (loaded at startup) and optionally your AI provider (Ollama or Gemini) when generating narratives.
- Clearing browser data or uninstalling will permanently delete all logs. Export is coming in the next release — until then, keep regular device backups.

---

## Roadmap

- [ ] Push notification reminders
- [ ] JSON export & import (full backup/restore)
- [ ] Capacitor iOS + Android packaging
- [ ] Hobbies in Insights charts
- [ ] iCloud / Google Drive sync (optional)
- [ ] Lock screen widget (native only)
- [ ] Shareable day card (single-day image export)
