import cors from 'cors'
import express from 'express'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { openDb } from './db.js'
import { readGithubEnv } from './githubRemote.js'
import {
  countDirty,
  pullFromGithub,
  pushDirtyToGithub,
  upsertLocalWrite,
} from './syncLogic.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createApp(db: ReturnType<typeof openDb>) {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '25mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/github/verify', async (_req, res) => {
    const env = readGithubEnv()
    if (!env) {
      res.json({
        ok: false,
        error:
          'Server env: set GITHUB_TOKEN (or GITHUB_PAT), GITHUB_OWNER, GITHUB_REPO',
      })
      return
    }
    try {
      const r = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${env.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })
      if (!r.ok) {
        const t = await r.text()
        res.json({
          ok: false,
          error: `HTTP ${r.status}: ${t.slice(0, 240)}`,
        })
        return
      }
      const j = (await r.json()) as { login?: string }
      res.json({ ok: true, login: j.login })
    } catch (e) {
      res.json({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  })

  app.get('/api/sync/status', (_req, res) => {
    const env = readGithubEnv()
    res.json({
      configured: Boolean(env),
      dirtyCount: countDirty(db),
      owner: env?.owner ?? null,
      repo: env?.repo ?? null,
      branch: env?.branch ?? null,
    })
  })

  app.post('/api/sync/push', async (_req, res) => {
    try {
      const { pushed } = await pushDirtyToGithub(db)
      res.json({ ok: true, pushed })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(400).json({ ok: false, error: msg })
    }
  })

  app.post('/api/sync/pull', async (_req, res) => {
    try {
      const { pulled } = await pullFromGithub(db)
      res.json({ ok: true, pulled })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(400).json({ ok: false, error: msg })
    }
  })

  /** GET file — 404 if missing (same contract as old GitHub client). */
  app.get('/api/file', (req, res) => {
    const path = req.query.path
    if (typeof path !== 'string' || !path.trim()) {
      res.status(400).json({ error: 'query path required' })
      return
    }
    const row = db
      .prepare(
        `SELECT content, github_sha AS sha, dirty FROM files WHERE path = ?`,
      )
      .get(path) as { content: string; sha: string | null; dirty: number } | undefined
    if (!row) {
      res.status(404).end()
      return
    }
    res.json({
      content: row.content,
      sha: row.sha ?? undefined,
      dirty: Boolean(row.dirty),
    })
  })

  app.put('/api/file', (req, res) => {
    const path = req.query.path
    if (typeof path !== 'string' || !path.trim()) {
      res.status(400).json({ error: 'query path required' })
      return
    }
    const body = req.body as { content?: string }
    if (typeof body.content !== 'string') {
      res.status(400).json({ error: 'JSON body { content: string } required' })
      return
    }
    upsertLocalWrite(db, path, body.content)
    const row = db
      .prepare(`SELECT github_sha AS sha, dirty FROM files WHERE path = ?`)
      .get(path) as { sha: string | null; dirty: number }
    res.json({ ok: true, sha: row.sha ?? undefined, dirty: Boolean(row.dirty) })
  })

  /** List immediate names under path (e.g. projects → slug dirs from projects/foo/... keys). */
  app.get('/api/browse', (req, res) => {
    const prefix = typeof req.query.path === 'string' ? req.query.path : ''
    if (!prefix.trim()) {
      res.status(400).json({ error: 'query path required' })
      return
    }
    const rows = db
      .prepare(`SELECT path FROM files WHERE path LIKE ?`)
      .all(`${prefix}/%`) as { path: string }[]
    const names = new Set<string>()
    for (const { path: p } of rows) {
      const rest = p.slice(prefix.length + 1)
      const seg = rest.split('/')[0]
      if (seg) names.add(seg)
    }
    const items = [...names].sort().map((name) => ({
      name,
      path: `${prefix}/${name}`,
      type: 'dir' as const,
    }))
    res.json({ items })
  })

  const dist = join(__dirname, '..', 'dist')
  if (existsSync(dist)) {
    app.use(express.static(dist))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next()
        return
      }
      res.sendFile(join(dist, 'index.html'))
    })
  }

  return app
}

const port = parseInt(process.env.PORT || '8080', 10)
const db = openDb()
const app = createApp(db)
app.listen(port, '0.0.0.0', () => {
  console.log(`Overwatch server listening on :${port} (SQLite + /api)`)
})
