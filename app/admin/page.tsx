// app/admin/page.tsx
export const dynamic = 'force-dynamic'

import { readChallengeFile } from '@/lib/github'
import AdminDrawer from '@/components/AdminDrawer'
import { getActiveChallenge } from '@/lib/metrics'

export default async function AdminPage() {
  const { data } = await readChallengeFile()
  const today = new Date().toISOString().slice(0, 10)
  const challenge = getActiveChallenge(data, today) ?? data.challenges[data.challenges.length - 1]

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#8b949e]">No challenges found.</p>
        <AdminDrawer currentChallengeId="" allChallenges={[]} />
      </div>
    )
  }

  const existingGoals = [...new Map(
    data.challenges.flatMap(c => c.participants.flatMap(p => p.goals))
      .map(g => [g.name.toLowerCase(), { name: g.name, category: g.category, frequency: g.frequency }])
  ).values()]

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">Admin</h1>
          <p className="text-[#8b949e] text-sm">Managing: {challenge.name}</p>
        </div>
        <AdminDrawer
          currentChallengeId={challenge.id}
          allChallenges={data.challenges.map(c => ({ id: c.id, name: c.name, endDate: c.endDate, participants: c.participants.map(p => ({ id: p.id, name: p.name })) }))}
          existingGoals={existingGoals}
        />
      </div>
    </div>
  )
}
