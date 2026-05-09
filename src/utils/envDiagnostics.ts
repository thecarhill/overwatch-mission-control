import {
  getEffectiveGithubEnv,
  githubEnvReady,
  readStoredGithub,
} from '../services/runtimeGithubConfig'

export interface EnvDiagnosticRow {
  key: string
  present: boolean
  hint?: string
  /** When set, value comes from browser storage override */
  overridden?: boolean
}

function sourceForKey(
  key: 'pat' | 'owner' | 'repo' | 'branch',
  st: ReturnType<typeof readStoredGithub>,
): boolean {
  if (key === 'pat') return Boolean(st.pat && st.pat.length > 0)
  if (key === 'owner') return Boolean(st.owner && st.owner.length > 0)
  if (key === 'repo') return Boolean(st.repo && st.repo.length > 0)
  return Boolean(st.branch && st.branch.length > 0)
}

/** Effective config (build + optional browser overrides) */
export function getEnvDiagnostics(): EnvDiagnosticRow[] {
  const eff = getEffectiveGithubEnv()
  const st = readStoredGithub()
  return [
    {
      key: 'VITE_GITHUB_PAT',
      present: eff.token.trim().length > 0,
      hint: 'Fine-grained or classic PAT with repo scope',
      overridden: sourceForKey('pat', st),
    },
    {
      key: 'VITE_GITHUB_OWNER',
      present: eff.owner.trim().length > 0,
      hint: 'Org or username',
      overridden: sourceForKey('owner', st),
    },
    {
      key: 'VITE_GITHUB_REPO',
      present: eff.repo.trim().length > 0,
      hint: 'Repository name (e.g. OVERWATCH)',
      overridden: sourceForKey('repo', st),
    },
    {
      key: 'VITE_GITHUB_BRANCH',
      present: true,
      hint: 'Optional; defaults to main in client',
      overridden: sourceForKey('branch', st),
    },
  ]
}

export function envAllPresent(): boolean {
  return githubEnvReady(getEffectiveGithubEnv())
}
