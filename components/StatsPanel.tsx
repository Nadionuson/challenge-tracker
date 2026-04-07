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
