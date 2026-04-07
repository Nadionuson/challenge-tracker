// app/page.tsx
import { redirect } from 'next/navigation'
import { readChallengeFile } from '@/lib/github'
import { getActiveChallenge } from '@/lib/metrics'

export default async function RootPage() {
  const { data } = await readChallengeFile()
  const today = new Date().toISOString().slice(0, 10)
  const active = getActiveChallenge(data, today)

  if (active) {
    redirect(`/challenge/${active.id}`)
  }

  // No active challenge: redirect to most recent past challenge
  const sorted = [...data.challenges].sort((a, b) => b.endDate.localeCompare(a.endDate))
  if (sorted.length > 0) {
    redirect(`/challenge/${sorted[0].id}`)
  }

  redirect('/admin')
}
