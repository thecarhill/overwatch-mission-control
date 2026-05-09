/** Mirrors app `ParsedState` / `serializeStateMd` for server-side seeds only. */

export type ProjectStatus =
  | 'WIP'
  | 'PARKED'
  | 'BACKLOG'
  | 'DONE'
  | 'KILLED'
export type Priority =
  | '01_CRITICAL'
  | '02_HIGH'
  | '03_STANDARD'
  | '04_BACKLOG'

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

  return (
    `# ${state.projectName}

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
  )
}
