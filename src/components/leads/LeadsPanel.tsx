import { useState } from 'react'
import { useApp } from '../../context/useApp'
import { Btn } from '../primitives/Btn'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'
import { LeadDetail } from './LeadDetail'
import { LeadsDataTable } from './LeadsDataTable'

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

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    city: '',
    url: '',
    notes: '',
  })

  const lead = leadDetailId ? leads.find((l) => l.id === leadDetailId) : undefined

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
        <LeadsDataTable leads={leads} onOpenLead={openLeadDetail} />
      </div>
    </div>
  )
}
