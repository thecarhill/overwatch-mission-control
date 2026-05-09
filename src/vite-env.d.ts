/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional API origin; default "" = same origin (Docker Node serves `/api`). */
  readonly VITE_API_BASE?: string
  readonly VITE_GITHUB_PAT?: string
  readonly VITE_GITHUB_OWNER?: string
  readonly VITE_GITHUB_REPO?: string
  readonly VITE_GITHUB_BRANCH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
