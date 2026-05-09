import type { CSSProperties } from 'react'
import { T } from '../../theme/tokens'

export function Rule({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: T.border,
        width: '100%',
        ...style,
      }}
    />
  )
}

export function RuleDim({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: T.borderDim,
        width: '100%',
        ...style,
      }}
    />
  )
}
