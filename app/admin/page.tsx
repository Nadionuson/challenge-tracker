// app/admin/page.tsx
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
        <AdminDrawer challengeId="" participantIds={[]} currentEndDate="" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">Admin</h1>
          <p className="text-[#8b949e] text-sm">Managing: {challenge.name}</p>
        </div>
        <AdminDrawer
          challengeId={challenge.id}
          participantIds={challenge.participants.map(p => ({ id: p.id, name: p.name }))}
          currentEndDate={challenge.endDate}
        />
      </div>
    </div>
  )
}
