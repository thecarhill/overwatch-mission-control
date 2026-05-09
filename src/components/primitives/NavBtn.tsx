import { useState } from 'react'
import { SysLabel } from './SysLabel'
import { T } from '../../theme/tokens'

export function NavBtn({
  label,
  num,
  badge,
  active,
  onClick,
}: {
  label: string
  num: string
  badge?: string
  active: boolean
  onClick: () => void
}) {
  const [h, setH] = useState(false)
  const on = active || h
  const bg = active ? T.accent : h ? T.hoverBg : 'transparent'
  const labelColor = active ? T.onAccent : T.paper
  const badgeBg = active ? T.onAccent : on ? T.void : T.paper
  const badgeFg = active ? T.accent : on ? T.paper : T.void
  const arrowColor = active ? T.onAccent : on ? T.paper : T.paper

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '20px 24px',
        borderBottom: `1px solid ${T.border}`,
        background: bg,
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <SysLabel style={{ color: labelColor }}>
        {num} {label}
      </SysLabel>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {badge && (
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              fontWeight: 700,
              background: badgeBg,
              color: badgeFg,
              padding: '0 5px',
            }}
          >
            {badge}
          </span>
        )}
        {active && (
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              fontWeight: 700,
              color: arrowColor,
            }}
          >
            &lt;-
          </span>
        )}
      </span>
    </button>
  )
}
