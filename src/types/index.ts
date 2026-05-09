export type ProjectStatus = 'WIP' | 'PARKED' | 'BACKLOG'

export type Priority =
  | '01_CRITICAL'
  | '02_HIGH'
  | '03_STANDARD'
  | '04_BACKLOG'

export type Stage =
  | 'SENT'
  | 'OPENED'
  | 'RESPONDED'
  | 'QUALIFIED'
  | 'CLOSED'
  | 'DEAD'

export interface SessionEntry {
  date: string
  note: string
}

export interface ParsedState {
  projectName: string
  status: ProjectStatus
  priority: Priority
  currentTask: string
  nextAction: string
  blocker: string
  parkingLot: string[]
  sessionLog: SessionEntry[]
}

export interface LeadActivity {
  ts: string
  type: 'stage_change' | 'created' | 'note' | 'updated'
  detail: string
}

export interface Lead {
  id: string
  name: string
  city: string
  url: string
  sent: string
  stage: Stage
  lastContact: string
  notes: string
  activity: LeadActivity[]
}

export interface LeadsFile {
  leads: Lead[]
}

export interface InboxEntry {
  ts: string
  text: string
}

export interface ProjectCard {
  slug: string
  displayId: string
  name: string
  status: ProjectStatus
  priority: Priority
  updated: string
  taskPreview: string
  nextPreview: string
  blocker: string | null
}

export type TabId =
  | 'briefing'
  | 'projects'
  | 'leads'
  | 'pipeline'
  | 'inbox'
  | 'config'

export interface ActivityLogEntry {
  ts: string
  category: 'WIP' | 'LEAD' | 'INBOX' | 'SYNC' | 'SYSTEM' | 'PROJECT'
  message: string
}

export interface ProjectRegistryRow {
  slug: string
  nameHint?: string
}
