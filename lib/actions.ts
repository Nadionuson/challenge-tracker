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
  return addGoalToParticipants(challengeId, [participantId], goal)
}

export async function addGoalToParticipants(
  challengeId: string,
  participantIds: string[], // pass ['__all__'] to add to every participant
  goal: Goal
): Promise<ActionResult> {
  try {
    const { data, sha } = await readChallengeFile()
    const challenge = data.challenges.find(c => c.id === challengeId)
    if (!challenge) return { success: false, error: 'Challenge not found.' }

    const targets = participantIds[0] === '__all__'
      ? challenge.participants
      : challenge.participants.filter(p => participantIds.includes(p.id))

    if (targets.length === 0) return { success: false, error: 'Participant not found.' }

    for (const participant of targets) {
      if (!participant.goals.find(g => g.id === goal.id)) {
        participant.goals.push(goal)
      }
    }

    const who = participantIds[0] === '__all__' ? 'all' : participantIds.join(', ')
    await writeChallengeFile(data, sha, `admin: add goal "${goal.name}" to ${who}`)
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
