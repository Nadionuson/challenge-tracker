# Challenge Tracker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-protected, Vercel-hosted 30-day challenge tracker for two people with daily check-in, history, stats, and admin management.

**Architecture:** Next.js 14 App Router with TypeScript and Tailwind. Data persisted as `data/challenge.json` committed to a private GitHub repo via the Contents API (read SHA → mutate → commit; retry once on 409). Auth via `iron-session` with a shared household password.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, iron-session, native fetch (GitHub API), Jest + React Testing Library, Vercel.

---

## Chunk 1: Bootstrap, Types, and Seed Data

### Task 1: Scaffold Next.js app

**Files:**
- Create: `package.json` (generated)
- Create: `tsconfig.json` (generated)
- Create: `tailwind.config.ts` (generated)
- Create: `next.config.ts` (generated)

- [ ] **Step 1: Scaffold in the project directory**

```bash
cd "C:/Users/nunooliveira/ClaudeProjects/Personal Dashboards/Challenge Tracker"
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

When prompted, accept all defaults. Answer `Yes` to using App Router.

Expected: `package.json`, `app/`, `tailwind.config.ts`, `next.config.ts` created.

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000`. Stop with Ctrl+C.

- [ ] **Step 3: Remove boilerplate**

Delete `app/page.tsx` contents (replace with a placeholder `export default function Page() { return null }`).
Delete everything inside `app/globals.css` except the Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Ensure data/ is not gitignored**

```bash
grep -n "data" .gitignore
```

`data/challenge.json` must be committed — if `.gitignore` contains `data/` or `/data`, remove that line. Confirm with:

```bash
git check-ignore -v data/challenge.json
```

Expected: no output (file is not ignored).

- [ ] **Step 5: Commit**

```bash
git init 2>/dev/null || true   # safe if repo already exists
git add .
git commit -m "chore: scaffold Next.js 14 app with TypeScript and Tailwind"
```

---

### Task 2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install iron-session
```

- [ ] **Step 2: Install dev/test deps**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

- [ ] **Step 3: Add Jest config**

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Verify Jest runs**

```bash
npm test -- --passWithNoTests
```

Expected: `Test Suites: 0 passed` (no tests yet, exits 0).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: add iron-session and Jest with React Testing Library"
```

---

### Task 3: Define TypeScript types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write types**

```typescript
// lib/types.ts

export interface Goal {
  id: string
  name: string
  startDate: string // ISO date YYYY-MM-DD
}

export interface Participant {
  id: string
  name: string
  color: string       // hex, e.g. "#e94560"
  joinedDate: string  // ISO date
  goals: Goal[]
}

// goalId -> completed
export type ParticipantEntries = Record<string, boolean>

// participantId -> their entries for that day
export type DayEntries = Record<string, ParticipantEntries>

// ISO date -> day entries
export type Entries = Record<string, DayEntries>

export interface Challenge {
  id: string
  name: string
  startDate: string  // ISO date
  endDate: string    // ISO date
  participants: Participant[]
  entries: Entries
}

export interface ChallengeFile {
  challenges: Challenge[]
}

export interface ActionResult {
  success: boolean
  error?: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add core TypeScript types"
```

---

### Task 4: Create seed data file

**Files:**
- Create: `data/challenge.json`
- Create: `.env.local.example`
- Create: `.gitignore` additions

- [ ] **Step 1: Create seed data**

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
            { "id": "no-alcohol",       "name": "No Alcohol",       "startDate": "2026-04-07" },
            { "id": "no-sugar",         "name": "No Sugar",         "startDate": "2026-04-07" },
            { "id": "no-complex-carbs", "name": "No Complex Carbs", "startDate": "2026-04-07" },
            { "id": "exercise",         "name": "15+ Exercise",     "startDate": "2026-04-07" },
            { "id": "reading",          "name": "15 min Reading",   "startDate": "2026-04-07" },
            { "id": "water",            "name": "Drink 2L Water",   "startDate": "2026-04-07" },
            { "id": "fruit",            "name": "Eat Fruit",        "startDate": "2026-04-07" }
          ]
        },
        {
          "id": "andre",
          "name": "André",
          "color": "#60a5fa",
          "joinedDate": "2026-04-07",
          "goals": [
            { "id": "no-alcohol",       "name": "No Alcohol",       "startDate": "2026-04-07" },
            { "id": "no-sugar",         "name": "No Sugar",         "startDate": "2026-04-07" },
            { "id": "no-complex-carbs", "name": "No Complex Carbs", "startDate": "2026-04-07" },
            { "id": "exercise",         "name": "15+ Exercise",     "startDate": "2026-04-07" },
            { "id": "reading",          "name": "15 min Reading",   "startDate": "2026-04-07" },
            { "id": "water",            "name": "Drink 2L Water",   "startDate": "2026-04-07" },
            { "id": "fruit",            "name": "Eat Fruit",        "startDate": "2026-04-07" }
          ]
        }
      ],
      "entries": {}
    }
  ]
}
```

- [ ] **Step 2: Create .env.local.example**

```bash
# Copy to .env.local and fill in values
APP_PASSWORD=your-household-password
SESSION_SECRET=replace-with-32-char-random-string
GITHUB_TOKEN=your-fine-grained-pat
GITHUB_REPO=username/challenge-tracker
GITHUB_BRANCH=main
```

- [ ] **Step 3: Ensure .env.local is gitignored**

In `.gitignore`, verify `.env.local` is present (create-next-app adds it). Also add:
```
.env.local
```

- [ ] **Step 4: Commit**

```bash
git add data/challenge.json .env.local.example
git commit -m "feat: add seed challenge data and env example"
```

---

## Chunk 2: Data Layer — GitHub, Metrics, Actions

### Task 5: GitHub Contents API lib

**Files:**
- Create: `lib/github.ts`
- Create: `lib/__tests__/github.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/github.test.ts`:

```typescript
import { readChallengeFile, writeChallengeFile } from '../github'
import { ChallengeFile } from '../types'

const mockFileContent: ChallengeFile = { challenges: [] }
const mockBase64 = Buffer.from(JSON.stringify(mockFileContent)).toString('base64')

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'test-token'
  process.env.GITHUB_REPO = 'owner/repo'
  process.env.GITHUB_BRANCH = 'main'
  jest.resetAllMocks()
})

describe('readChallengeFile', () => {
  it('returns parsed data and sha', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: mockBase64 + '\n', sha: 'abc123' }),
    } as Response)

    const result = await readChallengeFile()

    expect(result.data).toEqual(mockFileContent)
    expect(result.sha).toBe('abc123')
  })

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(readChallengeFile()).rejects.toThrow('GitHub read failed: 404')
  })
})

