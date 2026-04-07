import { saveEntries, extendChallenge } from '../actions'

const mockData = {
  challenges: [{
    id: 'c1', name: 'Test', startDate: '2026-04-07', endDate: '2026-05-06',
    participants: [], entries: {},
  }],
}

function mockGitHub(respondWith: { ok: boolean; status?: number } | 'conflict_then_ok') {
  let callCount = 0
  global.fetch = jest.fn().mockImplementation(() => {
    callCount++
    if (respondWith === 'conflict_then_ok') {
      if (callCount <= 2) {
        // First pair: read (ok) + write (409 conflict)
        if (callCount === 1) return Promise.resolve({ ok: true, json: async () => ({ content: Buffer.from(JSON.stringify(mockData)).toString('base64'), sha: 'sha1' }) })
        return Promise.resolve({ ok: false, status: 409 })
      }
      // Retry pair: read (ok) + write (ok)
      if (callCount === 3) return Promise.resolve({ ok: true, json: async () => ({ content: Buffer.from(JSON.stringify(mockData)).toString('base64'), sha: 'sha2' }) })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    }
    if (callCount % 2 === 1) {
      return Promise.resolve({ ok: true, json: async () => ({ content: Buffer.from(JSON.stringify(mockData)).toString('base64'), sha: 'sha1' }) })
    }
    return Promise.resolve({ ok: respondWith.ok, status: respondWith.status ?? 200, json: async () => ({}) })
  })
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'tok'
  process.env.GITHUB_REPO = 'owner/repo'
  process.env.GITHUB_BRANCH = 'main'
  jest.resetAllMocks()
})

describe('saveEntries', () => {
  it('rejects future dates', async () => {
    const future = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
    const result = await saveEntries('c1', future, {})
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/future/i)
  })

  it('saves successfully on first attempt', async () => {
    mockGitHub({ ok: true })
    const today = new Date().toISOString().slice(0, 10)
    const result = await saveEntries('c1', today, { p1: { g1: true } })
    expect(result.success).toBe(true)
  })

  it('retries once on 409 conflict and succeeds', async () => {
    mockGitHub('conflict_then_ok')
    const today = new Date().toISOString().slice(0, 10)
    const result = await saveEntries('c1', today, {})
    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(4) // read+write, read+write
  })
})

describe('extendChallenge', () => {
  it('rejects a new end date not after current end date', async () => {
    mockGitHub({ ok: true })
    const result = await extendChallenge('c1', '2026-05-06') // same as current
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/after/i)
  })
})
