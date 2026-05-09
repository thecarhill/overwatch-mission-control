import { useMemo, useState } from 'react'
import type { Lead } from '../../types'
import { useApp } from '../../context/useApp'
import { Btn } from '../primitives/Btn'
import { SysLabel } from '../primitives/SysLabel'
import { Tag } from '../primitives/Tag'
import { stageStyleMono, T } from '../../theme/tokens'
import { LeadDetail } from './LeadDetail'

type SortKey = 'name' | 'city' | 'url' | 'sent' | 'stage' | 'lastContact'

export function LeadsPanel() {
  const {
    leads,
    leadsLoading,
    leadDetailId,
    openLeadDetail,
    closeLeadDetail,
    updateLead,
    deleteLead,
    createLead,
    setLeadStage,
  } = useApp()

  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: 'name',
    asc: true,
  })
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    city: '',
    url: '',
    notes: '',
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

  const lead = leadDetailId ? leads.find((l) => l.id === leadDetailId) : undefined

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key ? { key, asc: !s.asc } : { key, asc: true },
    )
  }

  if (leadDetailId && lead) {
    return (
      <LeadDetail
        lead={lead}
        onBack={() => closeLeadDetail()}
        onChange={(patch) => updateLead(lead.id, patch)}
        onDelete={() => deleteLead(lead.id)}
        onStageChange={(stage) => setLeadStage(lead.id, stage)}
      />
    )
  }

  if (leadsLoading && leads.length === 0) {
    return (
      <div style={{ padding: 32, fontFamily: T.mono, fontSize: 11 }}>
        <span className="animate-pulse-ow">LOADING...</span>
      </div>
    )
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'NAME' },
    { key: 'city', label: 'CITY' },
    { key: 'url', label: 'DEMO URL' },
    { key: 'sent', label: 'SENT' },
    { key: 'stage', label: 'STAGE' },
    { key: 'lastContact', label: 'LAST CONTACT' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              lineHeight: 0.88,
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            LEADS_CRM
          </h1>
          <SysLabel style={{ color: T.muted, display: 'block', marginTop: 10 }}>
            ACTIVE PIPELINE: {leads.length} CONTACTS
          </SysLabel>
        </div>
        <Btn onClick={() => setShowAdd((s) => !s)}>+ ADD LEAD</Btn>
      </div>

      {showAdd && (
        <div
          style={{
            padding: '16px 32px',
            borderBottom: `1px solid ${T.border}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <input
            placeholder="Name *"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            style={{
              fontFamily: T.mono,
              fontSize: 12,
              border: `1px solid ${T.border}`,
              padding: 10,
            }}
          />
          <input
            placeholder="City *"
            value={addForm.city}
            onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))}
            style={{
              fontFamily: T.mono,
              fontSize: 12,
              border: `1px solid ${T.border}`,
              padding: 10,
            }}
          />
          <input
            placeholder="Demo URL"
            value={addForm.url}
            onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
            style={{
              fontFamily: T.mono,
              fontSize: 12,
              border: `1px solid ${T.border}`,
              padding: 10,
            }}
          />
          <Btn
            inverted
            onClick={() => {
              if (!addForm.name.trim() || !addForm.city.trim()) return
              createLead({
                name: addForm.name,
                city: addForm.city,
                url: addForm.url,
                notes: addForm.notes,
              })
              setAddForm({ name: '', city: '', url: '', notes: '' })
              setShowAdd(false)
            }}
          >
            CREATE
          </Btn>
          <textarea
            placeholder="Notes (optional)"
            value={addForm.notes}
            onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
            style={{
              gridColumn: '1 / -1',
              fontFamily: T.sans,
              fontSize: 13,
              border: `1px solid ${T.border}`,
              padding: 10,
              minHeight: 60,
            }}
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
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
            {cols.map((c) => (
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
              onOpen={() => openLeadDetail(l.id)}
            />
          ))}
        </div>
      </div>
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
