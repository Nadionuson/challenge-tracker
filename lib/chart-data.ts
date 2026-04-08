// lib/chart-data.ts
import { Challenge, Entries, Goal } from './types'
import { isGoalApplicableOnDate, computeGoalCompletion } from './metrics'

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const result = new Date(Date.UTC(y, m - 1, d + n))
  return result.toISOString().slice(0, 10)
}

const CATEGORY_MAP: [string[], string][] = [
  [['eat', 'food', 'diet', 'nutrition', 'sugar', 'meal', 'snack', 'calor', 'alcohol', 'carbs', 'drink', 'fruit'], 'Diet'],
  [['workout', 'exercise', 'gym', 'fitness', 'run', 'walk', 'train', 'sport', 'steps'], 'Fitness'],
  [['growth', 'learn', 'read', 'study', 'book', 'journal', 'reflect', 'goal'], 'Growth'],
  [['sleep', 'rest', 'recover', 'nap', 'bed'], 'Sleep'],
  [['meditat', 'mindful', 'breath', 'calm', 'stress', 'relax'], 'Mindfulness'],
  [['water', 'hydrat'], 'Hydration'],
  [['social', 'connect', 'family', 'friend', 'call', 'talk'], 'Social'],
  [['screen', 'phone', 'digital', 'social media', 'tv', 'instagram', 'tiktok'], 'Digital Detox'],
  [['cook', 'meal prep', 'recipe'], 'Cooking'],
  [['gratitude', 'thankful', 'positive', 'affirmation'], 'Gratitude'],
]

export function inferCategory(goal: Goal): string {
  const c = (goal.category ?? goal.name ?? '').toLowerCase()
  for (const [keywords, label] of CATEGORY_MAP) {
    if (keywords.some(k => c.includes(k))) return label
  }
  return goal.category || 'Other'
}

export interface DailyCompletionPoint {
  date: string
  label: string
  [participantId: string]: number | string
}

export function computeDailyCompletion(
  challenge: Challenge,
  today: string
): DailyCompletionPoint[] {
  const end = today < challenge.endDate ? today : challenge.endDate
  const points: DailyCompletionPoint[] = []
  let current = challenge.startDate

  while (current <= end) {
    const point: DailyCompletionPoint = {
      date: current,
      label: current.slice(5),
    }
    for (const p of challenge.participants) {
      const applicable = p.goals.filter(
        g => g.startDate <= current && isGoalApplicableOnDate(g, current)
      )
      if (applicable.length === 0) { point[p.id] = 0; continue }
      const dayEntry = challenge.entries[current]?.[p.id] ?? {}
      const done = applicable.filter(g => dayEntry[g.id] === true).length
      point[p.id] = Math.round((done / applicable.length) * 100)
    }
    points.push(point)
    current = addDays(current, 1)
  }
  return points
}

export interface GoalCompletionBar {
  name: string
  goalId: string
  category: string
  [participantId: string]: number | string
}

export function computeGoalCompletionBars(
  challenge: Challenge,
  today: string
): GoalCompletionBar[] {
  const goalMap = new Map<string, GoalCompletionBar>()

  for (const p of challenge.participants) {
    for (const g of p.goals) {
      const { completed, total } = computeGoalCompletion(
        g, p.id, challenge.entries, challenge.startDate, today
      )
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0

      if (!goalMap.has(g.id)) {
        goalMap.set(g.id, {
          name: g.name,
          goalId: g.id,
          category: inferCategory(g),
        })
      }
      goalMap.get(g.id)![p.id] = pct
    }
  }
  return [...goalMap.values()]
}

export interface CategoryBar {
  category: string
  [participantId: string]: number | string
}

