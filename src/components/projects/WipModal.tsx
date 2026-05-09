import { Btn } from '../primitives/Btn'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'

export function WipModal({
  parkSlug,
  activateSlug,
  onConfirm,
  onCancel,
}: {
  parkSlug: string
  activateSlug: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(255,255,255,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      role="dialog"
      aria-modal
    >
      <div
        style={{
          border: `1px solid ${T.paper}`,
          padding: 24,
          maxWidth: 440,
          background: T.void,
        }}
      >
        <SysLabel style={{ display: 'block', marginBottom: 12 }}>
          WIP ENFORCER
        </SysLabel>
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6 }}>
          Park <strong>{parkSlug}</strong> and activate <strong>{activateSlug}</strong>?
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn inverted onClick={onConfirm}>
            CONFIRM
          </Btn>
          <Btn onClick={onCancel}>CANCEL</Btn>
        </div>
      </div>
    </div>
  )
}
