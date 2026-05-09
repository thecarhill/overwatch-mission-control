import { useState } from 'react'
import { verifyGitHubPat } from '../../services/github'
import { Btn } from '../primitives/Btn'
import { Rule } from '../primitives/Rule'
import { SysLabel } from '../primitives/SysLabel'
import { T } from '../../theme/tokens'
import { useThemeConfig } from '../../context/ThemeContext'
import {
  envAllPresent,
  getEnvDiagnostics,
} from '../../utils/envDiagnostics'

export function ConfigPanel() {
  const { mode, setMode, accent, setAccent, accentPresets } = useThemeConfig()
  const [hexInput, setHexInput] = useState(accent)

  const [patStatus, setPatStatus] = useState<
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'ok'; login: string }
    | { state: 'err'; msg: string }
  >({ state: 'idle' })

  const envRows = getEnvDiagnostics()
  const envOk = envAllPresent()

  const runPatCheck = async () => {
    setPatStatus({ state: 'loading' })
    const r = await verifyGitHubPat()
    if (r.ok && r.login) {
      setPatStatus({ state: 'ok', login: r.login })
    } else {
      setPatStatus({ state: 'err', msg: r.error ?? 'Unknown error' })
    }
  }

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
          APPEARANCE // INTEGRITY CHECKS
        </SysLabel>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 32, maxWidth: 720 }}>
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
            <Btn
              inverted={mode === 'light'}
              onClick={() => setMode('light')}
            >
              LIGHT
            </Btn>
            <Btn
              inverted={mode === 'dark'}
              onClick={() => setMode('dark')}
            >
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
          BUILD / .ENV (VITE)
        </SysLabel>
        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 0,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${T.border}`,
              background: T.accent,
              color: T.onAccent,
            }}
          >
            <SysLabel style={{ color: 'inherit', fontSize: 10 }}>
              VARIABLES BAKED AT BUILD TIME — RESTART DEV SERVER AFTER EDITING .ENV
            </SysLabel>
          </div>
          {envRows.map((row) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                padding: '12px 16px',
                borderBottom: `1px solid ${T.borderDim}`,
                alignItems: 'start',
              }}
            >
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>
                  {row.key}
                </div>
                {row.hint && (
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                    {row.hint}
                  </div>
                )}
              </div>
              <EnvFlag ok={row.present} />
            </div>
          ))}
          <div style={{ padding: '12px 16px', fontFamily: T.mono, fontSize: 11 }}>
            SUMMARY:{' '}
            <strong>{envOk ? 'REQUIRED VARS SET' : 'MISSING REQUIRED VARS'}</strong>
          </div>
        </div>

        <SysLabel style={{ display: 'block', marginBottom: 12 }}>
          GITHUB PAT
        </SysLabel>
        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: T.muted }}>
            Calls{' '}
            <span style={{ fontFamily: T.mono, fontSize: 12 }}>GET /user</span> with{' '}
            <span style={{ fontFamily: T.mono, fontSize: 12 }}>VITE_GITHUB_PAT</span>.
            Token value is never shown.
          </p>
          <Btn inverted onClick={() => void runPatCheck()} disabled={patStatus.state === 'loading'}>
            {patStatus.state === 'loading' ? 'CHECKING...' : 'VERIFY PAT'}
          </Btn>
          <div style={{ marginTop: 16, fontFamily: T.mono, fontSize: 12 }}>
            {patStatus.state === 'idle' && (
              <span style={{ color: T.muted }}>No check run yet.</span>
            )}
            {patStatus.state === 'ok' && (
              <span style={{ color: T.paper }}>
                OK — authenticated as <strong>{patStatus.login}</strong>
              </span>
            )}
            {patStatus.state === 'err' && (
              <span style={{ color: T.paper }}>FAILED — {patStatus.msg}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EnvFlag({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        border: `1px solid ${T.border}`,
        background: ok ? T.accent : 'transparent',
        color: ok ? T.onAccent : T.muted,
      }}
    >
      {ok ? 'SET' : 'MISSING'}
    </span>
  )
}
