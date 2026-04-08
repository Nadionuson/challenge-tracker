// components/GoalList.tsx
'use client'

import { Goal } from '@/lib/types'

function categoryIcon(category?: string): string {
  const c = (category ?? '').toLowerCase()
  if (c.includes('eat') || c.includes('food') || c.includes('diet') || c.includes('nutrition')) return '🥗'
  if (c.includes('workout') || c.includes('exercise') || c.includes('gym') || c.includes('fitness')) return '💪'
  if (c.includes('growth') || c.includes('learn') || c.includes('read') || c.includes('study')) return '📚'
  if (c.includes('sleep') || c.includes('rest') || c.includes('recovery')) return '😴'
  if (c.includes('meditat') || c.includes('mindful') || c.includes('breath')) return '🧘'
  if (c.includes('water') || c.includes('hydrat')) return '💧'
  if (c.includes('social') || c.includes('connect') || c.includes('family') || c.includes('friend')) return '🤝'
  if (category) return '🎯'
  return ''
}

const FREQ_LABEL: Record<string, string> = {
  weekdays: 'M–F',
  weekends: 'S–S',
}

interface GoalListProps {
  goals: Goal[]
  checked: Record<string, boolean>
  onChange: (goalId: string, value: boolean) => void
}

export default function GoalList({ goals, checked, onChange }: GoalListProps) {
  return (
    <div className="p-2 flex flex-col gap-1">
      {goals.map(goal => {
        const done = checked[goal.id] === true
        const icon = categoryIcon(goal.category)
        const freqLabel = goal.frequency && goal.frequency !== 'daily' ? FREQ_LABEL[goal.frequency] : null
        return (
          <button
            key={goal.id}
            onClick={() => onChange(goal.id, !done)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left w-full transition-colors ${
              done
                ? 'bg-[#238636] text-white'
                : 'bg-[#1f2937] border border-dashed border-[#30363d] text-[#8b949e]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] ${
                done ? 'bg-[#2ea043] text-white' : 'border border-[#444]'
              }`}
            >
              {done && '✓'}
            </div>
            {icon && <span className="text-sm leading-none">{icon}</span>}
            <span className="text-xs flex-1">{goal.name}</span>
            {freqLabel && (
              <span className="text-[9px] text-[#8b949e] bg-[#0d1117] px-1 rounded shrink-0">{freqLabel}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
