import { useMemo, useState } from 'react'
import type { Lead } from '../../types'
import { SysLabel } from '../primitives/SysLabel'
import { Tag } from '../primitives/Tag'
import { stageStyleMono, T } from '../../theme/tokens'

type SortKey = 'name' | 'city' | 'url' | 'sent' | 'stage' | 'lastContact'

const COLS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'NAME' },
  { key: 'city', label: 'CITY' },
  { key: 'url', label: 'DEMO URL' },
  { key: 'sent', label: 'SENT' },
  { key: 'stage', label: 'STAGE' },
  { key: 'lastContact', label: 'LAST CONTACT' },
]

export function LeadsDataTable({
  leads,
  onOpenLead,
}: {
  leads: Lead[]
  onOpenLead: (id: string) => void
}) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: 'name',
    asc: true,
  })

  const sorted = useMemo(() => {
    const arr = [...leads]
    const { key, asc } = sort
    arr.sort((a, b) => {
      const va = a[key]
      const vb = b[key]
      const c = String(va).localeCompare(String(vb))
      return asc ? c : -c
    })
    return arr
  }, [leads, sort])

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key ? { key, asc: !s.asc } : { key, asc: true },
    )
  }

  return (
    <div style={{ border: `1px solid ${T.border}`, minWidth: 700 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 2fr 1fr 2fr 1fr 1fr 1fr',
          padding: '10px 16px',
          borderBottom: `1px solid ${T.border}`,
          background: T.paper,
        }}
      >
        <SysLabel style={{ color: T.void, fontSize: 10 }}>#</SysLabel>
        {COLS.map((c) => (
          <button
            type="button"
            key={c.label}
            onClick={() => toggleSort(c.key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
            }}
          >
            <SysLabel style={{ color: T.void, fontSize: 10 }}>
              {c.label}
              {sort.key === c.key ? (sort.asc ? ' ↑' : ' ↓') : ''}
            </SysLabel>
          </button>
        ))}
      </div>
      {sorted.map((l, i) => (
        <LeadRow
          key={l.id}
          lead={l}
          idx={i}
          last={i === sorted.length - 1}
          onOpen={() => onOpenLead(l.id)}
        />
      ))}
    </div>
  )
}

function LeadRow({
  lead,
  idx,
  last,
  onOpen,
}: {
  lead: Lead
  idx: number
  last: boolean
  onOpen: () => void
}) {
  const [h, setH] = useState(false)
  const ss = stageStyleMono()
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 2fr 1fr 2fr 1fr 1fr 1fr',
        padding: '12px 16px',
        borderBottom: last ? 'none' : `1px solid ${T.borderDim}`,
        background: h ? T.hoverBg : 'transparent',
        cursor: 'pointer',
        alignItems: 'center',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>
        [{String(idx + 1).padStart(2, '0')}]
      </span>
      <span style={{ fontWeight: 600, fontSize: 13 }}>{lead.name}</span>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>
        {lead.city}
      </span>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>
        {lead.url}
      </span>
      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>
        {lead.sent}
      </span>
      <span>
        <Tag style={{ ...ss, fontSize: 9, padding: '2px 5px' }}>{lead.stage}</Tag>
      </span>
      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>
        {lead.lastContact}
      </span>
    </div>
  )
}