describe('writeChallengeFile', () => {
  it('commits file with correct payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    await writeChallengeFile(mockFileContent, 'abc123', 'feat: test commit')

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toContain('/contents/data/challenge.json')
    const body = JSON.parse(options.body)
    expect(body.sha).toBe('abc123')
    expect(body.message).toBe('feat: test commit')
  })

  it('throws on 409 conflict', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
    } as Response)

    await expect(
      writeChallengeFile(mockFileContent, 'stale-sha', 'feat: test')
    ).rejects.toThrow('CONFLICT')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/__tests__/github.test.ts
```

Expected: FAIL — `readChallengeFile` not found.

- [ ] **Step 3: Implement github.ts**

```typescript
// lib/github.ts
import { ChallengeFile } from './types'

const BASE = 'https://api.github.com'
const FILE_PATH = 'data/challenge.json'

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

function repoUrl(path: string) {
  return `${BASE}/repos/${process.env.GITHUB_REPO}/contents/${path}?ref=${process.env.GITHUB_BRANCH ?? 'main'}`
}

export async function readChallengeFile(): Promise<{ data: ChallengeFile; sha: string }> {
  const res = await fetch(repoUrl(FILE_PATH), { headers: headers(), cache: 'no-store' })
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`)
  const json = await res.json()
  const content = Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  return { data: JSON.parse(content) as ChallengeFile, sha: json.sha }
}

export async function writeChallengeFile(
  data: ChallengeFile,
  sha: string,
  message: string
): Promise<void> {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
  const res = await fetch(
    `${BASE}/repos/${process.env.GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        message,
        content,
        sha,
        branch: process.env.GITHUB_BRANCH ?? 'main',
      }),
    }
  )
  if (res.status === 409) throw new Error('CONFLICT')
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status}`)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- lib/__tests__/github.test.ts
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/github.ts lib/__tests__/github.test.ts
git commit -m "feat: GitHub Contents API read/write lib"
```

---

### Task 6: Metrics lib

**Files:**
- Create: `lib/metrics.ts`
- Create: `lib/__tests__/metrics.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/metrics.test.ts`:

```typescript
import {
  getActiveChallenge,
  getApplicableGoals,
  computeStreak,
  computeBestStreak,
  computeConsistency,
  computePerfectDays,
} from '../metrics'
import { Challenge, ChallengeFile, Participant } from '../types'

const goal1 = { id: 'g1', name: 'Goal 1', startDate: '2026-04-07' }
const goal2 = { id: 'g2', name: 'Goal 2', startDate: '2026-04-10' } // added day 4

const participant: Participant = {
  id: 'p1', name: 'Test', color: '#fff', joinedDate: '2026-04-07',
  goals: [goal1, goal2],
}

const challenge: Challenge = {
  id: 'c1', name: 'Test', startDate: '2026-04-07', endDate: '2026-05-06',
  participants: [participant],
  entries: {
    '2026-04-07': { p1: { g1: true } },
    '2026-04-08': { p1: { g1: true } },
    '2026-04-09': { p1: { g1: true } },
    '2026-04-10': { p1: { g1: true, g2: true } }, // both goals applicable
    '2026-04-11': { p1: { g1: true, g2: false } }, // g2 missed
  },
}

describe('getActiveChallenge', () => {
  it('returns challenge where today is in range', () => {
    const file = { challenges: [challenge] }
    expect(getActiveChallenge(file, '2026-04-15')).toEqual(challenge)
  })

  it('returns null if no active challenge', () => {
    const file = { challenges: [challenge] }
    expect(getActiveChallenge(file, '2026-06-01')).toBeNull()
  })

  it('returns last matching challenge when multiple match', () => {
    const c2 = { ...challenge, id: 'c2' }
    const file = { challenges: [challenge, c2] }
    expect(getActiveChallenge(file, '2026-04-15')).toEqual(c2)
  })
})

describe('getApplicableGoals', () => {
  it('returns goals whose startDate <= date', () => {
    const goals = getApplicableGoals(participant, '2026-04-09')
    expect(goals).toEqual([goal1]) // goal2 starts 2026-04-10
  })

  it('includes goal on its own startDate', () => {
    const goals = getApplicableGoals(participant, '2026-04-10')
    expect(goals).toHaveLength(2)
  })
})

describe('computeStreak', () => {
  it('counts consecutive perfect days backwards from today when today is perfect', () => {
    // today = 2026-04-10, entries: 07✓ 08✓ 09✓ 10✓(both goals) → 4
    expect(computeStreak(participant, challenge.entries, '2026-04-10')).toBe(4)
  })

  it('counts from yesterday when today is not perfect', () => {
    // today = 2026-04-11: g2 missed → today not perfect → count from yesterday
    // yesterday (04-10) perfect, 04-09 perfect, 04-08 perfect, 04-07 perfect → 4
    expect(computeStreak(participant, challenge.entries, '2026-04-11')).toBe(4)
  })

  it('returns 0 when today has no entry and yesterday is also not perfect', () => {
    // today = 2026-04-12 (no entry), yesterday 04-11 not perfect → streak = 0
    expect(computeStreak(participant, challenge.entries, '2026-04-12')).toBe(0)
  })

  it('includes today if today is perfect', () => {
    const entriesWithToday = {
      ...challenge.entries,
      '2026-04-12': { p1: { g1: true, g2: true } },
    }
    // 04-12 perfect, 04-11 not perfect → streak = 1 (only today)
    expect(computeStreak(participant, entriesWithToday, '2026-04-12')).toBe(1)
  })
})

describe('computeConsistency', () => {
  it('calculates goals completed / goals possible', () => {
    // Days 07-11: 5 days
    // Day 07-09: only g1 applicable (1 goal each) = 3 possible, 3 completed
    // Day 10-11: g1+g2 applicable (2 goals each) = 4 possible
    //   Day 10: g1✓ g2✓ = 2 completed
    //   Day 11: g1✓ g2✗ = 1 completed
    // Total: 3+2+1 / 3+4 = 6/7 ≈ 85.7
    const pct = computeConsistency(participant, challenge, challenge.entries, '2026-04-11')
    expect(pct).toBeCloseTo(85.7, 1)
  })
})

describe('computePerfectDays', () => {
  it('counts days where all applicable goals were completed', () => {
    // Days 07,08,09,10 are perfect; day 11 is not
    const result = computePerfectDays(participant, challenge.entries, '2026-04-11')
    expect(result).toEqual({ count: 4, total: 5 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/__tests__/metrics.test.ts
```

Expected: FAIL — `computeStreak` not found.

- [ ] **Step 3: Implement metrics.ts**

