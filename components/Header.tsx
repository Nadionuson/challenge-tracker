// components/Header.tsx
// Note: no 'use client' needed — this is a pure display component used in Server Components
import { Challenge } from '@/lib/types'

interface HeaderProps {
  challenge: Challenge
  rightSlot?: React.ReactNode  // e.g. AdminDrawer button
}

function dayNumber(startDate: string, today: string): number {
  const start = new Date(startDate)
  const cur = new Date(today)
  return Math.floor((cur.getTime() - start.getTime()) / 86400000) + 1
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function Header({ challenge, rightSlot }: HeaderProps) {
  const today = new Date().toISOString().slice(0, 10)
  const day = dayNumber(challenge.startDate, today)
  const total = Math.ceil(
    (new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / 86400000
  ) + 1

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-white font-bold text-base">{challenge.name}</h1>
        <p className="text-[#8b949e] text-xs">
          {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)} · Day {day} of {total}
        </p>
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  )
}
