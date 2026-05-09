import type { ParsedState, Priority, ProjectStatus, SessionEntry } from '../types'

const STATUSES: ProjectStatus[] = ['WIP', 'PARKED', 'BACKLOG', 'DONE', 'KILLED']
const PRIORITIES: Priority[] = [
  '01_CRITICAL',
  '02_HIGH',
  '03_STANDARD',
  '04_BACKLOG',
]

function normalizeStatus(raw: string): ProjectStatus {
  const u = raw.trim().toUpperCase()
  return STATUSES.includes(u as ProjectStatus) ? (u as ProjectStatus) : 'BACKLOG'
}

function normalizePriority(raw: string): Priority {
  const u = raw.trim().toUpperCase().replace(/\s/g, '_')
  const match = PRIORITIES.find((p) => p === u || p.replace(/_/g, '') === u.replace(/_/g, ''))
  return match ?? '03_STANDARD'
}

/** Split markdown body by ## section headers; returns map lower-case title -> content */
function splitSections(md: string): Map<string, string> {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const sections = new Map<string, string>()
  let current: string | null = null
  let buf: string[] = []

  const flush = () => {
    if (current) sections.set(current.toLowerCase(), buf.join('\n').trim())
    buf = []
  }

  for (const line of lines) {
    const hm = line.match(/^##\s+(.+)\s*$/)
    if (hm) {
      flush()
      current = hm[1].trim()
    } else if (current) buf.push(line)
  }
  flush()
  return sections
}

function parseBulletList(block: string): string[] {
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*]\s+/, ''))
    .filter(Boolean)
}

function parseSessionLog(block: string): SessionEntry[] {
  const out: SessionEntry[] = []
  for (const line of block.split('\n')) {
    const m = line.match(/^[-*]\s*(\d{4}-\d{2}-\d{2})\s*:\s*(.+)$/)
    if (m) out.push({ date: m[1], note: m[2].trim() })
  }
  return out
}

export function parseStateMd(md: string, slugFallback: string): ParsedState {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const h1 = lines.find((l) => l.startsWith('# '))
  const title = h1 ? h1.slice(2).trim() : slugFallback

  const sec = splitSections(md)

  const status = normalizeStatus(sec.get('status') ?? 'BACKLOG')
  const priority = normalizePriority(sec.get('priority') ?? '03_STANDARD')
  const currentTask = (sec.get('current task') ?? '').trim()
  const nextAction = (sec.get('next action') ?? '').trim()
  const blockerRaw = (sec.get('blocker') ?? '').trim()
  const blocker = blockerRaw.toLowerCase() === 'none' ? '' : blockerRaw

  const parkingLot = parseBulletList(sec.get('parking lot') ?? '')
  const sessionLog = parseSessionLog(sec.get('session log') ?? '')

  return {
    projectName: title,
    status,
    priority,
    currentTask,
    nextAction,
    blocker,
    parkingLot,
    sessionLog,
  }
}

export function serializeStateMd(state: ParsedState): string {
  const b =
    state.blocker.trim() === '' ? 'None' : state.blocker.trim()
  const parking =
    state.parkingLot.length === 0
      ? ''
      : state.parkingLot.map((p) => `- ${p}`).join('\n')

  const sessions =
    state.sessionLog.length === 0
      ? ''
      : state.sessionLog.map((s) => `- ${s.date}: ${s.note}`).join('\n')

  return `# ${state.projectName}

## Status
${state.status}

## Priority
${state.priority}

## Current Task
${state.currentTask}

## Next Action
${state.nextAction}

## Blocker
${b}

## Parking Lot
${parking}

## Session Log
${sessions}
`.trimEnd() + '\n'
}

export function appendSessionNote(state: ParsedState, note: string): ParsedState {
  const d = new Date().toISOString().slice(0, 10)
  return {
    ...state,
    sessionLog: [...state.sessionLog, { date: d, note }],
  }
}
