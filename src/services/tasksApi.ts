import { RepoApiError } from './repoApi'
import type { Priority, Task, TaskStatus } from '../types'

const base = import.meta.env.VITE_API_BASE ?? ''

export async function fetchTasks(projectSlug: string): Promise<Task[]> {
  const r = await fetch(
    `${base}/api/tasks?project_slug=${encodeURIComponent(projectSlug)}`,
  )
  if (!r.ok) throw new RepoApiError(await r.text(), r.status)
  const j = (await r.json()) as { tasks: Task[] }
  return j.tasks ?? []
}

/** All tasks across projects (`GET /api/tasks` without project_slug). */
export async function fetchAllTasks(): Promise<Task[]> {
  const r = await fetch(`${base}/api/tasks`)
  if (!r.ok) throw new RepoApiError(await r.text(), r.status)
  const j = (await r.json()) as { tasks: Task[] }
  return j.tasks ?? []
}

export async function createTask(payload: {
  projectSlug: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: Priority
  deadline?: string | null
}): Promise<Task> {
  const r = await fetch(`${base}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_slug: payload.projectSlug,
      title: payload.title,
      description: payload.description ?? '',
      status: payload.status,
      priority: payload.priority,
      deadline: payload.deadline,
    }),
  })
  if (!r.ok) throw new RepoApiError(await r.text(), r.status)
  const j = (await r.json()) as { task: Task }
  return j.task
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string
    description: string
    status: TaskStatus
    priority: Priority
    deadline: string | null
  }>,
): Promise<Task> {
  const r = await fetch(`${base}/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!r.ok) throw new RepoApiError(await r.text(), r.status)
  const j = (await r.json()) as { task: Task }
  return j.task
}

export async function deleteTask(id: string): Promise<void> {
  const r = await fetch(`${base}/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!r.ok) throw new RepoApiError(await r.text(), r.status)
}
