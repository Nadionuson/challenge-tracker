# Challenge Tracker — Design Spec
**Date:** 2026-04-07
**Status:** Approved

---

## Overview

A personal household challenge tracker for two people (Inês and André) completing a 30-day wellness challenge. Hosted on Vercel, accessible from anywhere, password-protected. Data persisted as JSON committed to the GitHub repo via the GitHub Contents API.

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Hosting | Vercel | Accessible from anywhere |
| Auth | Shared password (middleware + cookie via `iron-session`) | Simple household use |
| Data storage | GitHub API → `data/challenge.json` | Zero extra services, full history in git |
| Layout | Side-by-side (both people visible) | Direct comparison, competitive feel |
| Check-in UX | Tabbed app (Today / History / Stats) | Clear separation of concerns |
| Management | Full UI (forms/modals in admin panel) | No JSON editing needed |
| Stack | Next.js 14 App Router + TypeScript + Tailwind | Project defaults |
| Save behaviour | Optimistic client state, single commit on "Save Today" | Reduces GitHub API calls |
| Streak definition | Consecutive days where **all** goals were completed | Simple, unambiguous |
| New challenge goals | Pre-populate from most recent challenge (user can remove/add) | Sensible default |
| Repo visibility | **Private repo required** | Token has write scope |
| GitHub token | Fine-grained PAT scoped to `contents: write` on this repo only | Least-privilege |

---

## Data Model

Single file: `data/challenge.json`

```json
{
  "challenges": [
    {
      "id": "apr-2026",
      "name": "30 Day Challenge",
      "startDate": "2026-04-07",
      "endDate": "2026-05-06",
      "participants": [
        {
          "id": "ines",
          "name": "Inês",
          "color": "#e94560",
          "joinedDate": "2026-04-07",
          "goals": [
            { "id": "no-alcohol",       "name": "No Alcohol",        "startDate": "2026-04-07" },
            { "id": "no-sugar",         "name": "No Sugar",          "startDate": "2026-04-07" },
            { "id": "no-complex-carbs", "name": "No Complex Carbs",  "startDate": "2026-04-07" },
            { "id": "exercise",         "name": "15+ Exercise",      "startDate": "2026-04-07" },
            { "id": "reading",          "name": "15 min Reading",    "startDate": "2026-04-07" },
            { "id": "water",            "name": "Drink 2L Water",    "startDate": "2026-04-07" },
            { "id": "fruit",            "name": "Eat Fruit",         "startDate": "2026-04-07" }
          ]
        },
        {
          "id": "andre",
          "name": "André",
          "color": "#60a5fa",
          "joinedDate": "2026-04-07",
          "goals": [
            { "id": "no-alcohol",       "name": "No Alcohol",        "startDate": "2026-04-07" },
            { "id": "no-sugar",         "name": "No Sugar",          "startDate": "2026-04-07" },
            { "id": "no-complex-carbs", "name": "No Complex Carbs",  "startDate": "2026-04-07" },
            { "id": "exercise",         "name": "15+ Exercise",      "startDate": "2026-04-07" },
            { "id": "reading",          "name": "15 min Reading",    "startDate": "2026-04-07" },
            { "id": "water",            "name": "Drink 2L Water",    "startDate": "2026-04-07" },
            { "id": "fruit",            "name": "Eat Fruit",         "startDate": "2026-04-07" }
          ]
        }
      ],
      "entries": {
        "2026-04-07": {
          "ines":  { "no-alcohol": true, "no-sugar": true, "no-complex-carbs": false, "exercise": true, "reading": true, "water": true, "fruit": true },
          "andre": { "no-alcohol": true, "no-sugar": false, "no-complex-carbs": true, "exercise": true, "reading": true, "water": true, "fruit": true }
        }
      }
    }
  ]
}
```

**Key design decisions in the data model:**

- Each goal has its own `startDate` — goals added mid-challenge are only counted from that date forward.
- Each participant has a `joinedDate` — participants joining mid-challenge use `joinedDate` as the denominator start for consistency % and streaks, not the challenge `startDate`.
- `entries` keyed by ISO date → participant id → goal id → boolean. An entry only contains goal IDs present in that participant's goal list at the time of saving. Missing goal keys (i.e. goals whose `startDate` is after that entry's date) are treated as **not applicable** — they do not count as failures and are excluded from consistency calculations.
- Multiple challenges in the same file — starting a new challenge appends to the array; history is never deleted.
- Extending a challenge = updating `endDate` only.
- **Active challenge** = the challenge where `today >= startDate && today <= endDate`. If multiple match, the last one in the array wins. If none match, redirect to the most recent past challenge in read-only mode.

---

## Routes

```
/                          → redirect to active challenge today tab
/login                     → password form (sets httpOnly auth cookie)
/challenge/[id]            → Today tab (default)
/challenge/[id]/history    → History tab
/challenge/[id]/stats      → Stats tab
/admin                     → Challenge management (password-protected)
```

---

## Data Fetching & Server Actions

`getChallenge(id)` is a **server-side data fetch** (not a mutation) called from page Server Components to load data for all tabs. All mutations go through Next.js Server Actions.

| Function | Type | Description |
|---|---|---|
| `getChallenge(id)` | Fetch | Read challenge.json via GitHub Contents API; returns parsed data + current file SHA |
| `saveEntries(challengeId, date, entries)` | Action | Commit today's check-in; uses SHA from last fetch; retries once on 409 (stale SHA) by re-fetching SHA and retrying the write |
| `addGoal(challengeId, participantId, goal)` | Action | Add goal with startDate, commit |
| `addParticipant(challengeId, participant)` | Action | Add participant with joinedDate + goals, commit |
| `createChallenge(challenge)` | Action | Append new challenge (pre-populated from most recent), commit |
| `extendChallenge(challengeId, newEndDate)` | Action | Update endDate, commit |

