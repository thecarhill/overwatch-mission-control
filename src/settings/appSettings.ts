import type {
  ProjectsListViewMode,
  TasksListViewMode,
} from '../types'

const KEY = 'overwatch.settings.v1'

export interface AppSettings {
  projectsView: ProjectsListViewMode
  tasksView: TasksListViewMode
  /** Show “in 3 days” style strings for deadlines where useful */
  relativeDeadlines: boolean
  /** Confirm before deleting a task */
  confirmTaskDelete: boolean
}

const defaults: AppSettings = {
  projectsView: 'table',
  tasksView: 'table',
  relativeDeadlines: true,
  confirmTaskDelete: true,
}

export function readAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaults }
    const j = JSON.parse(raw) as Partial<AppSettings>
    return {
      projectsView:
        j.projectsView === 'kanban' || j.projectsView === 'table'
          ? j.projectsView
          : defaults.projectsView,
      tasksView:
        j.tasksView === 'kanban' || j.tasksView === 'table'
          ? j.tasksView
          : defaults.tasksView,
      relativeDeadlines:
        typeof j.relativeDeadlines === 'boolean'
          ? j.relativeDeadlines
          : defaults.relativeDeadlines,
      confirmTaskDelete:
        typeof j.confirmTaskDelete === 'boolean'
          ? j.confirmTaskDelete
          : defaults.confirmTaskDelete,
    }
  } catch {
    return { ...defaults }
  }
}

export function persistAppSettings(s: AppSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function defaultAppSettings(): AppSettings {
  return { ...defaults }
}
