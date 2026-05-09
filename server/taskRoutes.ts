import type { Express, Request, Response } from 'express'
import type Database from 'better-sqlite3'

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']

const PRIORITIES = [
  '01_CRITICAL',
  '02_HIGH',
  '03_STANDARD',
  '04_BACKLOG',
] as const

function newId(): string {
  return `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function mapRow(r: {
  id: string
  project_slug: string
  title: string
  description: string
  status: string
  priority: string
  deadline: string | null
  created_at: string
  updated_at: string
}) {
  return {
    id: r.id,
    projectSlug: r.project_slug,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    deadline: r.deadline,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function registerTaskRoutes(app: Express, db: Database.Database): void {
  app.get('/api/tasks', (req: Request, res: Response) => {
    const slug = typeof req.query.project_slug === 'string' ? req.query.project_slug.trim() : ''
    if (slug) {
      const rows = db
        .prepare(
          `SELECT id, project_slug, title, description, status, priority, deadline, created_at, updated_at
           FROM tasks WHERE project_slug = ? ORDER BY updated_at DESC`,
        )
        .all(slug) as Parameters<typeof mapRow>[0][]
      res.json({ tasks: rows.map(mapRow) })
      return
    }
    const rows = db
      .prepare(
        `SELECT id, project_slug, title, description, status, priority, deadline, created_at, updated_at
         FROM tasks ORDER BY updated_at DESC`,
      )
      .all() as Parameters<typeof mapRow>[0][]
    res.json({ tasks: rows.map(mapRow) })
  })

  app.post('/api/tasks', (req: Request, res: Response) => {
    const body = req.body as {
      project_slug?: string
      title?: string
      description?: string
      status?: string
      priority?: string
      deadline?: string | null
    }
    const projectSlug = typeof body.project_slug === 'string' ? body.project_slug.trim() : ''
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!projectSlug || !title) {
      res.status(400).json({ error: 'project_slug and title required' })
      return
    }
    const status = TASK_STATUSES.includes(body.status as TaskStatus)
      ? (body.status as TaskStatus)
      : 'todo'
    const priority =
      typeof body.priority === 'string' && PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])
        ? body.priority
        : '03_STANDARD'
    const description = typeof body.description === 'string' ? body.description : ''
    const deadline =
      body.deadline === null || body.deadline === undefined || body.deadline === ''
        ? null
        : String(body.deadline).slice(0, 32)
    const id = newId()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO tasks (id, project_slug, title, description, status, priority, deadline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, projectSlug, title, description, status, priority, deadline, now, now)
    const row = db
      .prepare(
        `SELECT id, project_slug, title, description, status, priority, deadline, created_at, updated_at FROM tasks WHERE id = ?`,
      )
      .get(id) as Parameters<typeof mapRow>[0]
    res.status(201).json({ task: mapRow(row) })
  })

  app.patch('/api/tasks/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const body = req.body as {
      title?: string
      description?: string
      status?: string
      priority?: string
      deadline?: string | null
    }
    const row = db
      .prepare(`SELECT id FROM tasks WHERE id = ?`)
      .get(id) as { id: string } | undefined
    if (!row) {
      res.status(404).json({ error: 'task not found' })
      return
    }
    const cur = db
      .prepare(
        `SELECT title, description, status, priority, deadline FROM tasks WHERE id = ?`,
      )
      .get(id) as {
      title: string
      description: string
      status: string
      priority: string
      deadline: string | null
    }
    let title = cur.title
    let description = cur.description
    let status = cur.status
    let priority = cur.priority
    let deadline = cur.deadline
    if (typeof body.title === 'string') title = body.title.trim()
    if (typeof body.description === 'string') description = body.description
    if (typeof body.status === 'string' && TASK_STATUSES.includes(body.status as TaskStatus)) {
      status = body.status
    }
    if (
      typeof body.priority === 'string' &&
      PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])
    ) {
      priority = body.priority
    }
    if ('deadline' in body) {
      deadline =
        body.deadline === null || body.deadline === '' || body.deadline === undefined
          ? null
          : String(body.deadline).slice(0, 32)
    }
    const now = new Date().toISOString()
    db.prepare(
      `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, deadline = ?, updated_at = ? WHERE id = ?`,
    ).run(title, description, status, priority, deadline, now, id)
    const next = db
      .prepare(
        `SELECT id, project_slug, title, description, status, priority, deadline, created_at, updated_at FROM tasks WHERE id = ?`,
      )
      .get(id) as Parameters<typeof mapRow>[0]
    res.json({ task: mapRow(next) })
  })

  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const r = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
    if (r.changes === 0) {
      res.status(404).json({ error: 'task not found' })
      return
    }
    res.json({ ok: true })
  })
}
