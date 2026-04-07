// lib/github.ts
import { ChallengeFile } from './types'

const BASE = 'https://api.github.com'
const FILE_PATH = 'data/challenge.json'

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

function repoUrl(path: string) {
  return `${BASE}/repos/${process.env.GITHUB_REPO}/contents/${path}?ref=${process.env.GITHUB_BRANCH ?? 'main'}`
}

export async function readChallengeFile(): Promise<{ data: ChallengeFile; sha: string }> {
  const res = await fetch(repoUrl(FILE_PATH), { headers: headers() })
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`)
  const json = await res.json()
  const content = Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  return { data: JSON.parse(content) as ChallengeFile, sha: json.sha }
}

export async function writeChallengeFile(
  data: ChallengeFile,
  sha: string,
  message: string
): Promise<void> {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
  const res = await fetch(
    `${BASE}/repos/${process.env.GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        message,
        content,
        sha,
        branch: process.env.GITHUB_BRANCH ?? 'main',
      }),
    }
  )
  if (res.status === 409) throw new Error('CONFLICT')
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status}`)
}