**GitHub API race condition mitigation:** `saveEntries` reads the current SHA before writing. On a 409 conflict (concurrent write), it fetches the latest SHA once and retries. If the retry also fails, it returns an error to the UI ("Someone else saved at the same time — please refresh and try again"). This covers the two-person simultaneous save scenario without complex locking.

**Error handling:** All server actions return `{ success: boolean; error?: string }`. The UI shows a toast on failure. GitHub API failures (network, rate limit) surface as "Save failed — please try again."

**Future date guard:** `saveEntries` validates that `date <= today` server-side. Requests for future dates are rejected with a 400.

---

## Authentication

- Next.js middleware protects all routes except `/login`
- Session managed with `iron-session` (encrypts a cookie using `SESSION_SECRET`; `APP_PASSWORD` is only used for the login check, not as the encryption key)
- No user accounts — single shared household password
- Session duration: 30 days (cookie maxAge)

---

## Environment Variables

| Variable | Description |
|---|---|
| `APP_PASSWORD` | Shared login password |
| `SESSION_SECRET` | 32-char random secret for `iron-session` cookie encryption |
| `GITHUB_TOKEN` | Fine-grained PAT with `contents: write` on this repo only |
| `GITHUB_REPO` | e.g. `nunooliveira/challenge-tracker` |
| `GITHUB_BRANCH` | Default: `main` |

---

## UI Components

### App Shell
- **Header**: challenge name, date range, day count, ⚙ Admin button, Save Today button
- **TabBar**: Today / History / Stats

### Today Tab
Side-by-side participant columns rendered by `TodayView` → `ParticipantColumn` (one per participant).

`ParticipantColumn` contains:
- Header: participant name (colour-coded), streak count, today's score (X/N)
- `GoalList`: tap to toggle. Done = green filled. Not done = dashed border.

**Save behaviour:** toggling goals updates React client state only (optimistic). "Save Today" in the header fires `saveEntries` with all current toggles. The page re-validates after a successful save. If save fails, the error is shown as a toast and client state is preserved so the user can retry.

**Empty state:** if no entry exists for today, all goals default to unchecked.

### History Tab
Weekly calendar grid (`HistoryGrid`). Each cell shows the date and both participants' scores (e.g. `6·7`).

**Colour thresholds** (based on combined score = sum of both participants' goals hit / sum of total goals possible):
- Dark green ≥ 90%
- Green 70–89%
- Yellow 50–69%
- Red < 50%
- Grey = no entry / future date

**Empty state:** if the challenge has no entries yet, the grid renders all cells as grey with a "No entries yet" message.

### Stats Tab
Per-participant card (`StatsPanel`) showing:
- Current streak
- Best streak
- Consistency %
- Perfect days / total days since joinedDate

**Empty state:** if no entries exist, all stats show `—`.

### Admin Panel (slide-out drawer — `AdminDrawer`)
Forms for:
- Add goal to a participant (name, effective start date — defaults to today)
- Add a new participant (name, colour, joinedDate, initial goals)
- Create a new challenge (name, start date, end date; goals pre-populated from most recent challenge, user can remove/add before saving)
- Extend a challenge (new end date picker, must be after current endDate)

---

## Metrics / Stats Definitions

| Metric | Definition |
|---|---|
| Current streak | Consecutive days (going backwards from today, inclusive — today counts if today's entry is saved and all applicable goals are complete; otherwise the count starts from yesterday) where **all** of that participant's applicable goals were completed. A goal is "applicable" on a given date if `date >= goal.startDate`. A missing entry key is treated as not applicable (excluded), not as a failure. Days before `participant.joinedDate` are excluded entirely. |
| Best streak | Longest streak in the challenge for that participant |
| Consistency % | `(Σ goals completed) / (Σ goals possible) × 100`. For each day since `max(participant.joinedDate, challenge.startDate)`, "goals possible" = goals whose `startDate <= that day`. Missing entry keys for pre-startDate goals are excluded from both numerator and denominator. |
| Perfect day | All applicable goals for that participant completed on that day |

---

## File Structure

```
challenge-tracker/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # redirect to active challenge
│   ├── login/page.tsx
│   ├── challenge/[id]/
│   │   ├── page.tsx                # Today tab
│   │   ├── history/page.tsx
│   │   └── stats/page.tsx
│   └── admin/page.tsx
├── components/
│   ├── TabBar.tsx
│   ├── TodayView.tsx
│   ├── ParticipantColumn.tsx       # header + goal list for one person
│   ├── GoalList.tsx
│   ├── HistoryGrid.tsx
│   ├── StatsPanel.tsx
│   └── AdminDrawer.tsx
├── lib/
│   ├── github.ts                   # GitHub Contents API read/write + retry logic
│   ├── actions.ts                  # Server Actions
│   └── metrics.ts                  # Streak, consistency calculations
├── middleware.ts                   # Auth cookie check (iron-session)
├── data/
│   └── challenge.json              # The data file (private repo)
└── docs/superpowers/specs/
    └── 2026-04-07-challenge-tracker-design.md
```

---

## Out of Scope (for now)

- Push notifications / reminders
- Mobile app
- Per-goal streaks (only overall streak per person)
- Social sharing
- Export to Excel
