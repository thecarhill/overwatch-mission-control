import type { CSSProperties, ReactNode } from 'react'
import { T } from '../../theme/tokens'

export function Tag({
  children,
  style: s,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        border: `1px solid ${T.paper}`,
        display: 'inline-block',
        ...s,
      }}
    >
      {children}
    </span>
  )
}
