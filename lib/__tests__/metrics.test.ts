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
