import { useState } from 'react'
import type { Lead, Stage } from '../../types'
import { STAGES } from '../../utils/constants'
import { Btn } from '../primitives/Btn'
import { CmdLink } from '../primitives/CmdLink'
import { RuleDim } from '../primitives/Rule'
import { SysLabel } from '../primitives/SysLabel'
import { Tag } from '../primitives/Tag'
import { stageStyleMono, T } from '../../theme/tokens'

export function LeadDetail({
  lead,
  onBack,
  onChange,
  onDelete,
  onStageChange,
}: {
  lead: Lead
  onBack: () => void
  onChange: (patch: Partial<Lead>) => void
  onDelete: () => void
  onStageChange: (stage: Stage) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const ss = stageStyleMono()

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
          background: T.void,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CmdLink onClick={onBack}>&lt;- RETURN TO TABLE</CmdLink>
          <span style={{ opacity: 0.2 }}>|</span>
          <SysLabel style={{ fontSize: 10 }}>{lead.id}</SysLabel>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SysLabel style={{ fontSize: 10 }}>STAGE:</SysLabel>
          <select
            value={lead.stage}
            onChange={(e) => onStageChange(e.target.value as Stage)}
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              fontWeight: 700,
              border: `1px solid ${T.border}`,
              padding: '6px 10px',
              background: T.void,
              color: T.paper,
            }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, maxWidth: 720 }}>
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            lineHeight: 0.95,
            textTransform: 'uppercase',
            margin: '0 0 8px',
          }}
        >
          {lead.name}
        </h2>
        <Tag style={{ ...ss, marginBottom: 16 }}>{lead.stage}</Tag>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Field
            label="CITY"
            value={lead.city}
            onChange={(v) => onChange({ city: v })}
          />
          <Field
            label="LAST CONTACT"
            value={lead.lastContact}
            onChange={(v) => onChange({ lastContact: v })}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 6 }}>
              DEMO URL
            </SysLabel>
            {lead.url ? (
              <a
                href={
                  lead.url.startsWith('http')
                    ? lead.url
                    : `https://${lead.url}`
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: T.mono,
                  fontSize: 13,
                  color: T.paper,
                  wordBreak: 'break-all',
                }}
              >
                {lead.url.startsWith('http') ? lead.url : `https://${lead.url}`}
              </a>
            ) : (
              <span style={{ fontFamily: T.mono, fontSize: 12 }}>—</span>
            )}
          </div>
          <Field
            label="SENT"
            value={lead.sent}
            onChange={(v) => onChange({ sent: v })}
          />
        </div>

        <SysLabel style={{ display: 'block', marginBottom: 8 }}>NOTES</SysLabel>
        <textarea
          value={lead.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={5}
          style={{
            width: '100%',
            fontFamily: T.sans,
            fontSize: 14,
            border: `1px solid ${T.border}`,
            padding: 12,
            marginBottom: 24,
          }}
        />

        <SysLabel style={{ display: 'block', marginBottom: 12 }}>
          ACTIVITY // TIMELINE
        </SysLabel>
        <div style={{ border: `1px solid ${T.border}`, padding: 16 }}>
          {lead.activity.map((a, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <SysLabel style={{ fontSize: 9, color: T.muted, display: 'block' }}>
                {a.ts}
              </SysLabel>
              <div style={{ fontFamily: T.mono, fontSize: 12 }}>{a.detail}</div>
              <RuleDim style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          {!confirmDel ? (
            <Btn onClick={() => setConfirmDel(true)}>DELETE LEAD</Btn>
          ) : (
            <>
              <Btn inverted onClick={() => onDelete()}>
                CONFIRM DELETE
              </Btn>
              <Btn onClick={() => setConfirmDel(false)}>CANCEL</Btn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 6 }}>
        {label}
      </SysLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          fontFamily: T.mono,
          fontSize: 12,
          border: `1px solid ${T.border}`,
          padding: 10,
          background: T.void,
          color: T.paper,
        }}
      />
    </div>
  )
}
