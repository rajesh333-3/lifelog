# Life Log — Project Reference

## What This Is

A personal life-tracking Android app built with React (Vite) + Capacitor. Stores everything locally on-device using IndexedDB (Dexie). Dark-themed, mobile-first, offline-only.

- **App ID:** `com.rajeshtvd.lifeos`
- **App name:** Life Log
- **Source root:** `life-os/`
- **Current release APK:** `life-os/android/app/release/app-release.apk` (versionCode 1)

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI | React 18, Vite, TailwindCSS, Framer Motion |
| Native wrapper | Capacitor 8 (Android WebView) |
| Database | Dexie v4 (IndexedDB) + dexie-react-hooks (useLiveQuery) |
| State | Zustand (`useSettingsStore`, `useAppStore`) |
| Voice | Web Speech API (`webkitSpeechRecognition`) — `continuous = false` + auto-restart pattern |
| AI | Gemini Flash (cloud) or Ollama (desktop only) |

---

## Project Structure

```
life-os/
  src/
    App.jsx                          — Root: nav, tabs, header, loading screen
    db/index.js                      — Dexie schema v4, DB helpers, seedCommitmentTasks
    store/
      useSettingsStore.js            — Profile, pillars, LLM config, reminders
      useAppStore.js                 — selectedDate, activePanel (dayView overlay)
    utils/
      dateUtils.js                   — todayStr, isFuture, isToday, formatDate, weekDates
      scoreUtils.js                  — overallScore, scoreToColor
    components/
      DayView/
        DayView.jsx                  — Main daily logging screen (today/past/future modes)
        TaskSection.jsx              — Per-pillar task list with animated progress bars
        HabitsSection.jsx            — Daily habit check-in chips
        HobbySection.jsx             — Hobby logging
        PillarSlider.jsx             — DEPRECATED (kept but not used in DayView)
        PillarReadOnly.jsx           — DEPRECATED (kept but not used in DayView)
      Voice/
        useVoiceInput.js             — Speech recognition hook (continuous=false, auto-restart)
      Settings/
        Settings.jsx                 — Profile / AI / Pillars / Habits / Reminders / Data tabs
      Insights/
        InsightsView.jsx             — AI-powered check-in and weekly insights
      Eisenhower/
        EisenhowerBoard.jsx          — Task matrix (Q1-Q4 quadrant view)
      LifeGrid/
        LifeGrid.jsx                 — Full life grid (weeks as dots, coloured by score)
        WeekDot.jsx / WeekTooltip.jsx / DayBarStack.jsx / DayHoverCard.jsx
      Calendar/
        CalendarPicker.jsx           — Calendar overlay (header trigger)
      Onboarding/
        Onboarding.jsx               — First-run flow: name, DOB, pillars, commitments
      Tour/
        WelcomeTour.jsx              — Post-onboarding guided walkthrough
      AIChat/
        AIChat.jsx / useLLM.js       — Chat UI + Gemini/Ollama integration
      UI/
        NextReleaseBanner.jsx        — Inline "coming soon" banners
  android/
    app/build.gradle                 — signingConfigs release block (keystore: ../lifelog-release.jks)
    lifelog-release.jks              — Release keystore (alias: lifelog, pw: lifelog123)
    .idea/workspace.xml              — KEY_STORE_PATH: $PROJECT_DIR$/lifelog-release.jks
```

---

## Database Schema (Dexie v4, db name: `LifeOS`)

| Table | Key | Shape |
|---|---|---|
| `days` | `date` (YYYY-MM-DD) | physical/mental/work scores (0-100), notes, reflection, voiceNote, lifeEvent |
| `todos` | `++id` | type='task'\|'hobby', title, quadrant Q1-Q4, urgent, important, pillar, createdDate, completedDate, done, source='commitment'? |
| `hobbies` | `++id` | name, emoji, priority |
| `settings` | `key` | profile, pillars, llm, reminders, habits |
| `habitLogs` | `[date+habitId]` | presence = done, absence = not done |
| `chatLogs` | `date` | AI chat history |

**Task visibility rule:** show task on date D if `createdDate <= D` AND (`done===false` OR `completedDate===D`). This gives "float forward until closed" with no duplication.

---

## Key Patterns

### Per-Pillar Task Progress (TaskSection.jsx)
Tasks grouped by pillar (`physical` / `mental` / `work`). Tasks without a pillar → default to `work`. Animated spring progress bar per pillar. Pillar scores auto-derive from task completion % and are persisted to the day record.

```js
const PILLARS = ['physical', 'mental', 'work']
// Score derivation in DayView.jsx:
const taskScores = useMemo(() => {
  const score = (p) => {
    const pt = allTasks.filter(t => pillarOf(t) === p)
    return pt.length ? Math.round(pt.filter(t => t.done).length / pt.length * 100) : null
  }
  return { physical: score('physical'), mental: score('mental'), work: score('work') }
}, [allTasks])
```

### Voice Input (useVoiceInput.js)
- `continuous = false` — one utterance per session, avoids Android WebView's result accumulation/tripling bug
- `shouldListen` ref as intent flag — `onend` auto-restarts while flag is true (150ms gap)
- `callbackRef` pattern — callback always reads latest value without stale closure
- **Append pattern** in consumers (VoiceJournal, ReflectField):
  ```js
  const valueRef = useRef(value)
  valueRef.current = value
  function handleFinal(text) {
    onChange(valueRef.current ? `${valueRef.current} ${text}` : text)
  }
  ```

