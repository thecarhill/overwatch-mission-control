import { T } from '../../theme/tokens'

export function StatusDot({
  pulse,
  color = T.paper,
}: {
  pulse?: boolean
  color?: string
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        background: color,
        flexShrink: 0,
        animation: pulse
          ? 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite'
          : 'none',
      }}
    />
  )
}