```typescript
// lib/metrics.ts
import { ChallengeFile, Challenge, Participant, Entries } from './types'

export function getActiveChallenge(file: ChallengeFile, today: string): Challenge | null {
  const active = file.challenges.filter(c => c.startDate <= today && c.endDate >= today)
  return active.length > 0 ? active[active.length - 1] : null
}

export function getApplicableGoals(participant: Participant, date: string) {
  return participant.goals.filter(g => g.startDate <= date)
}

function isDayPerfect(participant: Participant, entries: Entries, date: string): boolean {
  const applicable = getApplicableGoals(participant, date)
  if (applicable.length === 0) return false
  const dayEntry = entries[date]?.[participant.id] ?? {}
  return applicable.every(g => dayEntry[g.id] === true)
}

function subtractDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function computeStreak(
  participant: Participant,
  entries: Entries,
  today: string
): number {
  // Per spec: today counts if it is perfect; otherwise count starts from yesterday
  const startFrom = isDayPerfect(participant, entries, today) ? today : subtractDays(today, 1)

  // Walk backwards one day at a time from startFrom
  // isDayPerfect returns false for missing entries, naturally handling gaps
  let streak = 0
  let current = startFrom

  while (current >= participant.joinedDate) {
    if (!isDayPerfect(participant, entries, current)) break
    streak++
    current = subtractDays(current, 1)
  }

  return streak
}

export function computeBestStreak(participant: Participant, entries: Entries): number {
  const dates = Object.keys(entries)
    .filter(d => d >= participant.joinedDate)
    .sort()

  let best = 0
  let current = 0
  let prev: string | null = null

  for (const date of dates) {
    if (prev !== null) {
      const diffDays = Math.round(
        (new Date(date).getTime() - new Date(prev).getTime()) / 86400000
      )
      if (diffDays > 1) current = 0
    }
    if (isDayPerfect(participant, entries, date)) {
      current++
      best = Math.max(best, current)
    } else {
      current = 0
    }
    prev = date
  }

  return best
}

export function computeConsistency(
  participant: Participant,
  challenge: Challenge,
  entries: Entries,
  today: string
): number {
  const start = participant.joinedDate > challenge.startDate
    ? participant.joinedDate
    : challenge.startDate
  const end = today < challenge.endDate ? today : challenge.endDate

  const dates = Object.keys(entries)
    .filter(d => d >= start && d <= end)
    .sort()

  let possible = 0
  let completed = 0

  for (const date of dates) {
    const applicable = getApplicableGoals(participant, date)
    const dayEntry = entries[date]?.[participant.id] ?? {}
    possible += applicable.length
    completed += applicable.filter(g => dayEntry[g.id] === true).length
  }

  if (possible === 0) return 0
  return Math.round((completed / possible) * 1000) / 10
}

export function computePerfectDays(
  participant: Participant,
  entries: Entries,
  today: string
): { count: number; total: number } {
  const dates = Object.keys(entries)
    .filter(d => d >= participant.joinedDate && d <= today)
    .sort()

  const count = dates.filter(d => isDayPerfect(participant, entries, d)).length
  return { count, total: dates.length }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- lib/__tests__/metrics.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics.ts lib/__tests__/metrics.test.ts
git commit -m "feat: metrics lib (streak, consistency, perfect days) with tests"
```

---

### Task 7: Server actions

**Files:**
- Create: `lib/actions.ts`
- Create: `lib/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/actions.test.ts`:

```typescript
import { saveEntries, extendChallenge } from '../actions'

const mockData = {
  challenges: [{
    id: 'c1', name: 'Test', startDate: '2026-04-07', endDate: '2026-05-06',
    participants: [], entries: {},
  }],
}

function mockGitHub(respondWith: { ok: boolean; status?: number } | 'conflict_then_ok') {
  let callCount = 0
  global.fetch = jest.fn().mockImplementation(() => {
    callCount++
    if (respondWith === 'conflict_then_ok') {
      if (callCount <= 2) {
        // First pair: read (ok) + write (409 conflict)
        if (callCount === 1) return Promise.resolve({ ok: true, json: async () => ({ content: Buffer.from(JSON.stringify(mockData)).toString('base64'), sha: 'sha1' }) })
        return Promise.resolve({ ok: false, status: 409 })
      }
      // Retry pair: read (ok) + write (ok)
      if (callCount === 3) return Promise.resolve({ ok: true, json: async () => ({ content: Buffer.from(JSON.stringify(mockData)).toString('base64'), sha: 'sha2' }) })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    }
    if (callCount % 2 === 1) {
      return Promise.resolve({ ok: true, json: async () => ({ content: Buffer.from(JSON.stringify(mockData)).toString('base64'), sha: 'sha1' }) })
    }
    return Promise.resolve({ ok: respondWith.ok, status: respondWith.status ?? 200, json: async () => ({}) })
  })
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'tok'
  process.env.GITHUB_REPO = 'owner/repo'
  process.env.GITHUB_BRANCH = 'main'
  jest.resetAllMocks()
})

describe('saveEntries', () => {
  it('rejects future dates', async () => {
    const future = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
    const result = await saveEntries('c1', future, {})
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/future/i)
  })

  it('saves successfully on first attempt', async () => {
    mockGitHub({ ok: true })
    const today = new Date().toISOString().slice(0, 10)
    const result = await saveEntries('c1', today, { p1: { g1: true } })
    expect(result.success).toBe(true)
  })

  it('retries once on 409 conflict and succeeds', async () => {
    mockGitHub('conflict_then_ok')
    const today = new Date().toISOString().slice(0, 10)
    const result = await saveEntries('c1', today, {})
    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(4) // read+write, read+write
  })
})

describe('extendChallenge', () => {
  it('rejects a new end date not after current end date', async () => {
    mockGitHub({ ok: true })
    const result = await extendChallenge('c1', '2026-05-06') // same as current
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/after/i)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

> **Note:** `lib/actions.ts` uses the `'use server'` directive. The `next/jest` config created in Task 1 handles this via `createJestConfig` — it strips the directive during transformation so tests import the module normally.

```bash
npm test -- lib/__tests__/actions.test.ts
```

Expected: FAIL — `saveEntries` not found.

- [ ] **Step 3: Write actions.ts**

```typescript
// lib/actions.ts
'use server'

import { readChallengeFile, writeChallengeFile } from './github'
import { ActionResult, Goal, Participant, ParticipantEntries } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'CONFLICT') {
      // Retry once on SHA conflict
      return await fn()
    }
    throw err
  }
}

// ── Public actions ────────────────────────────────────────────────────────────

