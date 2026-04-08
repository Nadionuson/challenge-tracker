// app/challenge/[id]/stats/page.tsx
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import StatsPanel from '@/components/StatsPanel'
import AdminDrawer from '@/components/AdminDrawer'

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await readChallengeFile()
  const challenge = data.challenges.find(c => c.id === id)
  if (!challenge) notFound()

  const today = new Date().toISOString().slice(0, 10)
  const existingGoals = [...new Map(
    data.challenges.flatMap(c => c.participants.flatMap(p => p.goals))
      .map(g => [g.name.toLowerCase(), { name: g.name, category: g.category, frequency: g.frequency }])
  ).values()]

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        challenge={challenge}
        rightSlot={
          <AdminDrawer
            currentChallengeId={id}
            allChallenges={data.challenges.map(c => ({ id: c.id, name: c.name, endDate: c.endDate, participants: c.participants.map(p => ({ id: p.id, name: p.name })) }))}
            existingGoals={existingGoals}
          />
        }
      />
      <TabBar challengeId={id} />
      <StatsPanel challenge={challenge} today={today} />
    </div>
  )
}
