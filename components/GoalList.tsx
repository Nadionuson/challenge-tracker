// components/GoalList.tsx
'use client'

import { Goal } from '@/lib/types'

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
            <span className="text-xs">{goal.name}</span>
          </button>
        )
      })}
    </div>
  )
}
