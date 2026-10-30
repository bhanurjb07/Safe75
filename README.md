# Safe75

**Stay safe above 75%.** Safe75 is a mobile-first web app that logs in to your college ERP and answers three questions at a glance:

- **Am I safe?**
- **How many classes can I skip?**
- **How many must I attend to get back above the target?**

Built with React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Zustand and lucide-react.

> ⚠️ **Unofficial tool, for personal use only.** Safe75 talks to an **undocumented** ERP API through a proxy. It is not affiliated with or endorsed by your college. It can stop working at any time if the college changes its ERP. **Only sign in with your own account.**

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with your ERP username and password.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally (PWA / offline shell active here) |
| `npm test` | Run the unit tests (attendance formulas, mappers, analytics, name cleaning) |
| `npm run icons` | Regenerate the PWA PNG icons in `public/icons/` |

---

## Environment variables

Copy `.env.example` to `.env` and fill it in. `.env` is git-ignored. All values are read in **one place only**, `src/config/env.js`; every other file imports from there.

| Variable | Required | Meaning |
|---|---|---|
| `VITE_PROXY_URL` | yes | URL of the Supabase edge function that forwards requests to the ERP |
| `VITE_SUPABASE_ANON_KEY` | yes | Public Supabase anon key for that function (sent as `apikey` and outer `Authorization`) |
| `VITE_ATTENDANCE_TARGET` | no | Target percentage, default `75` |
| `VITE_ENABLE_PAST_SEMESTERS` | no | `true` = try to load past semesters' attendance (experimental, see below) |

If a required variable is missing, the app shows a setup screen at startup instead of failing silently.

Notes:
- `VITE_` variables are bundled into the browser build, so only put **public** values here. The anon key is public by design.
- Never put your ERP username, password or tokens in `.env` or in code.

---

## How it works

```
src/
  config/env.js        the only reader of import.meta.env
  api/                 all ERP access, isolated
    client.js          the single proxy POST, timeouts, error mapping, debug log (no values)
    auth.js            /Token login, session expiry checks
    attendance.js      attendance (endpoint A) + semester history (endpoint B)
    profile.js         profile (endpoint C), reduced to name + roll number immediately
    mappers.js         raw ERP JSON → small clean app models
    errors.js          ApiError, friendly messages, token redaction
  store/               Zustand: auth, attendance, theme, toasts, debug
  utils/               attendance math, analytics, dates, subject-name cleaning, share card, confetti
  components/          ProgressRing, StatCard, SubjectCard, Calendar, WhatIfSlider, Sheet, …
  pages/               Login, Dashboard, Subjects, History, Planner, Insights
  layouts/AppShell.jsx sidebar (desktop), tab bar (mobile), animated routes, pull-to-refresh
```

### The maths (`src/utils/attendance.js`, tested)

With `P` present, `T` total and `R` the target fraction (0.75):

- Percentage = `P / T × 100`
- Safe to skip = `floor(P / R − T)`
- Must attend in a row = `ceil((R·T − P) / (1 − R))`
- What-if skip `k` = `P / (T + k)`; what-if attend `m` = `(P + m) / (T + m)`
- Status: **Safe** at target + 5 or more, **Borderline** between target and target + 5, **Danger** below target

Headline numbers come from `overallPresent` / `overallLecture` / `overallPercentage` and each subject's `presentLeactures` / `totalLeactures`. The day-wise log merges both arrays from the attendance response: `attendanceData` (regular classes, absent when `isAbsent` is true) and `extraLectures` (extra classes, absent when `attendanceLable` is `"A"`). Extra records have `subjectName: null`, so every record is matched to its subject by `subjectId`. For each subject and date the marks are listed regular first, then extra (e.g. "PP", "AA", "PA"). Regular + extra records add up to the ERP's total classes, and this merged list drives the calendar, charts, streaks and the debug panel's counts.

---

## Privacy & security

