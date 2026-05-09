/**
 * Local SQLite API — same origin as the Node server (Docker).
 */

const base = import.meta.env.VITE_API_BASE ?? ''

export class RepoApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'RepoApiError'
    this.status = status
  }
}

export async function getTextFile(
  path: string,
): Promise<{ content: string; sha: string } | null> {
  const r = await fetch(`${base}/api/file?path=${encodeURIComponent(path)}`)
  if (r.status === 404) return null
  if (!r.ok) throw new RepoApiError(await r.text(), r.status)
  const j = (await r.json()) as { content: string; sha?: string }
  return { content: j.content, sha: j.sha ?? '' }
}

export async function putTextFile(
  path: string,
  content: string,
  _message?: string,
  _sha?: string | undefined,
): Promise<void> {
  void _message
  void _sha
  const res = await fetch(`${base}/api/file?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new RepoApiError(await res.text(), res.status)
}

export interface ContentDirItem {
  name: string
  path: string
  type: 'dir' | 'file' | 'symlink' | 'submodule'
  sha?: string
}

export async function listDirectory(path: string): Promise<ContentDirItem[]> {
  const r = await fetch(`${base}/api/browse?path=${encodeURIComponent(path)}`)
  if (!r.ok) throw new RepoApiError(await r.text(), r.status)
  const j = (await r.json()) as { items: ContentDirItem[] }
  return j.items ?? []
}
