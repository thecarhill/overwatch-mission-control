import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from 'react'
import type { Priority, Task, TaskStatus } from '../../types'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from '../../services/tasksApi'
import { RepoApiError } from '../../services/repoApi'
import { formatDeadlineLabel, formatIsoDate } from '../../utils/deadlineFormat'
import { useAppSettings } from '../../context/AppSettingsContext'
import { Btn } from '../primitives/Btn'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'TODO',
  in_progress: 'DOING',
  blocked: 'BLOCKED',
  done: 'DONE',
}

const PRIORITIES: Priority[] = [
  '01_CRITICAL',
  '02_HIGH',
  '03_STANDARD',
  '04_BACKLOG',
]

const inputStyle: CSSProperties = {
  fontFamily: T.mono,
  fontSize: 11,
  padding: '8px 10px',
  border: `1px solid ${T.border}`,
  background: 'transparent',
  color: T.paper,
  width: '100%',
  boxSizing: 'border-box',
}

export function ProjectTasksPanel({
  projectSlug,
  syncing,
}: {
  projectSlug: string
  syncing: boolean
}) {
  const {
    tasksView,
    setTasksView,
    relativeDeadlines,
    confirmTaskDelete,
  } = useAppSettings()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('03_STANDARD')

  const loadTasks = useCallback(async () => {
    try {
      const list = await fetchTasks(projectSlug)
      setTasks(list)
      setError(null)
    } catch (e) {
      const m = e instanceof RepoApiError ? e.message : String(e)
      setError(m)
    } finally {
      setLoading(false)
    }
  }, [projectSlug])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async /api/tasks load; setState only after await
    void loadTasks()
  }, [loadTasks])

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    setError(null)
    try {
      const t = await createTask({
        projectSlug,
        title,
        description: newDesc.trim(),
        priority: newPriority,
        deadline: newDeadline.trim() || null,
      })
      setTasks((prev) => [t, ...prev])
      setNewTitle('')
      setNewDesc('')
      setNewDeadline('')
      setNewPriority('03_STANDARD')
    } catch (e) {
      const m = e instanceof RepoApiError ? e.message : String(e)
      setError(m)
    }
  }

  const patchTask = async (
    id: string,
    patch: {
      title?: string
      description?: string
      status?: TaskStatus
      priority?: Priority
      deadline?: string | null
    },
  ) => {
    setError(null)
    try {
      const updated = await updateTask(id, patch)
      setTasks((prev) => prev.map((x) => (x.id === id ? updated : x)))
    } catch (e) {
      const m = e instanceof RepoApiError ? e.message : String(e)
      setError(m)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirmTaskDelete) {
      const ok = window.confirm('Delete this task?')
      if (!ok) return
    }
    setError(null)
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      const m = e instanceof RepoApiError ? e.message : String(e)
      setError(m)
    }
  }

  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <SysLabel style={{ fontSize: 10, color: T.muted }}>
          TASKS // SQLite table `tasks`
        </SysLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            inverted={tasksView === 'table'}
            onClick={() => setTasksView('table')}
          >
            TABLE
          </Btn>
          <Btn
            inverted={tasksView === 'kanban'}
            onClick={() => setTasksView('kanban')}
          >
            KANBAN
          </Btn>
        </div>
      </div>

      {error && (
        <div
          style={{
            border: `1px solid ${T.accent}`,
            padding: 10,
            fontFamily: T.mono,
            fontSize: 11,
            color: T.accent,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          border: `1px solid ${T.border}`,
          padding: 16,
        }}
      >
        <SysLabel style={{ display: 'block', marginBottom: 10 }}>
          NEW TASK
        </SysLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <input
            style={inputStyle}
            placeholder="Title *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            style={inputStyle}
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Description"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          rows={2}
          style={{
            ...inputStyle,
            fontFamily: T.sans,
            marginBottom: 12,
            resize: 'vertical',
          }}
        />
        <Btn
          inverted
          disabled={syncing || loading || !newTitle.trim()}
          onClick={() => void handleCreate()}
        >
          ADD TASK
        </Btn>
      </div>

      {loading ? (
        <SysLabel>Loading tasks…</SysLabel>
      ) : tasksView === 'table' ? (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: T.mono,
              fontSize: 11,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={th}>TITLE</th>
                <th style={th}>STATUS</th>
                <th style={th}>PRIORITY</th>
                <th style={th}>CREATED</th>
                <th style={th}>DEADLINE</th>
                <th style={th}>DESCRIPTION</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                  <td style={td}>
                    <input
                      style={{ ...inputStyle, border: 'none', padding: 4 }}
                      value={t.title}
                      onChange={(e) =>
                        setTasks((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, title: e.target.value } : x,
                          ),
                        )
                      }
                      onBlur={() => {
                        const cur = tasks.find((x) => x.id === t.id)
                        if (cur && cur.title.trim()) void patchTask(t.id, { title: cur.title })
                      }}
                    />
                  </td>
                  <td style={td}>
                    <select
                      value={t.status}
                      onChange={(e) => {
                        const st = e.target.value as TaskStatus
                        setTasks((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, status: st } : x)),
                        )
                        void patchTask(t.id, { status: st })
                      }}
                      style={{
                        ...inputStyle,
                        border: 'none',
                        cursor: 'pointer',
                        maxWidth: 140,
                      }}
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <select
                      value={t.priority}
                      onChange={(e) => {
                        const pr = e.target.value as Priority
                        setTasks((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, priority: pr } : x,
                          ),
                        )
                        void patchTask(t.id, { priority: pr })
                      }}
                      style={{
                        ...inputStyle,
                        border: 'none',
                        cursor: 'pointer',
                        maxWidth: 140,
                      }}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    {formatIsoDate(t.createdAt)}
                  </td>
                  <td style={td}>
                    <input
                      type="date"
                      style={{ ...inputStyle, maxWidth: 150 }}
                      value={t.deadline ? t.deadline.slice(0, 10) : ''}
                      onChange={(e) => {
                        const v = e.target.value || null
                        setTasks((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, deadline: v } : x,
                          ),
                        )
                      }}
                      onBlur={() => {
                        const cur = tasks.find((x) => x.id === t.id)
                        if (cur) void patchTask(t.id, { deadline: cur.deadline })
                      }}
                    />
                    <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>
                      {formatDeadlineLabel(t.deadline, relativeDeadlines)}
                    </div>
                  </td>
                  <td style={{ ...td, maxWidth: 220 }}>
                    <textarea
                      style={{
                        ...inputStyle,
                        fontFamily: T.sans,
                        fontSize: 11,
                        resize: 'vertical',
                        minHeight: 36,
                      }}
                      rows={2}
                      value={t.description}
                      onChange={(e) =>
                        setTasks((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                      onBlur={() => {
                        const cur = tasks.find((x) => x.id === t.id)
                        if (cur) void patchTask(t.id, { description: cur.description })
                      }}
                    />
                  </td>
                  <td style={td}>
                    <Btn type="button" onClick={() => void handleDelete(t.id)}>
                      DEL
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <SysLabel style={{ display: 'block', marginTop: 16 }}>
              No tasks yet.
            </SysLabel>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 8,
            alignItems: 'flex-start',
          }}
        >
          {TASK_STATUSES.map((columnKey) => (
            <div
              key={columnKey}
              style={{
                flex: '1 1 220px',
                minWidth: 200,
                maxWidth: 320,
                border: `1px solid ${T.border}`,
                padding: 10,
                background: 'rgba(0,0,0,0.02)',
              }}
            >
              <SysLabel style={{ display: 'block', marginBottom: 10 }}>
                {STATUS_LABEL[columnKey]} ({byStatus(columnKey).length})
              </SysLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byStatus(columnKey).map((t) => (
                  <div
                    key={t.id}
                    style={{
                      border: `1px solid ${T.borderDim}`,
                      padding: 10,
                      background: T.void,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        marginBottom: 6,
                        wordBreak: 'break-word',
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>
                      {t.priority} · created {formatIsoDate(t.createdAt)}
                    </div>
                    <div style={{ fontSize: 10, marginBottom: 6 }}>
                      <span style={{ color: T.muted }}>Due: </span>
                      {formatDeadlineLabel(t.deadline, relativeDeadlines)}
                      {t.deadline ? ` (${t.deadline.slice(0, 10)})` : ''}
                    </div>
                    {t.description.trim() ? (
                      <div
                        style={{
                          fontSize: 11,
                          lineHeight: 1.4,
                          marginBottom: 8,
                          maxHeight: 80,
                          overflow: 'hidden',
                        }}
                      >
                        {t.description}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {TASK_STATUSES.filter((s) => s !== columnKey).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void patchTask(t.id, { status: s })}
                          style={{
                            fontFamily: T.mono,
                            fontSize: 9,
                            padding: '4px 6px',
                            border: `1px solid ${T.border}`,
                            background: 'transparent',
                            color: T.paper,
                            cursor: 'pointer',
                          }}
                        >
                          → {STATUS_LABEL[s]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => void handleDelete(t.id)}
                        style={{
                          fontFamily: T.mono,
                          fontSize: 9,
                          padding: '4px 6px',
                          border: `1px solid ${T.accent}`,
                          background: 'transparent',
                          color: T.accent,
                          cursor: 'pointer',
                        }}
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontWeight: 700,
  fontSize: 9,
  color: T.muted,
}

const td: CSSProperties = {
  padding: '6px 10px',
  verticalAlign: 'top',
}
