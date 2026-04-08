'use client'

import { useState, useTransition } from 'react'
import { addGoal, addParticipant, createChallenge, extendChallenge } from '@/lib/actions'
import { ActionResult } from '@/lib/types'

type AdminView = 'menu' | 'addGoal' | 'addParticipant' | 'newChallenge' | 'extend'

const DEFAULT_CATEGORIES = ['Healthy eating', 'Workout', 'Self Growth']

interface AdminDrawerProps {
  challengeId: string
  participantIds: { id: string; name: string }[]
  currentEndDate: string
  existingCategories?: string[]
}

function ResultMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null
  return (
    <p className={`text-xs mt-2 ${result.success ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
      {result.success ? 'Saved successfully!' : result.error}
    </p>
  )
}

export default function AdminDrawer({ challengeId, participantIds, currentEndDate, existingCategories = [] }: AdminDrawerProps) {
  const categoryOptions = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories])]
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AdminView>('menu')
  const [result, setResult] = useState<ActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() { setView('menu'); setResult(null) }
  function action(fn: () => Promise<ActionResult>) {
    setResult(null)
    startTransition(async () => {
      const r = await fn()
      setResult(r)
      if (r.success) setTimeout(reset, 1500)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#1f2937] border border-[#30363d] text-[#8b949e] text-xs px-3 py-1.5 rounded-md hover:text-white transition-colors"
      >
        ⚙ Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setOpen(false); reset() }} />
          <div className="relative bg-[#161b22] border-l border-[#30363d] w-80 h-full overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">Admin</h2>
              <button onClick={() => { setOpen(false); reset() }} className="text-[#8b949e] hover:text-white text-lg">✕</button>
            </div>

            {view === 'menu' && (
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Add goal to participant', view: 'addGoal' as AdminView },
                  { label: 'Add participant', view: 'addParticipant' as AdminView },
                  { label: 'Create new challenge', view: 'newChallenge' as AdminView },
                  { label: 'Extend challenge', view: 'extend' as AdminView },
                ].map(item => (
                  <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className="bg-[#1f2937] border border-[#30363d] text-white text-sm px-4 py-2.5 rounded-lg hover:border-[#58a6ff] text-left transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {view === 'addGoal' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const name = fd.get('name') as string
                  action(() => addGoal(
                    challengeId,
                    fd.get('participantId') as string,
                    {
                      id: name.toLowerCase().replace(/\s+/g, '-'),
                      name,
                      startDate: fd.get('startDate') as string,
                      frequency: (fd.get('frequency') as string || 'daily') as import('@/lib/types').GoalFrequency,
                      category: (fd.get('category') as string) || undefined,
                    }
                  ))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">Add Goal</h3>
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] text-xs">Participant</label>
                  <select name="participantId" required className="input-field">
                    {participantIds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] text-xs">Goal Name</label>
                  <input name="name" placeholder="e.g. No sugar" required className="input-field" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] text-xs">Start Date</label>
                  <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="input-field" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] text-xs">Frequency</label>
                  <select name="frequency" className="input-field">
                    <option value="daily">Every day</option>
                    <option value="weekdays">Week days (Mon–Fri)</option>
                    <option value="weekends">Weekend (Sat–Sun)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] text-xs">Category</label>
                  <input
                    name="category"
                    placeholder="e.g. Workout"
                    list="category-options"
                    className="input-field"
                  />
                  <datalist id="category-options">
                    {categoryOptions.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Save'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}

            {view === 'addParticipant' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const today = new Date().toISOString().slice(0, 10)
                  action(() => addParticipant(challengeId, {
                    id: (fd.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
                    name: fd.get('name') as string,
                    color: fd.get('color') as string,
                    joinedDate: fd.get('joinedDate') as string ?? today,
                    goals: [],
                  }))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">Add Participant</h3>
                <input name="name" placeholder="Name" required className="input-field" />
                <div className="flex items-center gap-2">
                  <label className="text-[#8b949e] text-xs">Colour</label>
                  <input name="color" type="color" defaultValue="#60a5fa" className="h-8 w-16 rounded cursor-pointer" />
                </div>
                <input name="joinedDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="input-field" />
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Save'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}

            {view === 'newChallenge' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const name = fd.get('name') as string
                  const startDate = fd.get('startDate') as string
                  action(() => createChallenge({
                    id: startDate + '-' + name.toLowerCase().replace(/\s+/g, '-'),
                    name,
                    startDate,
                    endDate: fd.get('endDate') as string,
                  }))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">New Challenge</h3>
                <input name="name" placeholder="Challenge name" required className="input-field" />
                <input name="startDate" type="date" required className="input-field" />
                <input name="endDate" type="date" required className="input-field" />
                <p className="text-[#8b949e] text-xs">Goals will be pre-populated from the current challenge.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Create'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}

            {view === 'extend' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  action(() => extendChallenge(challengeId, fd.get('newEndDate') as string))
                }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-white font-medium">Extend Challenge</h3>
                <p className="text-[#8b949e] text-xs">Current end date: {currentEndDate}</p>
                <input name="newEndDate" type="date" required min={currentEndDate} className="input-field" />
                <div className="flex gap-2">
                  <button type="button" onClick={reset} className="flex-1 btn-secondary">Back</button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? '…' : 'Extend'}</button>
                </div>
                <ResultMessage result={result} />
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
