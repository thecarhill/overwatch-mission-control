import { useState } from 'react'
import { useApp } from '../../context/useApp'
import { Btn } from '../primitives/Btn'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'

export function InboxPanel() {
  const { inbox, logInbox, inboxTextAreaRef, inboxLoading } = useApp()
  const [val, setVal] = useState('')

  const submit = () => {
    const t = val.trim()
    if (!t) return
    void logInbox(t)
    setVal('')
  }

  if (inboxLoading && inbox.length === 0) {
    return (
      <div style={{ padding: 32, fontFamily: T.mono, fontSize: 11 }}>
        <span className="animate-pulse-ow">LOADING...</span>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            lineHeight: 0.88,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          INBOX
        </h1>
        <SysLabel style={{ color: T.muted, display: 'block', marginTop: 10 }}>
          CAPTURE // → OVERWATCH/INBOX.MD
        </SysLabel>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, maxWidth: 720 }}>
        <textarea
          ref={inboxTextAreaRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Capture loose thought, idea, or parking lot item. Push to inbox.md."
          style={{
            width: '100%',
            minHeight: 140,
            resize: 'vertical',
            background: 'transparent',
            border: `1px solid ${T.border}`,
            fontFamily: T.mono,
            fontSize: 13,
            lineHeight: 1.7,
            padding: 16,
            color: T.paper,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 12,
            alignItems: 'center',
          }}
        >
          <Btn onClick={submit}>LOG IT //</Btn>
          <SysLabel style={{ fontSize: 10, color: T.muted }}>
            ⌘+ENTER OR CTRL+ENTER TO SUBMIT
          </SysLabel>
        </div>

        <div
          style={{
            marginTop: 32,
            borderTop: `1px solid ${T.borderDim}`,
            paddingTop: 20,
          }}
        >
          <SysLabel
            style={{ display: 'block', marginBottom: 12, color: T.muted }}
          >
            RECENT TRANSMISSIONS
          </SysLabel>
          {inbox.map((e, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 16,
                padding: '10px 0',
                borderBottom: `1px solid ${T.borderDim}`,
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.muted,
                  minWidth: 80,
                  paddingTop: 2,
                }}
              >
                {e.ts}
              </span>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'rgba(0,0,0,0.75)',
                }}
              >
                {e.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
