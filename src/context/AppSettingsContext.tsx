/* eslint-disable react-refresh/only-export-components -- settings provider */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultAppSettings,
  persistAppSettings,
  readAppSettings,
  type AppSettings,
} from '../settings/appSettings'

interface AppSettingsContextValue extends AppSettings {
  setProjectsView: (v: AppSettings['projectsView']) => void
  setTasksView: (v: AppSettings['tasksView']) => void
  setRelativeDeadlines: (v: boolean) => void
  setConfirmTaskDelete: (v: boolean) => void
  resetToDefaults: () => void
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => readAppSettings())

  const patch = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      persistAppSettings(next)
      return next
    })
  }, [])

  const setProjectsView = useCallback(
    (projectsView: AppSettings['projectsView']) => patch({ projectsView }),
    [patch],
  )
  const setTasksView = useCallback(
    (tasksView: AppSettings['tasksView']) => patch({ tasksView }),
    [patch],
  )
  const setRelativeDeadlines = useCallback(
    (relativeDeadlines: boolean) => patch({ relativeDeadlines }),
    [patch],
  )
  const setConfirmTaskDelete = useCallback(
    (confirmTaskDelete: boolean) => patch({ confirmTaskDelete }),
    [patch],
  )
  const resetToDefaults = useCallback(() => {
    const d = defaultAppSettings()
    persistAppSettings(d)
    setSettings(d)
  }, [])

  const value = useMemo(
    () => ({
      ...settings,
      setProjectsView,
      setTasksView,
      setRelativeDeadlines,
      setConfirmTaskDelete,
      resetToDefaults,
    }),
    [
      settings,
      setProjectsView,
      setTasksView,
      setRelativeDeadlines,
      setConfirmTaskDelete,
      resetToDefaults,
    ],
  )

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings outside AppSettingsProvider')
  return ctx
}
