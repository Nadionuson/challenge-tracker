'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Challenge, ParticipantEntries } from '@/lib/types'
import { saveEntries } from '@/lib/actions'
import ParticipantColumn from './ParticipantColumn'
import { computeStreak, computeGoalStreak, computeGoalCompletion, getApplicableGoals } from '@/lib/metrics'

interface TodayViewProps {
  challenge: Challenge
  today: string
  initialEntries: Record<string, Record<string, boolean>>
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const result = new Date(Date.UTC(y, m - 1, d + n))
  return result.toISOString().slice(0, 10)
}

export default function TodayView({ challenge, today, initialEntries }: TodayViewProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(today)
  const [entriesByDate, setEntriesByDate] = useState<Record<string, Record<string, Record<string, boolean>>>>({
    [today]: initialEntries,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const entries = entriesByDate[selectedDate] ?? {}

  function handleChange(participantId: string, goalId: string, value: boolean) {
    setEntriesByDate(prev => ({
      ...prev,
      [selectedDate]: {
        ...(prev[selectedDate] ?? {}),
        [participantId]: { ...(prev[selectedDate]?.[participantId] ?? {}), [goalId]: value },
      },
    }))
  }

  function navigateDate(delta: number) {
    const next = addDays(selectedDate, delta)
    if (next > today) return
    if (next < challenge.startDate) return
    setError(null)
    setSuccess(false)
    setSelectedDate(next)
    if (!entriesByDate[next]) {
      setEntriesByDate(prev => ({
        ...prev,
        [next]: challenge.entries[next] ?? {},
      }))
    }
  }

  function handleSave() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await saveEntries(challenge.id, selectedDate, entries)
      if (result.success) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error ?? 'Save failed.')
      }
    })
  }

  const isToday = selectedDate === today
  const canGoBack = selectedDate > challenge.startDate

  return (
    <div className="flex flex-col h-full">
      {/* Date nav + save row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            disabled={!canGoBack}
            className="text-[#8b949e] hover:text-white disabled:opacity-30 transition-colors px-1"
            aria-label="Previous day"
          >
            ‹
          </button>
          <p className="text-[#8b949e] text-xs">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            {isToday ? ' · tap to toggle' : ''}
          </p>
          <button
            onClick={() => navigateDate(1)}
            disabled={isToday}
            className="text-[#8b949e] hover:text-white disabled:opacity-30 transition-colors px-1"
            aria-label="Next day"
          >
            ›
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
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
        {challenge.participants.map(participant => {
          const applicable = getApplicableGoals(participant, selectedDate)
          const goalStats: Record<string, { streak: number; completed: number; total: number }> = {}
          for (const g of applicable) {
            const streak = computeGoalStreak(g, participant.id, challenge.entries, selectedDate)
            const { completed, total } = computeGoalCompletion(g, participant.id, challenge.entries, challenge.startDate, selectedDate)
            goalStats[g.id] = { streak, completed, total }
          }
          return (
            <ParticipantColumn
              key={participant.id}
              participant={participant}
              checked={entries[participant.id] ?? {}}
              streak={computeStreak(participant, challenge.entries, selectedDate)}
              goalStats={goalStats}
              onChange={(goalId, value) => handleChange(participant.id, goalId, value)}
              date={selectedDate}
            />
          )
        })}
      </div>
    </div>
  )
}
