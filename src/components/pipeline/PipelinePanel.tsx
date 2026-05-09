import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { Lead, Stage } from '../../types'
import { STAGES } from '../../utils/constants'
import { useApp } from '../../context/useApp'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'

export function PipelinePanel() {
  const { leads, leadsLoading, setLeadStage, openLeadDetail } = useApp()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const stageColumns = STAGES.map((s) => ({
    name: s,
    items: leads.filter((l) => l.stage === s),
  }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string
    const overId = String(over.id)
    const targetStage: Stage | null = overId.startsWith('col-')
      ? (overId.slice(4) as Stage)
      : leads.find((l) => l.id === overId)?.stage ?? null
    if (!targetStage || !STAGES.includes(targetStage)) return
    const cur = leads.find((l) => l.id === activeId)
    if (!cur || cur.stage === targetStage) return
    setLeadStage(activeId, targetStage)
  }

  if (leadsLoading && leads.length === 0) {
    return (
      <div style={{ padding: 32, fontFamily: T.mono, fontSize: 11 }}>
        <span className="animate-pulse-ow">LOADING...</span>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
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
            PIPELINE
          </h1>
          <SysLabel style={{ color: T.muted, display: 'block', marginTop: 10 }}>
            TOTAL ACTIVE: {leads.filter((l) => l.stage !== 'DEAD').length} LEADS //
            FUNNEL VIEW
          </SysLabel>
        </div>
        <div
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            padding: 32,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${STAGES.length}, minmax(160px, 1fr))`,
              gap: 12,
              minWidth: 800,
            }}
          >
            {stageColumns.map((st) => (
              <PipelineColumn
                key={st.name}
                stage={st.name}
                items={st.items}
                onCardClick={(id) => openLeadDetail(id)}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  )
}

function PipelineColumn({
  stage,
  items,
  onCardClick,
}: {
  stage: Stage
  items: Lead[]
  onCardClick: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stage}` })
  return (
    <div style={{ border: `1px solid ${T.border}` }}>
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${T.border}`,
          background: T.paper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <SysLabel style={{ color: T.void, fontSize: 10 }}>{stage}</SysLabel>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            fontWeight: 700,
            background: T.void,
            color: T.paper,
            padding: '0 4px',
          }}
        >
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          padding: 10,
          minHeight: 120,
          outline: isOver ? `1px dashed ${T.paper}` : undefined,
          outlineOffset: -2,
        }}
      >
        {items.map((item) => (
          <DraggableLeadCard key={item.id} lead={item} onOpen={() => onCardClick(item.id)} />
        ))}
        {items.length === 0 && (
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.borderDim,
              textAlign: 'center',
              padding: '24px 0',
              textTransform: 'uppercase',
            }}
          >
            EMPTY
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableLeadCard({
  lead,
  onOpen,
}: {
  lead: Lead
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id })
  const [h, setH] = useState(false)

  const transformCss = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      style={{
        border: `1px solid ${h ? T.border : T.borderDim}`,
        padding: '10px 12px',
        marginBottom: 8,
        cursor: 'grab',
        opacity: isDragging ? 0.35 : lead.stage === 'DEAD' ? 0.35 : 1,
        background: h ? T.hoverBg : 'transparent',
        transition: 'all 0.1s',
        transform: transformCss,
      }}
    >
      <div
        style={{
          fontFamily: T.sans,
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}
      >
        {lead.name}
      </div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          color: T.muted,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {lead.url}
      </div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          color: T.muted,
          marginTop: 4,
        }}
      >
        {lead.sent}
      </div>
    </div>
  )
}
