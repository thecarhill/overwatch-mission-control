import { useState, type CSSProperties, type ReactNode } from 'react'
import { T } from '../../theme/tokens'

export function Btn({
  children,
  onClick,
  inverted,
  full,
  style: s,
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  inverted?: boolean
  full?: boolean
  style?: CSSProperties
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const [h, setH] = useState(false)
  const inv = inverted ?? false
  const bg = inv
    ? h
      ? 'transparent'
      : T.accent
    : h
      ? T.paper
      : 'transparent'
  const fg = inv
    ? h
      ? T.accent
      : T.onAccent
    : h
      ? T.void
      : T.paper
  const borderCol = inv ? T.accent : T.paper

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontFamily: T.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        border: `1px solid ${borderCol}`,
        padding: '7px 14px',
        background: bg,
        color: fg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.1s',
        width: full ? '100%' : 'auto',
        ...s,
      }}
    >
      {children}
    </button>
  )
}
