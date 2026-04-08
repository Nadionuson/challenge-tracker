// app/challenge/[id]/history/page.tsx
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import HistoryGrid from '@/components/HistoryGrid'
import AdminDrawer from '@/components/AdminDrawer'

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await readChallengeFile()
  const challenge = data.challenges.find(c => c.id === id)
  if (!challenge) notFound()

  const today = new Date().toISOString().slice(0, 10)
  const existingCategories = [...new Set(challenge.participants.flatMap(p => p.goals.map(g => g.category).filter(Boolean) as string[]))]

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        challenge={challenge}
        rightSlot={
          <AdminDrawer
            challengeId={id}
            participantIds={challenge.participants.map(p => ({ id: p.id, name: p.name }))}
            currentEndDate={challenge.endDate}
            existingCategories={existingCategories}
          />
        }
      />
      <TabBar challengeId={id} />
      <HistoryGrid challenge={challenge} today={today} />
    </div>
  )
}