export function computeCategoryBars(
  challenge: Challenge,
  today: string
): CategoryBar[] {
  const catMap = new Map<string, Record<string, { completed: number; total: number }>>()

  for (const p of challenge.participants) {
    for (const g of p.goals) {
      const cat = inferCategory(g)
      if (!catMap.has(cat)) catMap.set(cat, {})
      const bucket = catMap.get(cat)!
      if (!bucket[p.id]) bucket[p.id] = { completed: 0, total: 0 }

      const { completed, total } = computeGoalCompletion(
        g, p.id, challenge.entries, challenge.startDate, today
      )
      bucket[p.id].completed += completed
      bucket[p.id].total += total
    }
  }

  return [...catMap.entries()].map(([category, pData]) => {
    const bar: CategoryBar = { category }
    for (const [pid, { completed, total }] of Object.entries(pData)) {
      bar[pid] = total > 0 ? Math.round((completed / total) * 100) : 0
    }
    return bar
  })
}

export interface Insight {
  icon: string
  text: string
  type: 'positive' | 'negative' | 'neutral'
}

export function generateInsights(
  challenge: Challenge,
  today: string
): Insight[] {
  const insights: Insight[] = []
  const entries = challenge.entries
  const dates = Object.keys(entries).filter(d => d <= today).sort()

  if (dates.length === 0) {
    return [{ icon: '📊', text: 'No data yet — start tracking to see insights.', type: 'neutral' }]
  }

  for (const p of challenge.participants) {
    const goalStats = p.goals.map(g => {
      const { completed, total } = computeGoalCompletion(g, p.id, entries, challenge.startDate, today)
      return { goal: g, pct: total > 0 ? (completed / total) * 100 : 0 }
    }).sort((a, b) => b.pct - a.pct)

    if (goalStats.length > 0) {
      const best = goalStats[0]
      const worst = goalStats[goalStats.length - 1]
      if (best.pct > 0) {
        insights.push({
          icon: '🏆',
          text: `${p.name}'s strongest goal is "${best.goal.name}" at ${best.pct.toFixed(0)}%.`,
          type: 'positive',
        })
      }
      if (worst.pct < 100 && goalStats.length > 1) {
        insights.push({
          icon: '⚠️',
          text: `${p.name}'s most challenging goal is "${worst.goal.name}" at ${worst.pct.toFixed(0)}%.`,
          type: 'negative',
        })
      }
    }

    const dowCounts: Record<number, { done: number; possible: number }> = {}
    for (const date of dates) {
      const [y, m, d] = date.split('-').map(Number)
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
      if (!dowCounts[dow]) dowCounts[dow] = { done: 0, possible: 0 }
      const applicable = p.goals.filter(g => g.startDate <= date && isGoalApplicableOnDate(g, date))
      const dayEntry = entries[date]?.[p.id] ?? {}
      dowCounts[dow].possible += applicable.length
      dowCounts[dow].done += applicable.filter(g => dayEntry[g.id] === true).length
    }
    const dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let bestDow = -1, bestDowPct = -1
    for (const [dow, { done, possible }] of Object.entries(dowCounts)) {
      if (possible > 0) {
        const pct = (done / possible) * 100
        if (pct > bestDowPct) { bestDowPct = pct; bestDow = Number(dow) }
      }
    }
    if (bestDow >= 0) {
      insights.push({
        icon: '📅',
        text: `${p.name} performs best on ${dowNames[bestDow]}s (${bestDowPct.toFixed(0)}%).`,
        type: 'neutral',
      })
    }
  }

  if (challenge.participants.length > 1) {
    const catBars = computeCategoryBars(challenge, today)
    for (const bar of catBars) {
      const pids = challenge.participants.map(p => p.id)
      const vals = pids.map(pid => ({ pid, pct: (bar[pid] as number) || 0 }))
      vals.sort((a, b) => b.pct - a.pct)
      if (vals[0].pct - vals[vals.length - 1].pct > 20) {
        const leader = challenge.participants.find(p => p.id === vals[0].pid)!
        insights.push({
          icon: '🏅',
          text: `${leader.name} leads in ${bar.category} (${vals[0].pct}% vs ${vals[vals.length - 1].pct}%).`,
          type: 'neutral',
        })
      }
    }
  }

  return insights
}