export async function saveEntries(
  challengeId: string,
  date: string,
  entries: Record<string, ParticipantEntries> // participantId -> goalId -> boolean
): Promise<ActionResult> {
  if (date > todayISO()) return { success: false, error: 'Cannot save entries for a future date.' }

  try {
    await withRetry(async () => {
      const { data, sha } = await readChallengeFile()
      const challenge = data.challenges.find(c => c.id === challengeId)
      if (!challenge) throw new Error(`Challenge ${challengeId} not found`)

      challenge.entries[date] = { ...challenge.entries[date], ...entries }
      await writeChallengeFile(data, sha, `check-in: ${date} (${challengeId})`)
    })
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg === 'CONFLICT') return { success: false, error: 'Someone else saved at the same time — please refresh and try again.' }
    return { success: false, error: 'Save failed — please try again.' }
  }
}

export async function addGoal(
  challengeId: string,
  participantId: string,
  goal: Goal
): Promise<ActionResult> {
  try {
    const { data, sha } = await readChallengeFile()
    const participant = data.challenges
      .find(c => c.id === challengeId)
      ?.participants.find(p => p.id === participantId)
    if (!participant) return { success: false, error: 'Participant not found.' }
    if (participant.goals.find(g => g.id === goal.id))
      return { success: false, error: 'Goal ID already exists.' }

    participant.goals.push(goal)
    await writeChallengeFile(data, sha, `admin: add goal "${goal.name}" to ${participantId}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to add goal.' }
  }
}

export async function addParticipant(
  challengeId: string,
  participant: Participant
): Promise<ActionResult> {
  try {
    const { data, sha } = await readChallengeFile()
    const challenge = data.challenges.find(c => c.id === challengeId)
    if (!challenge) return { success: false, error: 'Challenge not found.' }
    if (challenge.participants.find(p => p.id === participant.id))
      return { success: false, error: 'Participant ID already exists.' }

    challenge.participants.push(participant)
    await writeChallengeFile(data, sha, `admin: add participant "${participant.name}"`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to add participant.' }
  }
}

export async function createChallenge(challenge: {
  id: string
  name: string
  startDate: string
  endDate: string
}): Promise<ActionResult> {
  try {
    const { data, sha } = await readChallengeFile()
    if (data.challenges.find(c => c.id === challenge.id))
      return { success: false, error: 'Challenge ID already exists.' }

    // Pre-populate participants + goals from most recent challenge
    const last = data.challenges[data.challenges.length - 1]
    const participants = last
      ? last.participants.map(p => ({
          ...p,
          joinedDate: challenge.startDate,
          goals: p.goals.map(g => ({ ...g, startDate: challenge.startDate })),
        }))
      : []

    data.challenges.push({ ...challenge, participants, entries: {} })
    await writeChallengeFile(data, sha, `admin: create challenge "${challenge.name}"`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to create challenge.' }
  }
}

export async function extendChallenge(
  challengeId: string,
  newEndDate: string
): Promise<ActionResult> {
  try {
    const { data, sha } = await readChallengeFile()
    const challenge = data.challenges.find(c => c.id === challengeId)
    if (!challenge) return { success: false, error: 'Challenge not found.' }
    if (newEndDate <= challenge.endDate)
      return { success: false, error: 'New end date must be after current end date.' }

    challenge.endDate = newEndDate
    await writeChallengeFile(data, sha, `admin: extend challenge to ${newEndDate}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to extend challenge.' }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- lib/__tests__/actions.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/actions.ts lib/__tests__/actions.test.ts
git commit -m "feat: server actions (saveEntries, addGoal, addParticipant, createChallenge, extendChallenge) with tests"
```

---

## Chunk 3: Auth

### Task 8: iron-session setup

**Files:**
- Create: `lib/session.ts`

- [ ] **Step 1: Write session config**

```typescript
// lib/session.ts
import { SessionOptions } from 'iron-session'

export interface SessionData {
  authenticated: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'challenge-tracker-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/session.ts
git commit -m "feat: iron-session config"
```

---

### Task 9: Auth middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write middleware**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)

  if (!session.authenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: auth middleware with iron-session"
```

---

### Task 10: Login page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`

- [ ] **Step 1: Write login server action**

```typescript
// app/login/actions.ts
'use server'

import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { redirect } from 'next/navigation'
import { SessionData, sessionOptions } from '@/lib/session'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string

  if (password !== process.env.APP_PASSWORD) {
    // Redirect back to login with error in query string
    redirect('/login?error=Incorrect+password.')
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.authenticated = true
  await session.save()

  redirect('/')
}
```

- [ ] **Step 2: Write login page**

```typescript
// app/login/page.tsx
import { loginAction } from './actions'

// searchParams is a Promise in Next.js 14 App Router — must be awaited
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-white text-xl font-bold mb-2">Challenge Tracker</h1>
        <p className="text-[#8b949e] text-sm mb-6">Enter the household password to continue.</p>
        <form action={loginAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2 text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
          />
          {params.error && (
            <p className="text-[#f85149] text-sm">{decodeURIComponent(params.error)}</p>
          )}
          <button
            type="submit"
            className="bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg py-2 font-medium transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test auth flow manually**

```bash
npm run dev
```

1. Open `http://localhost:3000` — should redirect to `/login`
2. Enter wrong password — should redirect to `/login?error=Incorrect+password.` and display the error message
3. Set `APP_PASSWORD=test` in `.env.local`, restart dev server, enter `test` — should redirect to `/`

- [ ] **Step 4: Commit**

```bash
git add app/login/page.tsx app/login/actions.ts
git commit -m "feat: login page with iron-session auth"
```

---

## Chunk 4: App Shell and Today Tab

### Task 11: Root layout and redirect

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write root layout**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Challenge Tracker',
  description: '30-day household challenge tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0d1117] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Write root redirect**

```typescript
// app/page.tsx
import { redirect } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import { getActiveChallenge } from '@/lib/metrics'

export default async function RootPage() {
  const { data } = await readChallengeFile()
  const today = new Date().toISOString().slice(0, 10)
  const active = getActiveChallenge(data, today)

  if (active) {
    redirect(`/challenge/${active.id}`)
  }

  // No active challenge: redirect to most recent past challenge
  const sorted = [...data.challenges].sort((a, b) => b.endDate.localeCompare(a.endDate))
  if (sorted.length > 0) {
    redirect(`/challenge/${sorted[0].id}`)
  }

  redirect('/admin')
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: root layout and active challenge redirect"
```

---

### Task 12: Header and TabBar components

**Files:**
- Create: `components/Header.tsx`
- Create: `components/TabBar.tsx`

- [ ] **Step 1: Write Header**

```typescript
// components/Header.tsx
// Note: no 'use client' needed — this is a pure display component used in Server Components
import { Challenge } from '@/lib/types'

interface HeaderProps {
  challenge: Challenge
  rightSlot?: React.ReactNode  // e.g. AdminDrawer button
}

function dayNumber(startDate: string, today: string): number {
  const start = new Date(startDate)
  const cur = new Date(today)
  return Math.floor((cur.getTime() - start.getTime()) / 86400000) + 1
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function Header({ challenge, rightSlot }: HeaderProps) {
  const today = new Date().toISOString().slice(0, 10)
  const day = dayNumber(challenge.startDate, today)
  const total = Math.ceil(
    (new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / 86400000
  ) + 1

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-white font-bold text-base">{challenge.name}</h1>
        <p className="text-[#8b949e] text-xs">
          {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)} · Day {day} of {total}
        </p>
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Write TabBar**

```typescript
// components/TabBar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TabBarProps {
  challengeId: string
}

export default function TabBar({ challengeId }: TabBarProps) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Today', href: `/challenge/${challengeId}` },
    { label: 'History', href: `/challenge/${challengeId}/history` },
    { label: 'Stats', href: `/challenge/${challengeId}/stats` },
  ]

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] flex">
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              active
                ? 'text-white border-[#238636]'
                : 'text-[#8b949e] border-transparent hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx components/TabBar.tsx
git commit -m "feat: Header and TabBar components"
```

---

### Task 13: GoalList component

**Files:**
- Create: `components/GoalList.tsx`
- Create: `components/__tests__/GoalList.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// components/__tests__/GoalList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import GoalList from '../GoalList'
import { Goal } from '@/lib/types'

const goals: Goal[] = [
  { id: 'g1', name: 'No Alcohol', startDate: '2026-04-07' },
  { id: 'g2', name: 'Exercise', startDate: '2026-04-07' },
]

it('renders all goals', () => {
  render(<GoalList goals={goals} checked={{}} onChange={jest.fn()} />)
  expect(screen.getByText('No Alcohol')).toBeInTheDocument()
  expect(screen.getByText('Exercise')).toBeInTheDocument()
})

it('calls onChange when goal is clicked', () => {
  const onChange = jest.fn()
  render(<GoalList goals={goals} checked={{}} onChange={onChange} />)
  fireEvent.click(screen.getByText('No Alcohol'))
  expect(onChange).toHaveBeenCalledWith('g1', true)
})

it('calls onChange with false when toggling off a checked goal', () => {
  const onChange = jest.fn()
  render(<GoalList goals={goals} checked={{ g1: true }} onChange={onChange} />)
  fireEvent.click(screen.getByText('No Alcohol'))
  expect(onChange).toHaveBeenCalledWith('g1', false)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- components/__tests__/GoalList.test.tsx
```

Expected: FAIL — `GoalList` not found.

- [ ] **Step 3: Implement GoalList**

```typescript
// components/GoalList.tsx
'use client'

import { Goal } from '@/lib/types'

interface GoalListProps {
  goals: Goal[]
  checked: Record<string, boolean>
  onChange: (goalId: string, value: boolean) => void
}

export default function GoalList({ goals, checked, onChange }: GoalListProps) {
  return (
    <div className="p-2 flex flex-col gap-1">
      {goals.map(goal => {
        const done = checked[goal.id] === true
        return (
          <button
            key={goal.id}
            onClick={() => onChange(goal.id, !done)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left w-full transition-colors ${
              done
                ? 'bg-[#238636] text-white'
                : 'bg-[#1f2937] border border-dashed border-[#30363d] text-[#8b949e]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] ${
                done ? 'bg-[#2ea043] text-white' : 'border border-[#444]'
              }`}
            >
              {done && '✓'}
            </div>
            <span className="text-xs">{goal.name}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- components/__tests__/GoalList.test.tsx
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/GoalList.tsx components/__tests__/GoalList.test.tsx
git commit -m "feat: GoalList component with toggle behavior and tests"
```

---

### Task 14: ParticipantColumn component

**Files:**
- Create: `components/ParticipantColumn.tsx`

- [ ] **Step 1: Write ParticipantColumn**

```typescript
// components/ParticipantColumn.tsx
'use client'

import { Participant } from '@/lib/types'
import GoalList from './GoalList'

interface ParticipantColumnProps {
  participant: Participant
  checked: Record<string, boolean>
  streak: number
  onChange: (goalId: string, value: boolean) => void
  date: string
}

export default function ParticipantColumn({
  participant, checked, streak, onChange, date,
}: ParticipantColumnProps) {
  const applicable = participant.goals.filter(g => g.startDate <= date)
  const completedCount = applicable.filter(g => checked[g.id] === true).length

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      <div className="bg-[#1f2937] px-3 py-2 flex items-center justify-between">
        <span className="font-bold text-sm" style={{ color: participant.color }}>
          {participant.name}
        </span>
        <span className="text-[#8b949e] text-xs">
          🔥 {streak} · {completedCount}/{applicable.length}
        </span>
      </div>
      <GoalList
        goals={applicable}
        checked={checked}
        onChange={onChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ParticipantColumn.tsx
git commit -m "feat: ParticipantColumn component"
```

---

### Task 15: TodayView and Today page

**Files:**
- Create: `components/TodayView.tsx`
- Create: `app/challenge/[id]/page.tsx`

- [ ] **Step 1: Write TodayView**

```typescript
// components/TodayView.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Challenge, ParticipantEntries } from '@/lib/types'
import { saveEntries } from '@/lib/actions'
import ParticipantColumn from './ParticipantColumn'
import { computeStreak } from '@/lib/metrics'

interface TodayViewProps {
  challenge: Challenge
  today: string
  initialEntries: Record<string, Record<string, boolean>>
  onSaveRef?: (fn: () => void) => void
}

export default function TodayView({ challenge, today, initialEntries }: TodayViewProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<Record<string, Record<string, boolean>>>(initialEntries)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleChange(participantId: string, goalId: string, value: boolean) {
    setEntries(prev => ({
      ...prev,
      [participantId]: { ...(prev[participantId] ?? {}), [goalId]: value },
    }))
  }

  function handleSave() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await saveEntries(challenge.id, today, entries)
      if (result.success) {
        setSuccess(true)
        router.refresh() // Re-fetch server data so streaks/stats reflect the new save
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error ?? 'Save failed.')
        // Client state is preserved so the user can retry without re-entering
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Save button row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <p className="text-[#8b949e] text-xs">
          {new Date(today + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · tap to toggle
        </p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Today'}
        </button>
      </div>

      {/* Toast messages */}
      {error && (
        <div className="mx-4 mt-2 bg-[#da3633]/20 border border-[#da3633] text-[#f85149] text-xs px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-2 bg-[#238636]/20 border border-[#238636] text-[#3fb950] text-xs px-3 py-2 rounded-md">
          Saved!
        </div>
      )}

      {/* Side-by-side columns */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {challenge.participants.map(participant => (
          <ParticipantColumn
            key={participant.id}
            participant={participant}
            checked={entries[participant.id] ?? {}}
            streak={computeStreak(participant, challenge.entries, today)}
            onChange={(goalId, value) => handleChange(participant.id, goalId, value)}
            date={today}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write Today page**

```typescript
// app/challenge/[id]/page.tsx
import { notFound } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import TodayView from '@/components/TodayView'

export default async function TodayPage({ params }: { params: { id: string } }) {
  const { data } = await readChallengeFile()
  const challenge = data.challenges.find(c => c.id === params.id)
  if (!challenge) notFound()

  const today = new Date().toISOString().slice(0, 10)
  const initialEntries = challenge.entries[today] ?? {}

  return (
    // Note: AdminDrawer is wired into Header in Task 19 Step 2. For now render Header without rightSlot.
    <div className="flex flex-col min-h-screen">
      <Header challenge={challenge} />
      <TabBar challengeId={params.id} />
      <TodayView
        challenge={challenge}
        today={today}
        initialEntries={initialEntries}
      />
    </div>
  )
}
```

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Set env vars in `.env.local`. Open `http://localhost:3000`. Verify:
- Login page appears
- After login, redirects to today tab
- Two participant columns render side-by-side
- Tapping a goal toggles green/grey
- "Save Today" commits to GitHub (check repo)

- [ ] **Step 4: Commit**

```bash
git add components/TodayView.tsx app/challenge/
git commit -m "feat: Today tab with side-by-side check-in and save"
```

---

## Chunk 5: History and Stats Tabs

### Task 16: HistoryGrid and History page

**Files:**
- Create: `components/HistoryGrid.tsx`
- Create: `app/challenge/[id]/history/page.tsx`

- [ ] **Step 1: Write HistoryGrid**

```typescript
// components/HistoryGrid.tsx
import { Challenge } from '@/lib/types'

interface HistoryGridProps {
  challenge: Challenge
  today: string
}

function cellColor(score: number): string {
  if (score < 0) return 'bg-[#1f2937] text-[#555]'    // no entry / future
  if (score >= 90) return 'bg-[#238636] text-white'   // dark green ≥90%
  if (score >= 70) return 'bg-[#2ea043] text-white'   // green 70–89%
  if (score >= 50) return 'bg-[#9e6a03] text-white'   // yellow 50–69%
  return 'bg-[#da3633] text-white'                     // red <50%
}

function combinedScore(challenge: Challenge, date: string): number {
  const dayEntry = challenge.entries[date]
  if (!dayEntry) return -1

  let possible = 0
  let completed = 0

  for (const participant of challenge.participants) {
    const applicable = participant.goals.filter(g => g.startDate <= date)
    const pEntry = dayEntry[participant.id] ?? {}
    possible += applicable.length
    completed += applicable.filter(g => pEntry[g.id] === true).length
  }

  if (possible === 0) return -1
  return Math.round((completed / possible) * 100)
}

export default function HistoryGrid({ challenge, today }: HistoryGridProps) {
  // Build array of all dates from startDate to min(endDate, today)
  const start = new Date(challenge.startDate)
  const end = new Date(Math.min(new Date(challenge.endDate).getTime(), new Date(today).getTime()))

  const dates: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }

  const hasAnyEntries = Object.keys(challenge.entries).length > 0

  if (dates.length === 0) {
    return <p className="text-[#8b949e] text-sm p-4">No entries yet.</p>
  }

  // Show message when challenge has started but no entries recorded
  if (!hasAnyEntries) {
    // Still render the grid (all cells grey), but show the message below
  }

  // Pad to start on Monday
  const firstDow = start.getDay() // 0=Sun
  const mondayPad = firstDow === 0 ? 6 : firstDow - 1
  const padded = Array(mondayPad).fill(null).concat(dates)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7).concat(Array(7).fill(null)).slice(0, 7))
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-[#8b949e] text-xs pb-1">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((date, di) => {
            if (!date) return <div key={di} />
            const score = combinedScore(challenge, date)
            const isFuture = date > today
            const color = isFuture ? 'bg-[#1f2937] text-[#555]' : cellColor(score)
            const day = new Date(date + 'T00:00:00').getDate()

            // Scores for each participant
            const dayEntry = challenge.entries[date]
            const scoreStr = challenge.participants
              .map(p => {
                if (!dayEntry) return '—'
                const applicable = p.goals.filter(g => g.startDate <= date)
                const pEntry = dayEntry[p.id] ?? {}
                const done = applicable.filter(g => pEntry[g.id] === true).length
                return `${done}`
              })
              .join('·')

            return (
              <div
                key={di}
                className={`${color} rounded text-center py-1 px-0.5`}
                title={date}
              >
                <div className="text-[10px] font-medium">{day}</div>
                <div className="text-[8px] opacity-80">{isFuture ? '' : scoreStr}</div>
              </div>
            )
          })}
        </div>
      ))}
      {!hasAnyEntries && (
        <p className="text-[#8b949e] text-sm mt-3">No entries yet. Check in today to get started.</p>
      )}
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          { color: 'bg-[#238636]', label: '≥90%' },
          { color: 'bg-[#2ea043]', label: '70–89%' },
          { color: 'bg-[#9e6a03]', label: '50–69%' },
          { color: 'bg-[#da3633]', label: '<50%' },
          { color: 'bg-[#1f2937]', label: 'No entry / future' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-[#8b949e] text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write History page**

```typescript
// app/challenge/[id]/history/page.tsx
import { notFound } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import HistoryGrid from '@/components/HistoryGrid'

export default async function HistoryPage({ params }: { params: { id: string } }) {
  const { data } = await readChallengeFile()
  const challenge = data.challenges.find(c => c.id === params.id)
  if (!challenge) notFound()

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-col min-h-screen">
      <Header challenge={challenge} />
      <TabBar challengeId={params.id} />
      <HistoryGrid challenge={challenge} today={today} />
    </div>
  )
}
```

- [ ] **Step 3: Smoke test**

Navigate to History tab. Verify:
- Calendar grid renders from challenge start date
- Colour coded cells
- Day numbers and score strings visible
- Legend renders below grid

- [ ] **Step 4: Commit**

```bash
git add components/HistoryGrid.tsx app/challenge/[id]/history/page.tsx
git commit -m "feat: History tab with weekly calendar grid"
```

---

### Task 17: StatsPanel and Stats page

**Files:**
- Create: `components/StatsPanel.tsx`
- Create: `app/challenge/[id]/stats/page.tsx`

- [ ] **Step 1: Write StatsPanel**

```typescript
// components/StatsPanel.tsx
import { Challenge, Participant } from '@/lib/types'
import {
  computeStreak,
  computeBestStreak,
  computeConsistency,
  computePerfectDays,
} from '@/lib/metrics'

interface StatsPanelProps {
  challenge: Challenge
  today: string
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#30363d] last:border-0">
      <span className="text-[#8b949e] text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}

function ParticipantStats({
  participant,
  challenge,
  today,
}: {
  participant: Participant
  challenge: Challenge
  today: string
}) {
  const hasEntries = Object.keys(challenge.entries).length > 0

  const streak = hasEntries ? computeStreak(participant, challenge.entries, today) : null
  const best = hasEntries ? computeBestStreak(participant, challenge.entries) : null
  const consistency = hasEntries ? computeConsistency(participant, challenge, challenge.entries, today) : null
  const perfectDays = hasEntries ? computePerfectDays(participant, challenge.entries, today) : null

  return (
    <div className="bg-[#1f2937] rounded-xl p-4">
      <p className="font-bold text-sm mb-3" style={{ color: participant.color }}>
        {participant.name}
      </p>
      <StatRow
        label="Current streak"
        value={streak !== null ? `🔥 ${streak} day${streak !== 1 ? 's' : ''}` : '—'}
      />
      <StatRow
        label="Best streak"
        value={best !== null ? `${best} day${best !== 1 ? 's' : ''}` : '—'}
      />
      <StatRow
        label="Consistency"
        value={consistency !== null ? `${consistency.toFixed(1)}%` : '—'}
      />
      <StatRow
        label="Perfect days"
        value={perfectDays !== null ? `${perfectDays.count} / ${perfectDays.total}` : '—'}
      />
    </div>
  )
}

export default function StatsPanel({ challenge, today }: StatsPanelProps) {
  return (
    <div className="p-4 grid grid-cols-2 gap-3">
      {challenge.participants.map(p => (
        <ParticipantStats key={p.id} participant={p} challenge={challenge} today={today} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write Stats page**

```typescript
// app/challenge/[id]/stats/page.tsx
import { notFound } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import StatsPanel from '@/components/StatsPanel'

export default async function StatsPage({ params }: { params: { id: string } }) {
  const { data } = await readChallengeFile()
  const challenge = data.challenges.find(c => c.id === params.id)
  if (!challenge) notFound()

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-col min-h-screen">
      <Header challenge={challenge} />
      <TabBar challengeId={params.id} />
      <StatsPanel challenge={challenge} today={today} />
    </div>
  )
}
```

- [ ] **Step 3: Smoke test**

Navigate to Stats tab. Verify:
- Two participant cards render side-by-side
- Streak, best streak, consistency %, perfect days shown
- Stats show `—` for each metric when no entries exist

- [ ] **Step 4: Commit**

```bash
git add components/StatsPanel.tsx app/challenge/[id]/stats/page.tsx
git commit -m "feat: Stats tab with streak, consistency, and perfect days"
```

---

## Chunk 6: Admin Panel and Deployment

### Task 18: AdminDrawer component

**Files:**
- Create: `components/AdminDrawer.tsx`

- [ ] **Step 1: Write AdminDrawer**

```typescript
// components/AdminDrawer.tsx
'use client'

import { useState, useTransition } from 'react'
import { addGoal, addParticipant, createChallenge, extendChallenge } from '@/lib/actions'
import { ActionResult } from '@/lib/types'

type AdminView = 'menu' | 'addGoal' | 'addParticipant' | 'newChallenge' | 'extend'

interface AdminDrawerProps {
  challengeId: string
  participantIds: { id: string; name: string }[]
  currentEndDate: string
}

function ResultMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null
  return (
    <p className={`text-xs mt-2 ${result.success ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
      {result.success ? 'Saved successfully!' : result.error}
    </p>
  )
}

export default function AdminDrawer({ challengeId, participantIds, currentEndDate }: AdminDrawerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AdminView>('menu')
  const [result, setResult] = useState<ActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() { setView('menu'); setResult(null) }
  function action(fn: () => Promise<ActionResult>) {
    setResult(null)
    startTransition(async () => {
      const r = await fn()
      setResult(r)
      if (r.success) setTimeout(reset, 1500)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#1f2937] border border-[#30363d] text-[#8b949e] text-xs px-3 py-1.5 rounded-md hover:text-white transition-colors"
      >
        ⚙ Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setOpen(false); reset() }} />
          <div className="relative bg-[#161b22] border-l border-[#30363d] w-80 h-full overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">Admin</h2>
              <button onClick={() => { setOpen(false); reset() }} className="text-[#8b949e] hover:text-white text-lg">✕</button>
            </div>

            {view === 'menu' && (
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Add goal to participant', view: 'addGoal' as AdminView },
                  { label: 'Add participant', view: 'addParticipant' as AdminView },
                  { label: 'Create new challenge', view: 'newChallenge' as AdminView },
                  { label: 'Extend challenge', view: 'extend' as AdminView },
                ].map(item => (
                  <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className="bg-[#1f2937] border border-[#30363d] text-white text-sm px-4 py-2.5 rounded-lg hover:border-[#58a6ff] text-left transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {view === 'addGoal' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  action(() => addGoal(
                    challengeId,
                    fd.get('participantId') as string,
                    {
                      id: (fd.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
                      name: fd.get('name') as string,
                      startDate: fd.get('startDate') as string,
                    }
                  ))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">Add Goal</h3>
                <select name="participantId" required className="input-field">
                  {participantIds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input name="name" placeholder="Goal name" required className="input-field" />
                <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="input-field" />
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Save'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}

            {view === 'addParticipant' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const today = new Date().toISOString().slice(0, 10)
                  action(() => addParticipant(challengeId, {
                    id: (fd.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
                    name: fd.get('name') as string,
                    color: fd.get('color') as string,
                    joinedDate: fd.get('joinedDate') as string ?? today,
                    goals: [],
                  }))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">Add Participant</h3>
                <input name="name" placeholder="Name" required className="input-field" />
                <div className="flex items-center gap-2">
                  <label className="text-[#8b949e] text-xs">Colour</label>
                  <input name="color" type="color" defaultValue="#60a5fa" className="h-8 w-16 rounded cursor-pointer" />
                </div>
                <input name="joinedDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="input-field" />
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Save'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}

            {view === 'newChallenge' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const name = fd.get('name') as string
                  const startDate = fd.get('startDate') as string
                  action(() => createChallenge({
                    id: startDate + '-' + name.toLowerCase().replace(/\s+/g, '-'),
                    name,
                    startDate,
                    endDate: fd.get('endDate') as string,
                  }))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">New Challenge</h3>
                <input name="name" placeholder="Challenge name" required className="input-field" />
                <input name="startDate" type="date" required className="input-field" />
                <input name="endDate" type="date" required className="input-field" />
                <p className="text-[#8b949e] text-xs">Goals will be pre-populated from the current challenge.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Create'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}

            {view === 'extend' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  action(() => extendChallenge(challengeId, fd.get('newEndDate') as string))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">Extend Challenge</h3>
                <p className="text-[#8b949e] text-xs">Current end date: {currentEndDate}</p>
                <input name="newEndDate" type="date" required min={currentEndDate} className="input-field" />
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Extend'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Add Tailwind utility classes to globals.css**

Append to `app/globals.css`:

```css
@layer components {
  .input-field {
    @apply bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white text-sm placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] w-full;
  }
  .btn-primary {
    @apply bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-sm py-2 rounded-lg font-medium transition-colors;
  }
  .btn-secondary {
    @apply bg-[#1f2937] border border-[#30363d] text-[#8b949e] hover:text-white text-sm py-2 rounded-lg transition-colors;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/AdminDrawer.tsx app/globals.css
git commit -m "feat: AdminDrawer with add goal, add participant, new challenge, extend"
```

---

### Task 19: Admin page and wire AdminDrawer into Header

**Files:**
- Create: `app/admin/page.tsx`
- Modify: `app/challenge/[id]/page.tsx`
- Modify: `app/challenge/[id]/history/page.tsx`
- Modify: `app/challenge/[id]/stats/page.tsx`

- [ ] **Step 1: Write admin page**

```typescript
// app/admin/page.tsx
import { readChallengeFile } from '@/lib/github'
import AdminDrawer from '@/components/AdminDrawer'
import { getActiveChallenge } from '@/lib/metrics'

export default async function AdminPage() {
  const { data } = await readChallengeFile()
  const today = new Date().toISOString().slice(0, 10)
  const challenge = getActiveChallenge(data, today) ?? data.challenges[data.challenges.length - 1]

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#8b949e]">No challenges found. Create one below.</p>
        <AdminDrawer challengeId="" participantIds={[]} currentEndDate="" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">Admin</h1>
          <p className="text-[#8b949e] text-sm">Managing: {challenge.name}</p>
        </div>
        <AdminDrawer
          challengeId={challenge.id}
          participantIds={challenge.participants.map(p => ({ id: p.id, name: p.name }))}
          currentEndDate={challenge.endDate}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire AdminDrawer into Today page**

In `app/challenge/[id]/page.tsx`, update the return block to pass `AdminDrawer` via the `rightSlot` prop:

```typescript
// app/challenge/[id]/page.tsx — full return block
return (
  <div className="flex flex-col min-h-screen">
    <Header
      challenge={challenge}
      rightSlot={
        <AdminDrawer
          challengeId={params.id}
          participantIds={challenge.participants.map(p => ({ id: p.id, name: p.name }))}
          currentEndDate={challenge.endDate}
        />
      }
    />
    <TabBar challengeId={params.id} />
    <TodayView challenge={challenge} today={today} initialEntries={initialEntries} />
  </div>
)
```

- [ ] **Step 3: Wire AdminDrawer into History page**

In `app/challenge/[id]/history/page.tsx`, update the return block:

```typescript
// app/challenge/[id]/history/page.tsx — full return block
return (
  <div className="flex flex-col min-h-screen">
    <Header
      challenge={challenge}
      rightSlot={
        <AdminDrawer
          challengeId={params.id}
          participantIds={challenge.participants.map(p => ({ id: p.id, name: p.name }))}
          currentEndDate={challenge.endDate}
        />
      }
    />
    <TabBar challengeId={params.id} />
    <HistoryGrid challenge={challenge} today={today} />
  </div>
)
```

- [ ] **Step 4: Wire AdminDrawer into Stats page**

In `app/challenge/[id]/stats/page.tsx`, update the return block:

```typescript
// app/challenge/[id]/stats/page.tsx — full return block
return (
  <div className="flex flex-col min-h-screen">
    <Header
      challenge={challenge}
      rightSlot={
        <AdminDrawer
          challengeId={params.id}
          participantIds={challenge.participants.map(p => ({ id: p.id, name: p.name }))}
          currentEndDate={challenge.endDate}
        />
      }
    />
    <TabBar challengeId={params.id} />
    <StatsPanel challenge={challenge} today={today} />
  </div>
)
```

- [ ] **Step 5: Smoke test admin flows**

```bash
npm run dev
```

Verify:
- ⚙ Admin button opens slide-out drawer
- "Add goal" form submits and commits to GitHub
- "Extend challenge" updates endDate in JSON

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx app/challenge/
git commit -m "feat: admin page and AdminDrawer wired into all tabs"
```

---

### Task 20: Vercel deployment

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Ensure build passes**

```bash
npm run build
```

Expected: `✓ Compiled successfully`. Fix any TypeScript or lint errors before continuing.

- [ ] **Step 2: Create vercel.json** (optional but good to have)

```json
{
  "framework": "nextjs"
}
```

- [ ] **Step 3: Push to GitHub**

Create a new **private** GitHub repo named `challenge-tracker`. Then:

```bash
git remote add origin https://github.com/<username>/challenge-tracker.git
git push -u origin main
```

- [ ] **Step 4: Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import `challenge-tracker`
2. Set environment variables:
   - `APP_PASSWORD` — your household password
   - `SESSION_SECRET` — run `openssl rand -hex 32` to generate a 64-char hex secret (256-bit entropy)
   - `GITHUB_TOKEN` — fine-grained PAT with `contents: write` on this repo
   - `GITHUB_REPO` — `<username>/challenge-tracker`
   - `GITHUB_BRANCH` — `main`
3. Click Deploy.

- [ ] **Step 5: Verify production**

1. Open the Vercel URL
2. Login with `APP_PASSWORD`
3. Verify today tab loads
4. Toggle a goal and save — verify commit appears in GitHub

- [ ] **Step 6: Final commit**

```bash
git add vercel.json
git commit -m "chore: add vercel.json for deployment"
git push
```

---

## Run All Tests

```bash
npm test
```

Expected:
- `lib/__tests__/github.test.ts` — 4 passing
- `lib/__tests__/metrics.test.ts` — all passing
- `components/__tests__/GoalList.test.tsx` — 3 passing
