/* eslint-disable react-refresh/only-export-components -- theme provider + hook */
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ACCENT_PRESETS,
  applyThemeVars,
  persistTheme,
  readStoredAccent,
  readStoredTheme,
  type ThemeMode,
} from '../theme/applyTheme'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  accent: string
  setAccent: (hex: string) => void
  accentPresets: typeof ACCENT_PRESETS
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredTheme())
  const [accent, setAccentState] = useState(() => readStoredAccent())

  useLayoutEffect(() => {
    applyThemeVars(mode, accent)
    persistTheme(mode, accent)
  }, [mode, accent])

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
  }, [])

  const setAccent = useCallback((hex: string) => {
    setAccentState(hex)
  }, [])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      accent,
      setAccent,
      accentPresets: ACCENT_PRESETS,
    }),
    [mode, setMode, accent, setAccent],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useThemeConfig() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeConfig outside ThemeProvider')
  return ctx
}
