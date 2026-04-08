'use client'

import { Participant } from '@/lib/types'
import { getApplicableGoals } from '@/lib/metrics'
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
  const applicable = getApplicableGoals(participant, date)
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
