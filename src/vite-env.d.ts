/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional API origin; default "" = same origin (Docker Node serves `/api`). */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
