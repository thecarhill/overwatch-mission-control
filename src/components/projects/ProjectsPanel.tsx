import {
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import { useApp } from '../../context/useApp'
import { Btn } from '../primitives/Btn'
import { SysLabel } from '../primitives/SysLabel'
import { Tag } from '../primitives/Tag'
import { T } from '../../theme/tokens'
import { slugifyProject } from '../../utils/projectSlug'
import { useAppSettings } from '../../context/AppSettingsContext'
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
    createProject,
  } = useApp()

  const { projectsView, setProjectsView } = useAppSettings()

  const [hoverId, setHoverId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [customSlug, setCustomSlug] = useState('')
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

  const derivedSlug = slugifyProject(newName)
  const slugFieldValue = slugEdited ? customSlug : derivedSlug

  const handleCreateProject = async () => {
    await createProject({
      name: newName,
      slug: slugEdited ? customSlug : undefined,
    })
    setNewName('')
    setSlugEdited(false)
    setCustomSlug('')
  }

  const inputStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11,
    padding: '8px 10px',
    border: `1px solid ${T.border}`,
    background: 'transparent',
    color: T.paper,
    width: '100%',
    boxSizing: 'border-box',
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
          projectSlug={detailSlug}
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
          flexWrap: 'wrap',
          gap: 20,
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
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <SysLabel style={{ fontSize: 9, color: T.muted, marginRight: 4 }}>
              VIEW
            </SysLabel>
            <Btn
              inverted={projectsView === 'table'}
              onClick={() => setProjectsView('table')}
            >
              TABLE
            </Btn>
            <Btn
              inverted={projectsView === 'kanban'}
              onClick={() => setProjectsView('kanban')}
            >
              KANBAN
            </Btn>
          </div>
        </div>
        <form
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minWidth: 260,
            maxWidth: 360,
          }}
          onSubmit={(e) => {
            e.preventDefault()
            void handleCreateProject()
          }}
        >
          <SysLabel style={{ fontSize: 9, color: T.muted }}>
            NEW PROJECT
          </SysLabel>
          <input
            style={inputStyle}
            placeholder="Display name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoComplete="off"
          />
          <input
            style={inputStyle}
            placeholder="slug-from-name"
            value={slugFieldValue}
            onChange={(e) => {
              setSlugEdited(true)
              setCustomSlug(e.target.value)
            }}
            autoComplete="off"
          />
          <Btn
            type="submit"
            disabled={syncing || !newName.trim()}
            full
          >
            CREATE PROJECT
          </Btn>
        </form>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        {projectsView === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: T.mono,
                fontSize: 11,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={tableTh}>ID</th>
                  <th style={tableTh}>NAME</th>
                  <th style={tableTh}>STATUS</th>
                  <th style={tableTh}>PRIORITY</th>
                  <th style={tableTh}>UPDATED</th>
                  <th style={tableTh}>NEXT / BLOCKER</th>
                </tr>
              </thead>
              <tbody>
                {projectCards.map((p) => {
                  const killed = p.status === 'KILLED'
                  const done = p.status === 'DONE'
                  return (
                  <tr
                    key={p.slug}
                    onClick={() => void handleOpen(p.slug)}
                    onMouseEnter={() => setHoverId(p.slug)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{
                      borderBottom: `1px solid ${T.borderDim}`,
                      cursor: 'pointer',
                      opacity: killed ? 0.7 : done ? 0.88 : 1,
                      background:
                        p.status === 'WIP'
                          ? T.paper
                          : killed
                            ? 'rgba(160, 60, 60, 0.06)'
                            : done
                              ? 'rgba(40, 120, 70, 0.08)'
                              : hoverId === p.slug
                                ? 'rgba(0,0,0,0.04)'
                                : 'transparent',
                      color: p.status === 'WIP' ? T.void : T.paper,
                    }}
                  >
                    <td style={tableTd}>{p.displayId}</td>
                    <td style={{ ...tableTd, fontWeight: 700 }}>{p.name}</td>
                    <td style={tableTd}>{p.status}</td>
                    <td style={tableTd}>{p.priority}</td>
                    <td style={{ ...tableTd, whiteSpace: 'nowrap' }}>{p.updated}</td>
                    <td style={{ ...tableTd, maxWidth: 280 }}>
                      {p.blocker || p.nextPreview || '—'}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              alignItems: 'flex-start',
              paddingBottom: 8,
            }}
          >
            {(['BACKLOG', 'PARKED', 'WIP', 'DONE', 'KILLED'] as const).map((col) => (
              <div
                key={col}
                style={{
                  flex: '1 1 240px',
                  minWidth: 220,
                  maxWidth: 340,
                  border:
                    col === 'KILLED'
                      ? `1px solid rgba(180, 70, 70, 0.45)`
                      : col === 'DONE'
                        ? `1px solid rgba(50, 140, 90, 0.5)`
                        : `1px solid ${T.border}`,
                  padding: 12,
                  background:
                    col === 'KILLED'
                      ? 'rgba(120, 40, 40, 0.06)'
                      : col === 'DONE'
                        ? 'rgba(30, 90, 55, 0.07)'
                        : 'rgba(0,0,0,0.02)',
                }}
              >
                <SysLabel style={{ display: 'block', marginBottom: 12 }}>
                  {col}
                  {col === 'DONE' ? (
                    <span style={{ fontWeight: 400, color: T.muted }}> — completed</span>
                  ) : null}
                  {col === 'KILLED' ? (
                    <span style={{ fontWeight: 400, color: T.muted }}> — cancelled</span>
                  ) : null}{' '}
                  ({projectCards.filter((x) => x.status === col).length})
                </SysLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {projectCards
                    .filter((p) => p.status === col)
                    .map((p) => {
                      const isWip = p.status === 'WIP'
                      const isKilled = p.status === 'KILLED'
                      const isDone = p.status === 'DONE'
                      const hov = hoverId === p.slug
                      return (
                        <div
                          key={p.slug}
                          onClick={() => void handleOpen(p.slug)}
                          onMouseEnter={() => setHoverId(p.slug)}
                          onMouseLeave={() => setHoverId(null)}
                          style={{
                            border: `1px solid ${
                              isKilled
                                ? 'rgba(180, 70, 70, 0.35)'
                                : isDone
                                  ? 'rgba(50, 140, 90, 0.45)'
                                  : T.border
                            }`,
                            padding: 16,
                            cursor: 'pointer',
                            opacity: isKilled ? 0.82 : isDone ? 0.92 : 1,
                            background: isWip
                              ? T.paper
                              : isKilled
                                ? 'rgba(90, 30, 30, 0.07)'
                                : isDone
                                  ? 'rgba(25, 80, 50, 0.09)'
                                  : hov
                                    ? 'rgba(0,0,0,0.06)'
                                    : T.void,
                            color: isWip ? T.void : T.paper,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 10,
                            }}
                          >
                            <Tag
                              style={
                                isWip
                                  ? {
                                      background: T.void,
                                      color: T.paper,
                                      borderColor: T.void,
                                    }
                                  : {}
                              }
                            >
                              {p.displayId}
                            </Tag>
                            <span style={{ fontSize: 10, opacity: 0.7 }}>
                              {p.priority}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              marginBottom: 8,
                            }}
                          >
                            {p.name}
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.85 }}>
                            UPD {p.updated}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              marginTop: 6,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.blocker || p.nextPreview || '—'}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const tableTh: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 700,
  fontSize: 9,
  color: T.muted,
}

const tableTd: CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'top',
}
