export type ThemeMode = 'light' | 'dark'

const STORAGE_THEME = 'overwatch-theme'
const STORAGE_ACCENT = 'overwatch-accent'

/** Curated accents (hex). First is default neutral. */
export const ACCENT_PRESETS = [
  { id: 'ink', label: 'INK', hex: '#000000' },
  { id: 'blue', label: 'BLUE', hex: '#2563eb' },
  { id: 'green', label: 'GREEN', hex: '#16a34a' },
  { id: 'red', label: 'RED', hex: '#dc2626' },
  { id: 'violet', label: 'VIOLET', hex: '#7c3aed' },
  { id: 'amber', label: 'AMBER', hex: '#d97706' },
  { id: 'cyan', label: 'CYAN', hex: '#0891b2' },
  { id: 'rose', label: 'ROSE', hex: '#e11d48' },
] as const

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Relative luminance 0–1 */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const r = lin(rgb.r)
  const g = lin(rgb.g)
  const b = lin(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Text color that contrasts with accent background */
export function onAccentColor(accentHex: string): '#ffffff' | '#000000' {
  return luminance(accentHex) > 0.45 ? '#000000' : '#ffffff'
}

export function applyThemeVars(mode: ThemeMode, accentHex: string): void {
  const root = document.documentElement
  root.dataset.theme = mode
  root.style.setProperty('--ow-accent', accentHex)
  root.style.setProperty('--ow-on-accent', onAccentColor(accentHex))
}

export function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_THEME)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return 'light'
}

export function readStoredAccent(): string {
  try {
    const v = localStorage.getItem(STORAGE_ACCENT)
    if (v && /^#[0-9a-f]{6}$/i.test(v)) return v
  } catch {
    /* ignore */
  }
  return ACCENT_PRESETS[0].hex
}

export function persistTheme(mode: ThemeMode, accentHex: string): void {
  try {
    localStorage.setItem(STORAGE_THEME, mode)
    localStorage.setItem(STORAGE_ACCENT, accentHex)
  } catch {
    /* ignore */
  }
}
