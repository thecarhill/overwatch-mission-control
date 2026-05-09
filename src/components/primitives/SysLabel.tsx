import type { CSSProperties, HTMLAttributes } from 'react'
import { T } from '../../theme/tokens'

export function SysLabel({
  children,
  className = '',
  style,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { style?: CSSProperties }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: T.mono,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  )
}
