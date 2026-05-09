import cors from 'cors'
import express from 'express'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { openDb } from './db.js'
import { upsertFile } from './fileStore.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createApp(db: ReturnType<typeof openDb>) {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '25mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  /** GET file — 404 if missing */
  app.get('/api/file', (req, res) => {
    const path = req.query.path
    if (typeof path !== 'string' || !path.trim()) {
      res.status(400).json({ error: 'query path required' })
      return
    }
    const row = db
      .prepare(`SELECT content, updated_at FROM files WHERE path = ?`)
      .get(path) as { content: string; updated_at: string } | undefined
    if (!row) {
      res.status(404).end()
      return
    }
    res.json({
      content: row.content,
      sha: row.updated_at,
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
    upsertFile(db, path, body.content)
    res.json({ ok: true })
  })

  /** List immediate names under path (e.g. projects → slugs from projects/foo/...) */
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
let db: ReturnType<typeof openDb>
try {
  db = openDb()
} catch (err) {
  console.error('[overwatch] Failed to open SQLite:', err)
  process.exit(1)
}
const app = createApp(db)
app.listen(port, '0.0.0.0', () => {
  console.log(`Overwatch server listening on :${port} (SQLite only)`)
})
