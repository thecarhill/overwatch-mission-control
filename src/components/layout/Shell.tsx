import type { ReactNode } from 'react'
import { useApp } from '../../context/useApp'
import { usePanelShortcut } from '../../context/keyboardShortcuts'
import { PATH_MAP } from '../../utils/constants'
import { NavBtn } from '../primitives/NavBtn'
import { Rule } from '../primitives/Rule'
import { StatusDot } from '../primitives/StatusDot'
import { SysLabel } from '../primitives/SysLabel'
import { Clock } from '../primitives/Clock'
import { SyncErrorBar } from './SyncErrorBar'
import { Btn } from '../primitives/Btn'
import { T } from '../../theme/tokens'

export function Shell({ children }: { children: ReactNode }) {
  const {
    tab,
    setTab,
    syncError,
    retrySync,
    wipName,
    inbox,
    inboxTextAreaRef,
    closeProjectDetail,
    closeLeadDetail,
    dirtyCount,
    githubRemoteConfigured,
    pushToGithub,
    pullFromGithub,
    syncing,
  } = useApp()

  usePanelShortcut(setTab, inboxTextAreaRef, () => {
    closeProjectDetail()
    closeLeadDetail()
  })

  const pathMap = PATH_MAP
  const tabs = [
    { id: 'briefing' as const, label: 'BRIEFING', num: '[00]' },
    { id: 'projects' as const, label: 'PROJECTS', num: '[01]' },
    { id: 'leads' as const, label: 'LEADS_CRM', num: '[02]' },
    { id: 'pipeline' as const, label: 'PIPELINE', num: '[03]' },
    { id: 'inbox' as const, label: 'INBOX', num: '[04]', badge: String(inbox.length) },
    { id: 'config' as const, label: 'CONFIG', num: '[05]' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        fontFamily: T.sans,
        background: T.void,
        color: T.paper,
        overflow: 'hidden',
      }}
    >
      <aside
        style={{
          width: 256,
          borderRight: `1px solid ${T.border}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ padding: 24, borderBottom: `1px solid ${T.border}` }}>
            <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 4 }}>
              COMMAND.SYS // V1.0.0
            </SysLabel>
            <div
              style={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: 20,
                marginBottom: 16,
              }}
            >
              OVERWATCH
            </div>
            <Rule />
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <StatusDot /> <SysLabel>ONLINE</SysLabel>
            </div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {tabs.map((t) => (
              <NavBtn
                key={t.id}
                label={t.label}
                num={t.num}
                badge={t.badge}
                active={tab === t.id}
                onClick={() => setTab(t.id)}
              />
            ))}
          </nav>
        </div>
        <div style={{ padding: 16, borderTop: `1px solid ${T.border}` }}>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.paper,
              lineHeight: 1.8,
              whiteSpace: 'pre',
            }}
          >
            {`> SYS.CHECK: OK
> UPLINK: STABLE
> AUTH: ROOT
> WIP=1 ENFORCED
> DIR: /overwatch/`}
          </div>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <header
          style={{
            minHeight: 56,
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <SysLabel style={{ fontSize: 11 }}>{pathMap[tab]}</SysLabel>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <SysLabel style={{ fontSize: 9, color: T.muted }}>
              GH: {githubRemoteConfigured ? 'OK' : 'NO ENV'}
            </SysLabel>
            <SysLabel style={{ fontSize: 9, color: T.muted }}>
              DIRTY: {dirtyCount}
            </SysLabel>
            <Btn
              inverted
              onClick={() => void pullFromGithub()}
              disabled={syncing}
            >
              PULL
            </Btn>
            <Btn
              onClick={() => void pushToGithub()}
              disabled={syncing || !githubRemoteConfigured}
            >
              PUSH
            </Btn>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1px solid ${T.paper}`,
              padding: '4px 12px',
              background: 'rgba(0,0,0,0.03)',
            }}
          >
            <StatusDot pulse />
            <SysLabel style={{ fontSize: 10 }}>
              ACTIVE WIP: {wipName ? wipName : 'NO ACTIVE WIP'}
            </SysLabel>
            <span>|</span>
            <Clock />
          </div>
        </header>
        {syncError && (
          <SyncErrorBar message={syncError} onRetry={retrySync} />
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      </main>
    </div>
  )
}
