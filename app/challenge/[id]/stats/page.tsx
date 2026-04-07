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

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        challenge={challenge}
        rightSlot={
          <AdminDrawer
            challengeId={id}
            participantIds={challenge.participants.map(p => ({ id: p.id, name: p.name }))}
            currentEndDate={challenge.endDate}
          />
        }
      />
      <TabBar challengeId={id} />
      <StatsPanel challenge={challenge} today={today} />
    </div>
  )
}
