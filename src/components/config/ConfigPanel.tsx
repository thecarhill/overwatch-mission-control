import { useState } from 'react'
import { Btn } from '../primitives/Btn'
import { Rule } from '../primitives/Rule'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'
import { useThemeConfig } from '../../context/ThemeContext'
import { useAppSettings } from '../../context/AppSettingsContext'

export function ConfigPanel() {
  const { mode, setMode, accent, setAccent, accentPresets } = useThemeConfig()
  const {
    projectsView,
    setProjectsView,
    tasksView,
    setTasksView,
    relativeDeadlines,
    setRelativeDeadlines,
    confirmTaskDelete,
    setConfirmTaskDelete,
    resetToDefaults,
  } = useAppSettings()
  const [hexInput, setHexInput] = useState(accent)

  return (
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
          CONFIG
        </h1>
        <SysLabel style={{ color: T.muted, display: 'block', marginTop: 10 }}>
          APPEARANCE // DATASTORE // UI DEFAULTS
        </SysLabel>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 32, maxWidth: 720 }}>
        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 16,
            marginBottom: 28,
          }}
        >
          <SysLabel style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 8 }}>
            OPERATIONAL DATA
          </SysLabel>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: T.paper }}>
            Leads, proyectos, inbox y el resto viven en{' '}
            <strong>SQLite</strong> en el servidor (por defecto volumen Docker{' '}
            <span style={{ fontFamily: T.mono, fontSize: 12 }}>/data/overwatch.db</span>). No hay
            escritura a ningún repositorio GitHub; Overwatch es la fuente de verdad mientras el
            volumen persista.
          </p>
        </div>

        <SysLabel style={{ display: 'block', marginBottom: 12 }}>
          APPEARANCE
        </SysLabel>
        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 20,
            marginBottom: 28,
          }}
        >
          <SysLabel
            style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 12 }}
          >
            COLOR MODE
          </SysLabel>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn inverted={mode === 'light'} onClick={() => setMode('light')}>
              LIGHT
            </Btn>
            <Btn inverted={mode === 'dark'} onClick={() => setMode('dark')}>
              DARK
            </Btn>
          </div>

          <Rule style={{ margin: '20px 0' }} />

          <SysLabel
            style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 12 }}
          >
            ACCENT (ACTIVE NAV / BUTTONS)
          </SysLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {accentPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.label}
                onClick={() => {
                  setAccent(p.hex)
                  setHexInput(p.hex)
                }}
                style={{
                  width: 40,
                  height: 40,
                  padding: 0,
                  border:
                    accent.toLowerCase() === p.hex.toLowerCase()
                      ? `3px solid ${T.paper}`
                      : `1px solid ${T.borderDim}`,
                  background: p.hex,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>
          <SysLabel
            style={{
              fontSize: 10,
              color: T.muted,
              display: 'block',
              marginTop: 12,
            }}
          >
            CUSTOM HEX
          </SysLabel>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={() => {
              const v = hexInput.trim()
              if (/^#[0-9a-f]{6}$/i.test(v)) {
                setAccent(v.toLowerCase())
              } else {
                setHexInput(accent)
              }
            }}
            placeholder="#000000"
            style={{
              marginTop: 8,
              fontFamily: T.mono,
              fontSize: 13,
              padding: '10px 12px',
              border: `1px solid ${T.border}`,
              width: '100%',
              maxWidth: 280,
              background: 'transparent',
              color: T.paper,
            }}
          />
        </div>

        <SysLabel style={{ display: 'block', marginBottom: 12 }}>
          PROJECTS & TASKS (DEFAULT VIEWS)
        </SysLabel>
        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 20,
            marginBottom: 28,
          }}
        >
          <SysLabel
            style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 10 }}
          >
            OPEN PROJECTS TAB AS
          </SysLabel>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <Btn inverted={projectsView === 'table'} onClick={() => setProjectsView('table')}>
              TABLE
            </Btn>
            <Btn inverted={projectsView === 'kanban'} onClick={() => setProjectsView('kanban')}>
              KANBAN
            </Btn>
          </div>

          <SysLabel
            style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 10 }}
          >
            OPEN TASK PANEL AS (PER PROJECT)
          </SysLabel>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <Btn inverted={tasksView === 'table'} onClick={() => setTasksView('table')}>
              TABLE
            </Btn>
            <Btn inverted={tasksView === 'kanban'} onClick={() => setTasksView('kanban')}>
              KANBAN
            </Btn>
          </div>

          <SysLabel
            style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 10 }}
          >
            TASK DEADLINES
          </SysLabel>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Btn inverted={relativeDeadlines} onClick={() => setRelativeDeadlines(true)}>
              RELATIVE (today / in 3d)
            </Btn>
            <Btn inverted={!relativeDeadlines} onClick={() => setRelativeDeadlines(false)}>
              DATE ONLY (YYYY-MM-DD)
            </Btn>
          </div>

          <SysLabel
            style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 10 }}
          >
            SAFETY
          </SysLabel>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Btn inverted={confirmTaskDelete} onClick={() => setConfirmTaskDelete(true)}>
              CONFIRM TASK DELETE
            </Btn>
            <Btn inverted={!confirmTaskDelete} onClick={() => setConfirmTaskDelete(false)}>
              DELETE WITHOUT CONFIRM
            </Btn>
          </div>

          <Btn onClick={() => resetToDefaults()}>RESET UI SETTINGS TO DEFAULTS</Btn>
        </div>
      </div>
    </div>
  )
}
