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
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error ?? 'Save failed.')
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
