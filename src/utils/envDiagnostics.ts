export interface EnvDiagnosticRow {
  key: string
  present: boolean
  hint?: string
}

/** Build-time `import.meta.env` — values only exist if set when Vite built the app */
export function getEnvDiagnostics(): EnvDiagnosticRow[] {
  const env = import.meta.env
  return [
    {
      key: 'VITE_GITHUB_PAT',
      present: Boolean(env.VITE_GITHUB_PAT && String(env.VITE_GITHUB_PAT).length > 0),
      hint: 'Fine-grained or classic PAT with repo scope',
    },
    {
      key: 'VITE_GITHUB_OWNER',
      present: Boolean(env.VITE_GITHUB_OWNER && String(env.VITE_GITHUB_OWNER).length > 0),
      hint: 'Org or username',
    },
    {
      key: 'VITE_GITHUB_REPO',
      present: Boolean(env.VITE_GITHUB_REPO && String(env.VITE_GITHUB_REPO).length > 0),
      hint: 'Repository name (e.g. OVERWATCH)',
    },
    {
      key: 'VITE_GITHUB_BRANCH',
      present: Boolean(env.VITE_GITHUB_BRANCH && String(env.VITE_GITHUB_BRANCH).length > 0),
      hint: 'Optional; defaults to main in client',
    },
  ]
}

export function envAllPresent(): boolean {
  const required = ['VITE_GITHUB_PAT', 'VITE_GITHUB_OWNER', 'VITE_GITHUB_REPO'] as const
  const rows = getEnvDiagnostics()
  return required.every((k) => rows.find((r) => r.key === k)?.present === true)
}
