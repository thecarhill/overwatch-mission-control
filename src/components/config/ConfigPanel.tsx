import { useState } from 'react'
import {
  clearStoredGithub,
  getEffectiveGithubEnv,
  notifyGithubConfigChanged,
  readStoredGithub,
  writeStoredGithub,
} from '../../services/runtimeGithubConfig'
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

  const [owner, setOwner] = useState(() => getEffectiveGithubEnv().owner)
  const [repo, setRepo] = useState(() => getEffectiveGithubEnv().repo)
  const [branch, setBranch] = useState(() => getEffectiveGithubEnv().branch)
  const [pat, setPat] = useState('')

  const [patStatus, setPatStatus] = useState<
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'ok'; login: string }
    | { state: 'err'; msg: string }
  >({ state: 'idle' })

  const [applyMsg, setApplyMsg] = useState<string | null>(null)

  const envRows = getEnvDiagnostics()
  const envOk = envAllPresent()
  const stStored = readStoredGithub()
  const hasBrowserOverrides = Boolean(
    stStored.pat || stStored.owner || stStored.repo || stStored.branch,
  )

  const runPatCheck = async () => {
    setPatStatus({ state: 'loading' })
    try {
      const res = await fetch('/api/github/verify')
      const j = (await res.json()) as {
        ok?: boolean
        login?: string
        error?: string
      }
      if (j.ok && j.login) setPatStatus({ state: 'ok', login: j.login })
      else setPatStatus({ state: 'err', msg: j.error ?? 'Verify failed' })
    } catch (e) {
      setPatStatus({
        state: 'err',
        msg: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const handleApply = () => {
    const o = owner.trim()
    const r = repo.trim()
    if (!o || !r) {
      setApplyMsg('Owner and repo are required.')
      return
    }
    writeStoredGithub({
      owner: o,
      repo: r,
      branch: branch.trim() || undefined,
      pat: pat.trim() || undefined,
    })
    setApplyMsg('Saved in this browser. Syncing…')
    setPat('')
    notifyGithubConfigChanged()
    window.setTimeout(() => setApplyMsg(null), 4000)
  }

  const handleClearOverrides = () => {
    clearStoredGithub()
    const build = getEffectiveGithubEnv()
    setOwner(build.owner)
    setRepo(build.repo)
    setBranch(build.branch)
    setPat('')
    setApplyMsg('Browser overrides cleared. Syncing…')
    notifyGithubConfigChanged()
    window.setTimeout(() => setApplyMsg(null), 4000)
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
          APPEARANCE // GITHUB (BUILD + BROWSER)
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
          GITHUB — BUILD DEFAULT + BROWSER OVERRIDES
        </SysLabel>
        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 0,
            marginBottom: 16,
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
              DOCKER: DATOS EN SQLITE EN /DATA — GITHUB VA CON PULL/PUSH EN CABECERA. ABAJO:
              OVERRIDES OPCIONALES DEL NAVEGADOR ( LOCALSTORAGE )
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
                  {row.overridden ? (
                    <span style={{ color: T.muted, fontWeight: 400 }}> · browser</span>
                  ) : null}
                </div>
                {row.hint && (
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                    {row.hint}
                  </div>
                )}
              </div>
              <EnvFlag ok={row.present} overridden={row.overridden} />
            </div>
          ))}
          <div style={{ padding: '12px 16px', fontFamily: T.mono, fontSize: 11 }}>
            SUMMARY:{' '}
            <strong>{envOk ? 'REQUIRED VARS SET' : 'MISSING REQUIRED VARS'}</strong>
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 16,
            marginBottom: 24,
            display: 'grid',
            gap: 12,
          }}
        >
          <Field
            label="VITE_GITHUB_OWNER"
            value={owner}
            onChange={setOwner}
            mono
          />
          <Field
            label="VITE_GITHUB_REPO"
            value={repo}
            onChange={setRepo}
            mono
            hint="Slug only (overwatch). Full URLs are auto-normalized."
          />
          <Field
            label="VITE_GITHUB_BRANCH"
            value={branch}
            onChange={setBranch}
            mono
            hint="Empty uses main when not set in build"
          />
          <div>
            <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 6 }}>
              VITE_GITHUB_PAT (optional override)
            </SysLabel>
            <input
              type="password"
              autoComplete="off"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="Leave blank to keep build token or previous override"
              style={{
                fontFamily: T.mono,
                fontSize: 12,
                padding: '10px 12px',
                border: `1px solid ${T.border}`,
                width: '100%',
                background: 'transparent',
                color: T.paper,
              }}
            />
            <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>
              Saving with an empty PAT removes a browser PAT override (falls back to the image
              build).
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <Btn inverted onClick={handleApply}>
              APPLY & RELOAD SYNC
            </Btn>
            <Btn onClick={handleClearOverrides} disabled={!hasBrowserOverrides}>
              CLEAR BROWSER OVERRIDES
            </Btn>
          </div>
          {applyMsg && (
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.paper }}>{applyMsg}</div>
          )}
        </div>

        <SysLabel style={{ display: 'block', marginBottom: 12 }}>
          GITHUB PAT — VERIFY
        </SysLabel>
        <div
          style={{
            border: `1px solid ${T.border}`,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: T.muted }}>
            Usa el PAT del servidor (<span style={{ fontFamily: T.mono, fontSize: 12 }}>GITHUB_TOKEN</span>{' '}
            en Docker). No expone el token.
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

function Field({
  label,
  value,
  onChange,
  mono,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  mono?: boolean
  hint?: string
}) {
  return (
    <div>
      <SysLabel style={{ color: T.muted, display: 'block', marginBottom: 6 }}>
        {label}
      </SysLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: mono ? T.mono : T.sans,
          fontSize: 13,
          padding: '10px 12px',
          border: `1px solid ${T.border}`,
          width: '100%',
          background: 'transparent',
          color: T.paper,
        }}
      />
      {hint && (
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>{hint}</div>
      )}
    </div>
  )
}

function EnvFlag({
  ok,
  overridden,
}: {
  ok: boolean
  overridden?: boolean
}) {
  let label = 'MISSING'
  if (ok) label = overridden ? 'OVERRIDE' : 'SET'
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
      {label}
    </span>
  )
}
