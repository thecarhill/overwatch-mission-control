import type { Stage, TabId } from '../types'

export const STAGES: Stage[] = [
  'SENT',
  'OPENED',
  'RESPONDED',
  'QUALIFIED',
  'CLOSED',
  'DEAD',
]

export const TAB_ORDER: TabId[] = [
  'briefing',
  'projects',
  'leads',
  'pipeline',
  'inbox',
  'config',
]

export const PATH_MAP: Record<TabId, string> = {
  briefing: '/MNT/OPS/BRIEFING',
  projects: '/MNT/OPS/PROJECTS',
  leads: '/MNT/OPS/LEADS_CRM',
  pipeline: '/MNT/OPS/PIPELINE',
  inbox: '/MNT/OPS/INBOX',
  config: '/MNT/OPS/CONFIG',
}

export const REPO_PATHS = {
  leadsJson: 'leads.json',
  inboxMd: 'inbox.md',
  projectsMd: 'projects.md',
  projectsDir: 'projects',
} as const
