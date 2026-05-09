/**
 * Server-side GitHub REST (Contents API). Uses env — never expose token to browser.
 */

const API = 'https://api.github.com'

export type RemoteEnv = {
  token: string
  owner: string
  repo: string
  branch: string
}

export function readGithubEnv(): RemoteEnv | null {
  const token =
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GITHUB_PAT?.trim() ||
    ''
  const owner = process.env.GITHUB_OWNER?.trim() || ''
  const repo = process.env.GITHUB_REPO?.trim() || ''
  const branch =
    process.env.GITHUB_BRANCH?.trim() || 'main'
  if (!token || !owner || !repo) return null
  return { token, owner, repo, branch }
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function ghFetch(
  env: RemoteEnv,
  repoRelativePath: string,
  init?: RequestInit,
): Promise<Response> {
  const { owner, repo, token } = env
  const p = repoRelativePath.startsWith('/') ? repoRelativePath : `/${repoRelativePath}`
  const url = `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${p}`
  return fetch(url, {
    ...init,
    headers: { ...headers(token), ...init?.headers },
  })
}

/** Encode path segments for contents API (slashes stay as path separators). */
function contentsUrlPath(repoPath: string): string {
  return encodeURIComponent(repoPath).replace(/%2F/g, '/')
}

export async function githubGetContentsJson(
  env: RemoteEnv,
  repoPath: string,
): Promise<unknown> {
  const q = `?ref=${encodeURIComponent(env.branch)}`
  const res = await ghFetch(
    env,
    `/contents/${contentsUrlPath(repoPath)}${q}`,
    {},
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`GitHub GET ${repoPath}: ${res.status} ${t.slice(0, 400)}`)
  }
  return res.json()
}

export async function githubGetFileText(
  env: RemoteEnv,
  repoPath: string,
): Promise<{ content: string; sha: string } | null> {
  const j = await githubGetContentsJson(env, repoPath)
  if (!j || typeof j !== 'object') return null
  const o = j as {
    type?: string
    content?: string
    encoding?: string
    sha?: string
  }
  if (o.type !== 'file' || !o.content || o.encoding !== 'base64' || !o.sha) return null
  const bin = Buffer.from(String(o.content).replace(/\n/g, ''), 'base64')
  return { content: bin.toString('utf8'), sha: o.sha }
}

export async function githubPutFile(
  env: RemoteEnv,
  repoPath: string,
  contentUtf8: string,
  message: string,
  previousSha: string | null,
): Promise<{ sha: string }> {
  const { branch } = env
  const body: Record<string, string> = {
    message,
    content: Buffer.from(contentUtf8, 'utf8').toString('base64'),
    branch,
  }
  if (previousSha) body.sha = previousSha

  const res = await ghFetch(env, `/contents/${contentsUrlPath(repoPath)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`GitHub PUT ${repoPath}: ${res.status} ${t.slice(0, 500)}`)
  }
  const j = (await res.json()) as { content?: { sha?: string } }
  const sha = j.content?.sha
  if (!sha) throw new Error('GitHub PUT: missing sha in response')
  return { sha }
}

export interface GithubDirEntry {
  name: string
  path: string
  type: string
  sha?: string
}

export async function githubListPath(
  env: RemoteEnv,
  repoPath: string,
): Promise<GithubDirEntry[]> {
  const q = `?ref=${encodeURIComponent(env.branch)}`
  const pathPart = repoPath
    ? `/contents/${contentsUrlPath(repoPath)}`
    : `/contents`
  const res = await ghFetch(env, `${pathPart}${q}`, {})
  if (res.status === 404) return []
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`GitHub list ${repoPath || '(root)'}: ${res.status} ${t.slice(0, 400)}`)
  }
  const data = (await res.json()) as GithubDirEntry[] | { type?: string }
  return Array.isArray(data) ? data : []
}
