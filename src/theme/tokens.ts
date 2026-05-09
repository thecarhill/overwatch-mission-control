/** Theme colors resolve via CSS variables (see `index.css` + ThemeProvider). */
export const T = {
  void: 'var(--ow-void)',
  paper: 'var(--ow-paper)',
  muted: 'var(--ow-muted)',
  border: 'var(--ow-border)',
  borderDim: 'var(--ow-border-dim)',
  hoverBg: 'var(--ow-hover)',
  accent: 'var(--ow-accent)',
  onAccent: 'var(--ow-on-accent)',
  mono: '"IBM Plex Mono", "Courier New", monospace',
  sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
} as const

/** Monochrome stage tags; accent is reserved for UI chrome */
export function stageStyleMono(): {
  color: string
  borderColor: string
} {
  return { color: T.muted, borderColor: T.borderDim }
}
