import { useState, type CSSProperties, type ReactNode } from 'react'
import { T } from '../../theme/tokens'

export function CmdLink({
  children,
  onClick,
  style: s,
}: {
  children: ReactNode
  onClick?: () => void
  style?: CSSProperties
}) {
  const [h, setH] = useState(false)
  return (
    <span
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontFamily: T.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textDecoration: h ? 'none' : 'underline',
        textUnderlineOffset: 4,
        cursor: 'pointer',
        background: h ? T.accent : 'transparent',
        color: h ? T.onAccent : 'inherit',
        padding: h ? '0 4px' : 0,
        ...s,
      }}
    >
      {children}
    </span>
  )
}
