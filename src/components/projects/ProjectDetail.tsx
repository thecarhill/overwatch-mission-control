import { useState } from 'react'
import type { ParsedState, Priority, ProjectStatus } from '../../types'
import { Btn } from '../primitives/Btn'
import { CmdLink } from '../primitives/CmdLink'
import { Rule } from '../primitives/Rule'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'

const PRIORITIES: Priority[] = [
  '01_CRITICAL',
  '02_HIGH',
  '03_STANDARD',
  '04_BACKLOG',
]

const STATUSES: ProjectStatus[] = ['WIP', 'PARKED', 'BACKLOG']

export function ProjectDetail({
  displayId,
  initial,
  syncing,
  onClose,
  onSave,
  onToggleWip,
  onSaveSession,
}: {
  displayId: string
  initial: ParsedState
  syncing: boolean
  onClose: () => void
  onSave: (next: ParsedState) => void | Promise<void>
  onToggleWip: (draft: ParsedState) => void | Promise<void>
  onSaveSession: (draft: ParsedState, note: string) => void | Promise<void>
}) {
  const [draft, setDraft] = useState<ParsedState>(initial)
  const [sessionNote, setSessionNote] = useState('')

  const update = (patch: Partial<ParsedState>) =>
    setDraft((d) => ({ ...d, ...patch }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '14px 32px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          background: T.void,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CmdLink onClick={onClose}>&lt;- RETURN TO LIST</CmdLink>
          <span style={{ opacity: 0.2 }}>|</span>
          <SysLabel>TARGET: {displayId}</SysLabel>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SysLabel style={{ fontSize: 10, color: T.muted }}>
            {syncing ? 'SYNCING...' : ''}
          </SysLabel>
          <CmdLink onClick={() => void onToggleWip(draft)}>TOGGLE WIP</CmdLink>
          <Btn inverted onClick={() => void onSave(draft)}>
            PUSH TO REPO
          </Btn>
        </div>
      </div>
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <div style={{ maxWidth: 800 }}>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 0.88,
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            {draft.projectName}
          </h2>
          <Rule style={{ marginBottom: 24 }} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Field label="PROJECT ID" value={displayId} />
            <div style={{ border: `1px solid ${T.border}`, padding: 14 }}>
              <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 6 }}>
                STATUS
              </SysLabel>
              <select
                value={draft.status}
                onChange={(e) =>
                  update({ status: e.target.value as ProjectStatus })
                }
                style={{
                  fontFamily: T.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: T.paper,
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ border: `1px solid ${T.border}`, padding: 14 }}>
              <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 6 }}>
                PRIORITY
              </SysLabel>
              <select
                value={draft.priority}
                onChange={(e) =>
                  update({ priority: e.target.value as Priority })
                }
                style={{
                  fontFamily: T.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: T.paper,
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SysLabel style={{ display: 'block', marginBottom: 4 }}>
            CURRENT TASK
          </SysLabel>
          <textarea
            value={draft.currentTask}
            onChange={(e) => update({ currentTask: e.target.value })}
            rows={4}
            style={{
              width: '100%',
              fontFamily: T.sans,
              fontSize: 14,
              lineHeight: 1.7,
              border: `1px solid ${T.border}`,
              padding: 12,
              resize: 'vertical',
              marginBottom: 24,
            }}
          />

          <SysLabel style={{ display: 'block', marginBottom: 4 }}>
            NEXT ACTION
          </SysLabel>
          <textarea
            value={draft.nextAction}
            onChange={(e) => update({ nextAction: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              fontFamily: T.sans,
              fontSize: 14,
              border: `1px solid ${T.border}`,
              padding: 12,
              resize: 'vertical',
              marginBottom: 24,
            }}
          />

          <SysLabel style={{ display: 'block', marginBottom: 4 }}>
            BLOCKER
          </SysLabel>
          <textarea
            value={draft.blocker}
            onChange={(e) => update({ blocker: e.target.value })}
            rows={2}
            style={{
              width: '100%',
              fontFamily: T.mono,
              fontSize: 12,
              border: `1px solid ${T.border}`,
              padding: 12,
              marginBottom: 24,
            }}
          />

          <SysLabel style={{ display: 'block', marginBottom: 12 }}>
            PARKING LOT
          </SysLabel>
          {draft.parkingLot.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={item}
                onChange={(e) => {
                  const next = [...draft.parkingLot]
                  next[i] = e.target.value
                  update({ parkingLot: next })
                }}
                style={{
                  flex: 1,
                  fontFamily: T.mono,
                  fontSize: 12,
                  border: `1px solid ${T.border}`,
                  padding: 8,
                }}
              />
              <Btn
                onClick={() =>
                  update({
                    parkingLot: draft.parkingLot.filter((_, j) => j !== i),
                  })
                }
              >
                ✕
              </Btn>
            </div>
          ))}
          <Btn
            onClick={() =>
              update({ parkingLot: [...draft.parkingLot, ''] })
            }
          >
            + ITEM
          </Btn>

          <Rule style={{ margin: '24px 0' }} />
          <SysLabel style={{ display: 'block', marginBottom: 12 }}>
            SESSION LOG (APPEND)
          </SysLabel>
          <textarea
            value={sessionNote}
            onChange={(e) => setSessionNote(e.target.value)}
            placeholder="Note for session log"
            rows={2}
            style={{
              width: '100%',
              fontFamily: T.mono,
              fontSize: 12,
              border: `1px solid ${T.border}`,
              padding: 12,
              marginBottom: 8,
            }}
          />
          <Btn
            onClick={() => {
              const n = sessionNote.trim()
              if (!n) return
              void onSaveSession(draft, n)
              setSessionNote('')
            }}
          >
            APPEND LOG ENTRY
          </Btn>

          <Rule style={{ margin: '24px 0' }} />
          <SysLabel style={{ display: 'block', marginBottom: 16 }}>
            SESSION LOG
          </SysLabel>
          {[...draft.sessionLog].reverse().map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: `1px solid ${T.borderDim}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 11,
                    color: T.muted,
                    minWidth: 90,
                  }}
                >
                  {s.date}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 12 }}>{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, padding: 14 }}>
      <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 6 }}>
        {label}
      </SysLabel>
      <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
        {value}
      </div>
    </div>
  )
}