### Auto-Save
- Text inputs: debounced 800ms `autoSave()`
- Sliders / task toggles: immediate `saveNow()` / `persist()`
- Score-sync effect uses `lastScoreSig` ref to avoid infinite loops, `localRef` to avoid stale closure

### Past Day Edit Lock
Past days are read-only by default. An "Edit" button triggers `window.confirm` → sets `pastUnlocked = true`. `pastUnlocked` resets to false on every date change.

---

## Features Implemented

- [x] **Life Grid** — full lifespan visualised as week dots, coloured by daily score
- [x] **Day View** — Today / Past (read-only) / Future (task scheduling) modes
- [x] **7-day week strip** — quick date navigation anchored to Monday
- [x] **Per-pillar tasks** — Physical 💪 / Mental 🧠 / Work 💼 sections with progress bars
- [x] **Commitment tasks** — seeded from Pillars settings, tagged `source='commitment'`, non-deletable
- [x] **Task float-forward** — open tasks carry forward daily until closed
- [x] **Eisenhower board** — Q1-Q4 matrix view of all open non-commitment tasks
- [x] **Reflection fields** — "What went well" + "Could be better" with inline mic
- [x] **Voice Journal** — dictation + free-type textarea, word count, clear button
- [x] **Habits** — create habits with emoji + pillar, daily tap-to-check chips
- [x] **Hobbies** — log hobbies with time and notes
- [x] **Life Event toggle** — marks a day as a life event (turns dot blue in grid)
- [x] **AI Insights** — weekly check-in with Gemini Flash or Ollama
- [x] **Calendar picker** — header calendar icon → full month picker overlay
- [x] **Settings** — Profile / AI / Pillars / Habits / Reminders / Data tabs
- [x] **Data export** — JSON backup via Web Share API (mobile) or download fallback
- [x] **Data import** — restore from backup JSON, replaces all data
- [x] **Master reset** — double-confirm wipe: `Dexie.delete('LifeOS')` + `localStorage.clear()`
- [x] **Onboarding** — name, DOB, life expectancy, pillar goals, commitment tasks
- [x] **Welcome tour** — post-onboarding walkthrough (replayable from Settings)
- [x] **Release APK signing** — keystore configured in build.gradle + workspace.xml

---

## Android Build & Deploy

### Dev server (for WiFi testing on phone)
```bash
cd life-os
npm run dev -- --host
# Phone opens http://<your-mac-ip>:5173
```

### Build release APK
```bash
cd life-os
npm run build
npx cap sync android
# Then open Android Studio → Build → Generate Signed APK → release
# OR: Build > Build Bundle(s)/APK(s) > Build APK(s) (uses build.gradle signingConfig)
```
Output: `life-os/android/app/release/app-release.apk`

### Install on phone via USB
```bash
adb install -r life-os/android/app/release/app-release.apk
# If signature mismatch (upgrading from debug):
adb uninstall com.rajeshtvd.lifeos
adb install life-os/android/app/release/app-release.apk
```

### Share APK with friends
Upload `app-release.apk` to Google Drive and share the download link. Friends tap → download → install (allow "unknown sources" once). **Do not use WhatsApp** — it compresses and corrupts APKs.

### Keystore details
- File: `life-os/android/lifelog-release.jks`
- Store password: `lifelog123`
- Key alias: `lifelog`
- Key password: `lifelog123`
- Validity: 10,000 days from creation

**Important:** `build.gradle` references the keystore as `file('../lifelog-release.jks')` (relative to `app/`). `workspace.xml` uses `$PROJECT_DIR$/lifelog-release.jks`. Keep both pointing to `life-os/android/lifelog-release.jks`.

---

## Known Bugs Fixed

| Bug | Root Cause | Fix |
|---|---|---|
| Voice text replaced instead of appended | Stale closure on `value` in `handleFinal` | `valueRef.current = value` pattern in both VoiceJournal and ReflectField |
| Voice tripling (text recorded 3x) | Android WebView `continuous=true` accumulates and re-fires results | Switched to `continuous=false` + auto-restart via `shouldListen` ref |
| Keyboard mic blocked ("app doesn't support voice") | `onerror` set `supported=false` → early-return degraded UI | Removed `setSupported(false)` from error handler; always render textarea |
| Past day showed editable pillar sliders defaulted to 50 | `PillarReadOnly` still rendered in past view | Removed entire "Your Day" / PillarReadOnly block from past mode |
| Gradle release build: keystore not found | `externalOverride` in workspace.xml had relative path resolving to Gradle daemon dir | Changed workspace.xml to use `$PROJECT_DIR$/lifelog-release.jks` |
| APK install: incompatible signatures | Phone had debug APK installed; release APK has different cert | `adb uninstall` old app, then fresh install |

---

## Pending / Ideas for Next Release

- [ ] Push notifications (reminder times saved in Settings → Reminders, activation pending)
- [ ] Play Store submission (need screenshots, privacy policy, content rating)
- [ ] Play Console internal testing (proper share without "unknown sources" warning)
- [ ] versionCode bump before each release build
- [ ] Streak tracking (habit streaks, task completion streaks)
- [ ] Weekly review summary screen

---

## Commit Style

No `Co-Authored-By` lines in git commits.
