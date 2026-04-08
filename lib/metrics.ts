// lib/metrics.ts
import { ChallengeFile, Challenge, Participant, Entries, Goal } from './types'

export function getActiveChallenge(file: ChallengeFile, today: string): Challenge | null {
  const active = file.challenges.filter(c => c.startDate <= today && c.endDate >= today)
  return active.length > 0 ? active[active.length - 1] : null
}

export function isGoalApplicableOnDate(goal: Goal, date: string): boolean {
  if (!goal.frequency || goal.frequency === 'daily') return true
  const [y, m, d] = date.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=Sun, 6=Sat
  if (goal.frequency === 'weekdays') return dow >= 1 && dow <= 5
  if (goal.frequency === 'weekends') return dow === 0 || dow === 6
  return true
}

export function getApplicableGoals(participant: Participant, date: string) {
  return participant.goals.filter(g => g.startDate <= date && isGoalApplicableOnDate(g, date))
}

function isDayPerfect(participant: Participant, entries: Entries, date: string): boolean {
  const applicable = getApplicableGoals(participant, date)
  if (applicable.length === 0) return false
  const dayEntry = entries[date]?.[participant.id] ?? {}
  return applicable.every(g => dayEntry[g.id] === true)
}

function subtractDays(date: string, days: number): string {
  const [y, m, day] = date.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, day - days))
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
