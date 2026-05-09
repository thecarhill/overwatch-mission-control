import { openDb } from './db.js'
import {
  githubGetFileText,
  githubListPath,
  githubPutFile,
  readGithubEnv,
  type RemoteEnv,
} from './githubRemote.js'

type Db = ReturnType<typeof openDb>

export function upsertLocalWrite(
  db: Db,
  path: string,
  content: string,
): void {
  db.prepare(
    `
    INSERT INTO files (path, content, dirty, updated_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(path) DO UPDATE SET
      content = excluded.content,
      dirty = 1,
      updated_at = datetime('now')
    `,
  ).run(path, content)
}

export function countDirty(db: Db): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM files WHERE dirty = 1`)
    .get() as { n: number }
  return row.n
}

export async function pushDirtyToGithub(db: Db): Promise<{
  pushed: string[]
  env: RemoteEnv
}> {
  const env = readGithubEnv()
  if (!env) throw new Error('GitHub not configured (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)')
  const rows = db
    .prepare(
      `SELECT path, content, github_sha FROM files WHERE dirty = 1 ORDER BY path`,
    )
    .all() as { path: string; content: string; github_sha: string | null }[]
  const pushed: string[] = []
  for (const row of rows) {
    const { sha } = await githubPutFile(
      env,
      row.path,
      row.content,
      `overwatch: sync ${row.path}`,
      row.github_sha,
    )
    db.prepare(
      `UPDATE files SET github_sha = ?, dirty = 0, updated_at = datetime('now') WHERE path = ?`,
    ).run(sha, row.path)
    pushed.push(row.path)
  }
  return { pushed, env }
}

export async function pullFromGithub(db: Db): Promise<{
  pulled: string[]
}> {
  const env = readGithubEnv()
  if (!env) throw new Error('GitHub not configured (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)')
  const pulled: string[] = []

  const roots = ['leads.json', 'inbox.md', 'projects.md']
  for (const p of roots) {
    const got = await githubGetFileText(env, p)
    if (got) {
      db.prepare(
        `
        INSERT INTO files (path, content, github_sha, dirty, updated_at)
        VALUES (?, ?, ?, 0, datetime('now'))
        ON CONFLICT(path) DO UPDATE SET
          content = excluded.content,
          github_sha = excluded.github_sha,
          dirty = 0,
          updated_at = datetime('now')
        `,
      ).run(p, got.content, got.sha)
      pulled.push(p)
    }
  }

  const projectDirs = await githubListPath(env, 'projects')
  for (const entry of projectDirs) {
    if (entry.type !== 'dir') continue
    const name = entry.name
    const statePath = `projects/${name}/state.md`
    const got = await githubGetFileText(env, statePath)
    if (got) {
      db.prepare(
        `
        INSERT INTO files (path, content, github_sha, dirty, updated_at)
        VALUES (?, ?, ?, 0, datetime('now'))
        ON CONFLICT(path) DO UPDATE SET
          content = excluded.content,
          github_sha = excluded.github_sha,
          dirty = 0,
          updated_at = datetime('now')
        `,
      ).run(statePath, got.content, got.sha)
      pulled.push(statePath)
    }
  }

  return { pulled }
}
