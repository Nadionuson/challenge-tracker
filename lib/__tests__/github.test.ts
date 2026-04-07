import { readChallengeFile, writeChallengeFile } from '../github'
import { ChallengeFile } from '../types'

const mockFileContent: ChallengeFile = { challenges: [] }
const mockBase64 = Buffer.from(JSON.stringify(mockFileContent)).toString('base64')

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'test-token'
  process.env.GITHUB_REPO = 'owner/repo'
  process.env.GITHUB_BRANCH = 'main'
  jest.resetAllMocks()
})

describe('readChallengeFile', () => {
  it('returns parsed data and sha', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: mockBase64 + '\n', sha: 'abc123' }),
    } as Response)

    const result = await readChallengeFile()

    expect(result.data).toEqual(mockFileContent)
    expect(result.sha).toBe('abc123')
  })

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(readChallengeFile()).rejects.toThrow('GitHub read failed: 404')
  })
})

describe('writeChallengeFile', () => {
  it('commits file with correct payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    await writeChallengeFile(mockFileContent, 'abc123', 'feat: test commit')

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toContain('/contents/data/challenge.json')
    const body = JSON.parse(options.body)
    expect(body.sha).toBe('abc123')
    expect(body.message).toBe('feat: test commit')
  })

  it('throws on 409 conflict', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
    } as Response)

    await expect(
      writeChallengeFile(mockFileContent, 'stale-sha', 'feat: test')
    ).rejects.toThrow('CONFLICT')
  })
})
