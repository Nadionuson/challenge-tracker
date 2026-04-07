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
