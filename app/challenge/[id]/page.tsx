import { notFound } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import TodayView from '@/components/TodayView'

export default async function TodayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await readChallengeFile()
  const challenge = data.challenges.find(c => c.id === id)
  if (!challenge) notFound()

  const today = new Date().toISOString().slice(0, 10)
  const initialEntries = challenge.entries[today] ?? {}

  return (
    // Note: AdminDrawer is wired into Header in Task 19. For now render Header without rightSlot.
    <div className="flex flex-col min-h-screen">
      <Header challenge={challenge} />
      <TabBar challengeId={id} />
      <TodayView
        challenge={challenge}
        today={today}
        initialEntries={initialEntries}
      />
    </div>
  )
}
