import { Btn } from '../primitives/Btn'
import { StatusDot } from '../primitives/StatusDot'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'
import { useApp } from '../../context/useApp'
import type { TabId } from '../../types'

export function BriefingPanel() {
  const {
    leads,
    inbox,
    projectCards,
    activityLog,
    setTab,
    refreshAll,
    leadsLoading,
    inboxLoading,
    projectsLoading,
    loading,
  } = useApp()

  const wip = projectCards.find((p) => p.status === 'WIP')
  const responded = leads.filter((l) => l.stage === 'RESPONDED').length
  const opened = leads.filter((l) => l.stage === 'OPENED').length
  const wipVal = wip ? '01' : '00'

  const urgentResponded = leads.filter((l) => l.stage === 'RESPONDED')[0]
  const wipProject = projectCards.find((p) => p.status === 'WIP')

  const onNav = (t: TabId) => setTab(t)

  const panelLoading =
    loading || leadsLoading || inboxLoading || projectsLoading

  if (panelLoading && leads.length === 0 && projectCards.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          fontFamily: T.mono,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
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
            DAILY BRIEFING
          </h1>
          <SysLabel style={{ color: T.muted, display: 'block', marginTop: 10 }}>
            SYSTEM STATUS: ALL REPOSITORIES NOMINAL
          </SysLabel>
        </div>
        <Btn inverted onClick={() => void refreshAll()}>
          SYNC ALL
        </Btn>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: 'ACTIVE WIP',
              value: wipVal,
              sub: wip ? wip.name : 'NONE',
              dot: true,
              invert: true,
            },
            {
              label: 'PIPELINE LOAD',
              value: String(leads.length).padStart(2, '0'),
              sub: `+${responded} RESPONDED`,
              invert: false,
            },
            {
              label: 'PENDING INBOX',
              value: String(inbox.length).padStart(2, '0'),
              sub: 'TRANSMISSIONS',
              invert: false,
            },
            {
              label: 'OPENED DEMOS',
              value: String(opened).padStart(2, '0'),
              sub: 'AWAITING RESPONSE',
              invert: false,
            },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${T.border}`,
                padding: 20,
                background: c.invert ? T.paper : 'transparent',
                color: c.invert ? T.void : T.paper,
              }}
            >
              <SysLabel
                style={{
                  color: c.invert ? 'rgba(255,255,255,0.6)' : T.muted,
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                {c.label}
              </SysLabel>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 40,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {c.value}
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {c.dot && (
                  <StatusDot
                    pulse
                    color={c.invert ? T.void : T.paper}
                  />
                )}
                <SysLabel
                  style={{
                    fontSize: 10,
                    color: c.invert ? 'rgba(255,255,255,0.7)' : T.muted,
                  }}
                >
                  {c.sub}
                </SysLabel>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 24,
          }}
        >
          <div style={{ border: `1px solid ${T.border}` }}>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${T.border}`,
                background: T.paper,
              }}
            >
              <SysLabel style={{ color: T.void }}>
                ACTIVE STREAM // LOG_VIEW
              </SysLabel>
            </div>
            <div
              style={{
                padding: 20,
                fontFamily: T.mono,
                fontSize: 12,
                lineHeight: 1.8,
                color: T.muted,
              }}
            >
              {activityLog.slice(0, 12).map((e, i) => (
                <div key={i}>
                  <span style={{ color: T.borderDim }}>
                    [{new Date(e.ts).toLocaleTimeString('en-GB')}]
                  </span>{' '}
                  <span style={{ color: T.paper, fontWeight: 700 }}>
                    {e.category}:
                  </span>{' '}
                  {e.message}
                </div>
              ))}
              <div style={{ marginTop: 8 }} className="animate-cursor-blink">
                _
              </div>
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${T.border}`,
              padding: 20,
              background: 'rgba(0,0,0,0.02)',
            }}
          >
            <SysLabel
              style={{
                display: 'block',
                marginBottom: 16,
                borderBottom: `1px solid ${T.border}`,
                paddingBottom: 8,
                fontWeight: 700,
              }}
            >
              URGENT ACTIONS
            </SysLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {urgentResponded && (
                <div
                  style={{
                    borderLeft: `3px solid ${T.paper}`,
                    paddingLeft: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setTab('leads')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setTab('leads')
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <SysLabel
                    style={{
                      fontSize: 10,
                      color: T.muted,
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    LEADS_CRM
                  </SysLabel>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {urgentResponded.name} responded — follow up
                  </div>
                </div>
              )}
              {wipProject && (
                <div
                  style={{
                    borderLeft: `3px solid ${T.paper}`,
                    paddingLeft: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => onNav('projects')}
                  role="button"
                  tabIndex={0}
                >
                  <SysLabel
                    style={{
                      fontSize: 10,
                      color: T.muted,
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    PROJECTS
                  </SysLabel>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {wipProject.nextPreview || 'Next action pending'}
                  </div>
                </div>
              )}
              <div
                style={{
                  borderLeft: `3px solid ${T.paper}`,
                  paddingLeft: 12,
                  opacity: inbox.length ? 1 : 0.4,
                  cursor: inbox.length ? 'pointer' : 'default',
                }}
                onClick={() => inbox.length && setTab('inbox')}
                role="button"
                tabIndex={0}
              >
                <SysLabel
                  style={{
                    fontSize: 10,
                    color: T.muted,
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  INBOX
                </SysLabel>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {inbox.length} unsorted transmissions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
