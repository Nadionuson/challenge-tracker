// components/StatsPanel.tsx
'use client'

import { useState, useMemo } from 'react'
import { Challenge, Participant } from '@/lib/types'
import {
  computeStreak,
  computeBestStreak,
  computeConsistency,
  computePerfectDays,
} from '@/lib/metrics'
import {
  computeGoalCompletionBars,
  computeCategoryBars,
  generateInsights,
  Insight,
} from '@/lib/chart-data'
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts'

interface StatsPanelProps {
  challenge: Challenge
  today: string
}

type DrillDown = 'goals' | 'categories' | 'insights'

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#30363d] last:border-0">
      <span className="text-[#8b949e] text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}

function ParticipantSummary({
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

const CHART_COLORS = ['#e94560', '#60a5fa', '#3fb950', '#f0883e', '#bc8cff', '#58a6ff']

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1f2937] border border-[#30363d] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#8b949e] mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  )
}

function GoalRadarChart({ challenge, today }: { challenge: Challenge; today: string }) {
  const data = useMemo(() => computeGoalCompletionBars(challenge, today), [challenge, today])

  return (
    <div className="bg-[#1f2937] rounded-xl p-4">
      <h3 className="text-white text-sm font-bold mb-4">Completion by Goal</h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 9 }} stroke="#30363d" />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {challenge.participants.map((p, i) => (
            <Radar
              key={p.id}
              dataKey={p.id}
              name={p.name}
              stroke={p.color || CHART_COLORS[i]}
              fill={p.color || CHART_COLORS[i]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function CategoryRadarChart({ challenge, today }: { challenge: Challenge; today: string }) {
  const data = useMemo(() => computeCategoryBars(challenge, today), [challenge, today])

  return (
    <div className="bg-[#1f2937] rounded-xl p-4">
      <h3 className="text-white text-sm font-bold mb-4">Completion by Category</h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#8b949e', fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 9 }} stroke="#30363d" />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {challenge.participants.map((p, i) => (
            <Radar
              key={p.id}
              dataKey={p.id}
              name={p.name}
              stroke={p.color || CHART_COLORS[i]}
              fill={p.color || CHART_COLORS[i]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const border = insight.type === 'positive'
    ? 'border-[#238636]'
    : insight.type === 'negative'
    ? 'border-[#da3633]'
    : 'border-[#30363d]'

  return (
    <div className={`bg-[#1f2937] rounded-lg px-3 py-2 border ${border} flex items-start gap-2`}>
      <span className="text-sm leading-none mt-0.5">{insight.icon}</span>
      <span className="text-[#c9d1d9] text-sm">{insight.text}</span>
    </div>
  )
}

function InsightsSection({ challenge, today }: { challenge: Challenge; today: string }) {
  const insights = useMemo(() => generateInsights(challenge, today), [challenge, today])

  return (
    <div className="bg-[#1f2937] rounded-xl p-4">
      <h3 className="text-white text-sm font-bold mb-3">Insights</h3>
      <div className="flex flex-col gap-2">
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </div>
  )
}

const TABS: { key: DrillDown; label: string }[] = [
  { key: 'goals', label: 'By Goal' },
  { key: 'categories', label: 'By Category' },
  { key: 'insights', label: 'Insights' },
]

export default function StatsPanel({ challenge, today }: StatsPanelProps) {
  const [tab, setTab] = useState<DrillDown>('goals')

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Tab selector */}
      <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
              tab === t.key
                ? 'bg-[#238636] text-white'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {challenge.participants.map(p => (
          <ParticipantSummary key={p.id} participant={p} challenge={challenge} today={today} />
        ))}
      </div>

      {/* Tab content */}
      {tab === 'goals' && (
        <GoalRadarChart challenge={challenge} today={today} />
      )}
      {tab === 'categories' && (
        <CategoryRadarChart challenge={challenge} today={today} />
      )}
      {tab === 'insights' && (
        <InsightsSection challenge={challenge} today={today} />
      )}
    </div>
  )
}
