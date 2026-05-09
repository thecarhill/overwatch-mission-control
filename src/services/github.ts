const API = 'https://api.github.com'

/** Validates PAT against GET /user (no repo env required). */
export async function verifyGitHubPat(): Promise<{
  ok: boolean
  login?: string
  error?: string
}> {
  const token = import.meta.env.VITE_GITHUB_PAT
  if (!token || String(token).trim().length === 0) {
    return { ok: false, error: 'VITE_GITHUB_PAT is missing in this build' }
  }
  try {
    const res = await fetch(`${API}/user`, {
      headers: {
        Authorization: `Bearer ${String(token)}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!res.ok) {
      const t = await res.text()
      return {
        ok: false,
        error: `HTTP ${res.status}: ${t.slice(0, 240)}`,
      }
    }
    const j = (await res.json()) as { login?: string }
    return { ok: true, login: j.login }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export class GitHubApiError extends Error {
  readonly status: number
  readonly body?: string

  constructor(message: string, status: number, body?: string) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
    this.body = body
  }
}

function env() {
  const token = import.meta.env.VITE_GITHUB_PAT
  const owner = import.meta.env.VITE_GITHUB_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO
  const branch = import.meta.env.VITE_GITHUB_BRANCH ?? 'main'
  if (!token || !owner || !repo) {
    throw new Error(
      'Missing VITE_GITHUB_PAT, VITE_GITHUB_OWNER, or VITE_GITHUB_REPO',
    )
  }
  return { token, owner, repo, branch }
}

function headers(): HeadersInit {
  const { token } = env()
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function ghFetch(path: string, init?: RequestInit): Promise<Response> {
  const { owner, repo } = env()
  const url =
    path.startsWith('http')
      ? path
      : `${API}/repos/${owner}/${repo}${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...headers(), ...init?.headers },
  })
  return res
}

export interface ContentFile {
  name: string
  path: string
  sha: string
  size: number
  type: 'file'
  content?: string
  encoding?: 'base64'
}

export interface ContentDirItem {
  name: string
  path: string
  type: 'dir' | 'file' | 'symlink' | 'submodule'
  sha?: string
}

export async function getContentsJson(path: string): Promise<ContentDirItem[] | ContentFile> {
  const { branch } = env()
  const q = `?ref=${encodeURIComponent(branch)}`
  const res = await ghFetch(
    `/repos/${env().owner}/${env().repo}/contents/${encodeURIComponent(path)}${q}`,
  )
  if (res.status === 404) throw new GitHubApiError('Not found', 404)
  if (!res.ok) {
    const t = await res.text()
    throw new GitHubApiError(`GitHub ${res.status}: ${t}`, res.status, t)
  }
  return res.json() as Promise<ContentDirItem[] | ContentFile>
}

export async function getTextFile(
  path: string,
): Promise<{ content: string; sha: string } | null> {
  try {
    const data = (await getContentsJson(path)) as ContentFile
    if (!data.content || data.encoding !== 'base64') {
      throw new GitHubApiError('Expected file with base64 content', 400)
    }
    const bin = atob(data.content.replace(/\n/g, ''))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const content = new TextDecoder().decode(bytes)
    return { content, sha: data.sha }
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) return null
    throw e
  }
}

function utf8ToBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

export async function putTextFile(
  path: string,
  content: string,
  message: string,
  sha: string | undefined,
): Promise<void> {
  const { branch } = env()
  const body: Record<string, string> = {
    message,
    content: utf8ToBase64Utf8(content),
    branch,
  }
  if (sha) body.sha = sha

  const res = await ghFetch(`/repos/${env().owner}/${env().repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new GitHubApiError(`GitHub ${res.status}: ${t}`, res.status, t)
  }
}

/** List immediate children under path (directory); empty if not found */
export async function listDirectory(path: string): Promise<ContentDirItem[]> {
  try {
    const data = await getContentsJson(path)
    return Array.isArray(data) ? data : []
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) return []
    throw e
  }
}
