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
