/** Browser overrides for GitHub env (localStorage). PAT is sensitive — trusted deployments only. */

export const GITHUB_CONFIG_CHANGED_EVENT = 'overwatch-github-config'

const LS_PAT = 'ow_github_pat'
const LS_OWNER = 'ow_github_owner'
const LS_REPO = 'ow_github_repo'
const LS_BRANCH = 'ow_github_branch'

export interface StoredGithubSlice {
  pat?: string
  owner?: string
  repo?: string
  branch?: string
}

export function readStoredGithub(): StoredGithubSlice {
  try {
    const pat = localStorage.getItem(LS_PAT) ?? undefined
    const owner = localStorage.getItem(LS_OWNER) ?? undefined
    const repo = localStorage.getItem(LS_REPO) ?? undefined
    const branch = localStorage.getItem(LS_BRANCH) ?? undefined
    return {
      pat: pat !== undefined && pat !== '' ? pat : undefined,
      owner: owner !== undefined && owner !== '' ? owner : undefined,
      repo: repo !== undefined && repo !== '' ? repo : undefined,
      branch: branch !== undefined && branch !== '' ? branch : undefined,
    }
  } catch {
    return {}
  }
}

export function writeStoredGithub(slice: StoredGithubSlice): void {
  const set = (key: string, v: string | undefined) => {
    if (v === undefined || v === '') localStorage.removeItem(key)
    else localStorage.setItem(key, v)
  }
  set(LS_PAT, slice.pat)
  set(LS_OWNER, slice.owner)
  set(LS_REPO, slice.repo)
  set(LS_BRANCH, slice.branch)
}

export function clearStoredGithub(): void {
  try {
    localStorage.removeItem(LS_PAT)
    localStorage.removeItem(LS_OWNER)
    localStorage.removeItem(LS_REPO)
    localStorage.removeItem(LS_BRANCH)
  } catch {
    /* ignore */
  }
}

export interface EffectiveGithubEnv {
  token: string
  owner: string
  repo: string
  branch: string
}

/** Merge: runtime overrides win over Vite build env */
export function getEffectiveGithubEnv(): EffectiveGithubEnv {
  const st = readStoredGithub()
  const token =
    (st.pat && st.pat.length > 0 ? st.pat : undefined) ??
    String(import.meta.env.VITE_GITHUB_PAT ?? '')
  const owner =
    (st.owner && st.owner.length > 0 ? st.owner : undefined) ??
    String(import.meta.env.VITE_GITHUB_OWNER ?? '')
  const repo =
    (st.repo && st.repo.length > 0 ? st.repo : undefined) ??
    String(import.meta.env.VITE_GITHUB_REPO ?? '')
  const envBr = import.meta.env.VITE_GITHUB_BRANCH
  const branch =
    (st.branch?.trim() || undefined) ??
    (envBr != null && String(envBr).trim() !== ''
      ? String(envBr).trim()
      : undefined) ??
    'main'
  return {
    token,
    owner,
    repo,
    branch: branch || 'main',
  }
}

export function githubEnvReady(e: EffectiveGithubEnv): boolean {
  return (
    e.token.trim().length > 0 &&
    e.owner.trim().length > 0 &&
    e.repo.trim().length > 0
  )
}

export function notifyGithubConfigChanged(): void {
  window.dispatchEvent(new Event(GITHUB_CONFIG_CHANGED_EVENT))
}
