import { useMemo, useState } from 'react'
import { useApp } from '../../context/useApp'
import { Btn } from '../primitives/Btn'
import { SysLabel } from '../primitives/SysLabel'
import { Tag } from '../primitives/Tag'
import { T } from '../../theme/tokens'
import { ProjectDetail } from './ProjectDetail'
import { WipModal } from './WipModal'

export function ProjectsPanel() {
  const {
    projectCards,
    projectsLoading,
    projectDetailSlug,
    openProjectDetail,
    closeProjectDetail,
    getProjectState,
    loadProjectState,
    saveProjectState,
    prepareWipToggle,
    executeWipSwap,
    syncing,
  } = useApp()

  const [hoverId, setHoverId] = useState<string | null>(null)
  const [wipModal, setWipModal] = useState<{
    parkSlug: string
    activateSlug: string
  } | null>(null)

  const detailSlug = projectDetailSlug
  const card = useMemo(
    () => projectCards.find((p) => p.slug === detailSlug),
    [projectCards, detailSlug],
  )
  const cached = detailSlug ? getProjectState(detailSlug) : undefined

  const handleOpen = async (slug: string) => {
    openProjectDetail(slug)
    await loadProjectState(slug)
  }

  const handleSave = async (slug: string, draft: import('../../types').ParsedState) => {
    await saveProjectState(slug, draft)
  }

  const handleToggleWip = async (slug: string, draft: import('../../types').ParsedState) => {
    const plan = await prepareWipToggle(slug, draft)
    if (plan.action === 'confirm_swap') {
      setWipModal({ parkSlug: plan.parkSlug, activateSlug: plan.activateSlug })
      return
    }
    await saveProjectState(slug, { ...draft, status: plan.newStatus })
  }

  if (projectsLoading && projectCards.length === 0) {
    return (
      <div style={{ padding: 32, fontFamily: T.mono, fontSize: 11 }}>
        <span className="animate-pulse-ow">LOADING...</span>
      </div>
    )
  }

  if (detailSlug && card && cached) {
    return (
      <>
        <ProjectDetail
          key={`${detailSlug}-${cached.sha}`}
          displayId={card.displayId}
          initial={cached.parsed}
          syncing={syncing}
          onClose={() => closeProjectDetail()}
          onSave={(d) => handleSave(detailSlug, d)}
          onToggleWip={(d) => handleToggleWip(detailSlug, d)}
          onSaveSession={(d, note) =>
            saveProjectState(detailSlug, d, { sessionNote: note })
          }
        />
        {wipModal && (
          <WipModal
            parkSlug={wipModal.parkSlug}
            activateSlug={wipModal.activateSlug}
            onCancel={() => setWipModal(null)}
            onConfirm={async () => {
              await executeWipSwap(wipModal.parkSlug, wipModal.activateSlug)
              setWipModal(null)
              await loadProjectState(detailSlug)
            }}
          />
        )}
      </>
    )
  }

  if (detailSlug && (!card || !cached)) {
    return (
      <div style={{ padding: 32 }}>
        <SysLabel>LOADING PROJECT...</SysLabel>
        <Btn onClick={() => closeProjectDetail()}>BACK</Btn>
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
            PROJECTS
          </h1>
          <SysLabel style={{ color: T.muted, display: 'block', marginTop: 10 }}>
            SOURCE: SERVER SQLITE // {projectCards.length} REGISTERED
          </SysLabel>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {projectCards.map((p) => {
            const isWip = p.status === 'WIP'
            const hov = hoverId === p.slug
            return (
              <div
                key={p.slug}
                onClick={() => void handleOpen(p.slug)}
                onMouseEnter={() => setHoverId(p.slug)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  border: `1px solid ${T.border}`,
                  padding: 24,
                  cursor: 'pointer',
                  background: isWip ? T.paper : hov ? 'rgba(0,0,0,0.04)' : 'transparent',
                  color: isWip ? T.void : T.paper,
                  transition: 'background 0.1s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 20,
                  }}
                >
                  <Tag
                    style={
                      isWip
                        ? { background: T.void, color: T.paper, borderColor: T.void }
                        : {}
                    }
                  >
                    STATUS: {p.status}
                  </Tag>
                  <span style={{ fontFamily: T.mono, fontSize: 11, opacity: 0.6 }}>
                    {p.displayId}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    margin: '0 0 8px',
                  }}
                >
                  {p.name}
                </h3>
                <div
                  style={{
                    height: 1,
                    background: isWip ? 'rgba(255,255,255,0.25)' : T.borderDim,
                    margin: '16px 0',
                  }}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                  }}
                >
                  <div>
                    <SysLabel
                      style={{
                        opacity: 0.6,
                        display: 'block',
                        marginBottom: 4,
                        fontSize: 10,
                      }}
                    >
                      LAST UPDATED
                    </SysLabel>
                    <div style={{ fontFamily: T.mono, fontSize: 12 }}>{p.updated}</div>
                  </div>
                  <div>
                    <SysLabel
                      style={{
                        opacity: 0.6,
                        display: 'block',
                        marginBottom: 4,
                        fontSize: 10,
                      }}
                    >
                      {p.blocker ? 'BLOCKER' : 'NEXT'}
                    </SysLabel>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.blocker || p.nextPreview || '—'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
