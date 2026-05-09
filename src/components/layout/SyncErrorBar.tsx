import { CmdLink } from '../primitives/CmdLink'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'

export function SyncErrorBar({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${T.paper}`,
        padding: '8px 24px',
        background: 'rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
      }}
    >
      <SysLabel style={{ fontSize: 10, color: T.paper }}>
        SYNC FAILURE: {message}
      </SysLabel>
      <CmdLink onClick={onRetry}>RETRY</CmdLink>
    </div>
  )
}