- The password is sent only to the ERP (through the proxy). It is never logged or stored, and the field clears as soon as you submit.
- Login tokens live in **sessionStorage** only. A refresh keeps you signed in; closing the tab ends the session. Tokens never go into URLs.
- On any 401, or once `.expires` passes, the session is cleared and you return to the login screen with "Session expired".
- From the profile endpoint, `mapProfile` (in `src/api/profile.js`) picks only: first/middle/last name, roll number, admission number, mobile, address and Aadhaar. Everything else in that response is dropped immediately. Only name and roll number are kept in sessionStorage (for the header); mobile, address and Aadhaar live in a memory-only store, are re-fetched on every login or page load, are cleared on logout, and are stripped from the debug panel, error messages and the share image.
- The Profile page displays the student's own mobile number, address, and Aadhaar number (masked by default) as returned by the college ERP. This data is held in memory only for the duration of the session and is never persisted to local storage, logged, or transmitted anywhere except back to the ERP's own API. If you deploy this app for others to use, each user only ever sees their own data via their own login — there is no shared storage of this information.
- The last successful attendance data is cached in sessionStorage so the app still shows it if the network drops ("Offline · Last updated 10:42 AM"). Logout clears everything.
- The share image includes your first name and attendance only.
- `localStorage` holds just the theme preference.

### Developer debug panel

Add `?debug=1` to any URL (and `?debug=0` to turn it off). The panel shows mode, proxy host, session expiry, request timings and the **shape** of each response (keys and array sizes, no values). Tokens and keys are always masked.

---

## Features

- Animated login with parallax aurora background, show/hide password, friendly errors
- Profile page: name, roll and admission number, semester, plus a Contact details card (mobile, address, Aadhaar masked to the last 4 digits with a 10-second reveal, copy buttons)
- Profile tabs: Overview (with a profile-completion ring and the missing items), Personal, Contact & address, Family & guardian, Academic (current programme, 10th, 12th with a subject-wise marks table, diploma, graduation) and Other (domicile, transport, hostel, placement, internships, achievements). Only fields the ERP actually returns are shown; private fields (religion, caste, incomes, medical) stay hidden until "Show private". Field list: `src/api/profileSchema.js`. Endpoint details and what is **not** integrated yet: [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)
- Side drawer (tap your avatar): name, roll number, semester, Profile, Notifications, AKTU Result (opens the One View portal), Reports & export, share card, Contact & About, theme, sign out
- Dashboard: present/total with a self-drawing ring, "Can skip N" / "Need N" pill, Plan button, weekly present-vs-absent bar chart with week navigation, stat cards, insights, subjects sorted by risk, confetti when safe, shake/pulse when in danger
- Plan attendance sheet: simulate upcoming present / absent classes, plus PC (past absences changed to present: +1 present, total unchanged, capped at your absences), for overall or any subject, and watch the ring, fraction and pill update
- Days with several classes of a subject show every mark in one row (e.g. "A A", "P A"), in the subject's daily records and the History day sheet
- Subjects: search, filter (All / Safe / Danger / Labs), sort; cards show the %, a gradient bar, present/total and a "Need N" / "Skip N" badge, and open into a detail sheet with the "to reach 75%" advice, trend chart, what-if sliders and the full daily attendance records (All / Absent / Present)
- Notifications: subjects in danger or on the edge, plus recent days you were marked absent (new ones tagged; unread count on the bell)
- Reports & export: subject summary and daily log as CSV, attendance image, print / save as PDF
- History: month calendar with present/absent dots, day sheet, monthly summary, running % chart, most-missed subject, longest absent streak
- Planner: what-if calculator per subject or overall, plus "Plan my week" with projected overall %
- Insights: weakest/strongest subject, subjects in danger with classes to recover, weekday absence pattern
- Dark (default), light and system themes; reduced-motion support; keyboard and screen-reader friendly; status never shown by colour alone
- PWA: installable, offline app shell (production build), pull-to-refresh on phones, shareable attendance image

---

## Known limitations

- **The API is unofficial and undocumented.** Field names (including the ERP's own spellings such as `Leactures` and `attandanceType`) are handled in `src/api/mappers.js`. If the ERP changes, that file is where to adapt.
- **Past semesters are unverified.** With `VITE_ENABLE_PAST_SEMESTERS=true` the semester chip becomes a switcher and passes that semester's `userId` to the attendance endpoint. If the ERP rejects it or returns the current semester's data again, the feature hides itself for the rest of the session.
- Wrong-password detection relies on the token endpoint returning HTTP 400 / `invalid_grant`. Other failures show a generic message.
- "Plan my week" estimates classes per week from the day log, so it is approximate.
- The service worker is only registered in production builds (`npm run build && npm run preview`), so dev never serves stale files.
- The unit tests cover the formulas, analytics, name cleaning and the response mappers (with small made-up fixtures). There is no offline sample-data mode: the app always talks to the real ERP.
