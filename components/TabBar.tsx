// components/TabBar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TabBarProps {
  challengeId: string
}

export default function TabBar({ challengeId }: TabBarProps) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Today', href: `/challenge/${challengeId}` },
    { label: 'History', href: `/challenge/${challengeId}/history` },
    { label: 'Stats', href: `/challenge/${challengeId}/stats` },
  ]

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] flex">
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              active
                ? 'text-white border-[#238636]'
                : 'text-[#8b949e] border-transparent hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
