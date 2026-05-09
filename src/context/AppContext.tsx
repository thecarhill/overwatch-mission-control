/* eslint-disable react-refresh/only-export-components -- React context + provider */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  getTextFile,
  putTextFile,
  listDirectory,
  GitHubApiError,
} from '../services/github'
import { parseStateMd, serializeStateMd, appendSessionNote } from '../utils/parseState'
import { appendInboxLine, parseInboxMd } from '../utils/parseInbox'
import { parseProjectsMd } from '../utils/parseProjectsMd'
import { REPO_PATHS } from '../utils/constants'
import { GITHUB_CONFIG_CHANGED_EVENT } from '../services/runtimeGithubConfig'
import type {
  ActivityLogEntry,
  InboxEntry,
  Lead,
  LeadActivity,
  LeadsFile,
  ParsedState,
  ProjectCard,
  Stage,
  TabId,
} from '../types'

/** Typing / drag: debounced. Create/delete/pagehide: immediate flush so refresh never loses data. */
const LEADS_DEBOUNCE_MS = 600
const SYNC_ERROR_MS = 8000

function nowIso(): string {
  return new Date().toISOString()
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function nextLeadId(leads: Lead[]): string {
  let max = 0
  for (const l of leads) {
    const m = l.id.match(/^lead_(\d+)$/)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `lead_${String(max + 1).padStart(3, '0')}`
}

interface StateCacheEntry {
  parsed: ParsedState
  sha: string
}

interface AppContextValue {
  tab: TabId
  setTab: (t: TabId) => void
  syncError: string | null
  clearSyncError: () => void
  retrySync: () => void
  loading: boolean
  syncing: boolean
  leads: Lead[]
  leadsLoading: boolean
  leadsSha: string | undefined
  updateLead: (id: string, patch: Partial<Lead>) => void
  deleteLead: (id: string) => void
  createLead: (payload: {
    name: string
    city: string
    url?: string
    notes?: string
  }) => void
  setLeadStage: (id: string, stage: Stage) => void
  inbox: InboxEntry[]
  inboxLoading: boolean
  logInbox: (text: string) => Promise<void>
  inboxTextAreaRef: React.RefObject<HTMLTextAreaElement | null>
  projectCards: ProjectCard[]
  projectsLoading: boolean
  projectDetailSlug: string | null
  openProjectDetail: (slug: string) => void
  closeProjectDetail: () => void
  leadDetailId: string | null
  openLeadDetail: (id: string) => void
  closeLeadDetail: () => void
  getProjectState: (slug: string) => StateCacheEntry | undefined
  loadProjectState: (slug: string) => Promise<void>
  saveProjectState: (
    slug: string,
    parsed: ParsedState,
    opts?: { sessionNote?: string },
  ) => Promise<void>
  /** Toggle WIP: parks other WIP via modal flow inside caller */
  prepareWipToggle: (
    slug: string,
    draft: ParsedState,
  ) => Promise<
    | { action: 'direct'; newStatus: ParsedState['status'] }
    | { action: 'confirm_swap'; parkSlug: string; activateSlug: string }
  >
  executeWipSwap: (parkSlug: string, activateSlug: string) => Promise<void>
  refreshAll: () => Promise<void>
  activityLog: ActivityLogEntry[]
  pushActivity: (e: Omit<ActivityLogEntry, 'ts'> & { ts?: string }) => void
  wipName: string | null
}

export const AppContext = createContext<AppContextValue | null>(null)

async function resolveProjectSlugs(): Promise<{ slug: string; nameHint?: string }[]> {
  const md = await getTextFile(REPO_PATHS.projectsMd)
  if (md?.content) {
    const rows = parseProjectsMd(md.content)
    if (rows.length) return rows.map((r) => ({ slug: r.slug, nameHint: r.nameHint }))
  }
  const items = await listDirectory(REPO_PATHS.projectsDir)
  return items.filter((i) => i.type === 'dir').map((i) => ({ slug: i.name }))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('briefing')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsSha, setLeadsSha] = useState<string | undefined>()
  const [leadsLoading, setLeadsLoading] = useState(true)

  const [inbox, setInbox] = useState<InboxEntry[]>([])
  const [, setInboxSha] = useState<string | undefined>()
  const [inboxLoading, setInboxLoading] = useState(true)

  const [projectCards, setProjectCards] = useState<ProjectCard[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [stateCache, setStateCache] = useState<Record<string, StateCacheEntry>>({})

  const [projectDetailSlug, setProjectDetailSlug] = useState<string | null>(null)
  const [leadDetailId, setLeadDetailId] = useState<string | null>(null)

  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => [
    {
      ts: new Date().toISOString(),
      category: 'SYSTEM',
      message: 'OVERWATCH daily cycle initialized',
    },
  ])

  const leadsRef = useRef(leads)
  const leadsShaRef = useRef(leadsSha)
  useEffect(() => {
    leadsRef.current = leads
    leadsShaRef.current = leadsSha
  }, [leads, leadsSha])

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inboxTextAreaRef = useRef<HTMLTextAreaElement>(null)

  const pushActivity = useCallback(
    (e: Omit<ActivityLogEntry, 'ts'> & { ts?: string }) => {
      const entry: ActivityLogEntry = {
        ts: e.ts ?? nowIso(),
        category: e.category,
        message: e.message,
      }
      setActivityLog((prev) => [entry, ...prev].slice(0, 80))
    },
    [],
  )

  const showError = useCallback((msg: string) => {
    setSyncError(msg)
    window.setTimeout(() => setSyncError(null), SYNC_ERROR_MS)
  }, [])

  const clearSyncError = useCallback(() => setSyncError(null), [])

  /** Optional snapshot: use when React state is newer than leadsRef (e.g. right after setState). */
  const persistLeadsToGithub = useCallback(
    async (snapshot?: Lead[]) => {
      const data = snapshot ?? leadsRef.current
      leadsRef.current = data
      const body: LeadsFile = { leads: data }
      const json = JSON.stringify(body, null, 2)
      const msg = `overwatch: update leads.json`
      try {
        setSyncing(true)
        await putTextFile(REPO_PATHS.leadsJson, json, msg, leadsShaRef.current)
        const fresh = await getTextFile(REPO_PATHS.leadsJson)
        if (fresh) {
          setLeadsSha(fresh.sha)
          leadsShaRef.current = fresh.sha
        }
        pushActivity({ category: 'SYNC', message: 'leads.json saved' })
      } catch (err) {
        const m =
          err instanceof GitHubApiError ? err.message : String(err)
        showError(m)
      } finally {
        setSyncing(false)
      }
    },
    [pushActivity, showError],
  )

  const schedulePersistLeads = useCallback(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null
      void persistLeadsToGithub()
    }, LEADS_DEBOUNCE_MS)
  }, [persistLeadsToGithub])

  /** Before refresh/close: cancel debounce timer and PUT latest leads.json (avoids losing edits). */
  useEffect(() => {
    const flushOnLeave = () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
      void persistLeadsToGithub()
    }
    window.addEventListener('pagehide', flushOnLeave)
    return () => window.removeEventListener('pagehide', flushOnLeave)
  }, [persistLeadsToGithub])

  const loadLeads = useCallback(async () => {
    const f = await getTextFile(REPO_PATHS.leadsJson)
    if (!f) {
      setLeads([])
      setLeadsSha(undefined)
      return
    }
    try {
      const data = JSON.parse(f.content) as LeadsFile
      setLeads(data.leads ?? [])
      setLeadsSha(f.sha)
    } catch {
      setLeads([])
      setLeadsSha(f.sha)
      showError('Invalid leads.json')
    }
  }, [showError])

  const loadInbox = useCallback(async () => {
    const f = await getTextFile(REPO_PATHS.inboxMd)
    if (!f) {
      setInbox([])
      setInboxSha(undefined)
      return
    }
    const entries = parseInboxMd(f.content)
    setInbox([...entries].reverse())
    setInboxSha(f.sha)
  }, [])

  const loadProjects = useCallback(async () => {
    const slugs = await resolveProjectSlugs()
    const cards: ProjectCard[] = []
    const cache: Record<string, StateCacheEntry> = {}
    const missingState: string[] = []

    await Promise.all(
      slugs.map(async ({ slug, nameHint }, idx) => {
        const path = `${REPO_PATHS.projectsDir}/${slug}/state.md`
        const f = await getTextFile(path)
        if (!f) {
          missingState.push(slug)
          return
        }
        const parsed = parseStateMd(f.content, slug)
        cache[slug] = { parsed, sha: f.sha }
        const sessions = parsed.sessionLog
        const updated =
          sessions.length > 0 ? sessions[sessions.length - 1].date : '—'
        const taskPreview =
          parsed.currentTask.slice(0, 120) +
          (parsed.currentTask.length > 120 ? '…' : '')
        const nextPreview =
          parsed.nextAction.slice(0, 80) +
          (parsed.nextAction.length > 80 ? '…' : '')
        cards.push({
          slug,
          displayId: `PRJ-${String(idx + 1).padStart(3, '0')}`,
          name: parsed.projectName || nameHint || slug.toUpperCase(),
          status: parsed.status,
          priority: parsed.priority,
          updated,
          taskPreview,
          nextPreview,
          blocker: parsed.blocker.trim() ? parsed.blocker : null,
        })
      }),
    )

    cards.sort((a, b) => a.displayId.localeCompare(b.displayId))
    setStateCache((prev) => ({ ...prev, ...cache }))
    setProjectCards(cards)

    if (cards.length === 0 && missingState.length > 0) {
      showError(
        `No project cards: missing ${REPO_PATHS.projectsDir}/{${missingState.slice(0, 5).join(', ')}}${missingState.length > 5 ? ', …' : ''}/state.md`,
      )
    } else if (missingState.length > 0) {
      pushActivity({
        category: 'SYNC',
        message: `Skipped ${missingState.length} slug(s) without state.md: ${missingState.slice(0, 6).join(', ')}${missingState.length > 6 ? '…' : ''}`,
      })
    }
  }, [pushActivity, showError])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setLeadsLoading(true)
    setInboxLoading(true)
    setProjectsLoading(true)
    try {
      await Promise.all([loadLeads(), loadInbox(), loadProjects()])
      pushActivity({ category: 'SYNC', message: 'GitHub pull completed' })
    } catch (err) {
      const m =
        err instanceof GitHubApiError ? err.message : String(err)
      showError(m)
    } finally {
      setLoading(false)
      setLeadsLoading(false)
      setInboxLoading(false)
      setProjectsLoading(false)
    }
  }, [loadLeads, loadInbox, loadProjects, pushActivity, showError])

  /* eslint-disable react-hooks/set-state-in-effect -- one-shot GitHub bootstrap */
  useEffect(() => {
    void refreshAll()
  }, [refreshAll])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const onCfg = () => void refreshAll()
    window.addEventListener(GITHUB_CONFIG_CHANGED_EVENT, onCfg)
    return () => window.removeEventListener(GITHUB_CONFIG_CHANGED_EVENT, onCfg)
  }, [refreshAll])

  const wipName = useMemo(() => {
    const w = projectCards.find((p) => p.status === 'WIP')
    return w ? w.name : null
  }, [projectCards])

  const updateLead = useCallback(
    (id: string, patch: Partial<Lead>) => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                ...patch,
                activity:
                  patch.activity !== undefined ? patch.activity : l.activity,
              }
            : l,
        ),
      )
      schedulePersistLeads()
    },
    [schedulePersistLeads],
  )

  const setLeadStage = useCallback(
    (id: string, stage: Stage) => {
      let label = ''
      setLeads((prev) => {
        const old = prev.find((l) => l.id === id)
        if (!old || old.stage === stage) return prev
        label = old.name
        const act: LeadActivity = {
          ts: nowIso(),
          type: 'stage_change',
          detail: `${old.stage} → ${stage}`,
        }
        return prev.map((l) =>
          l.id === id
            ? { ...l, stage, activity: [act, ...l.activity] }
            : l,
        )
      })
      if (label) {
        queueMicrotask(() =>
          pushActivity({
            category: 'LEAD',
            message: `${label} moved to ${stage}`,
          }),
        )
      }
      schedulePersistLeads()
    },
    [pushActivity, schedulePersistLeads],
  )

  const deleteLead = useCallback(
    (id: string) => {
      setLeadDetailId((cur) => (cur === id ? null : cur))
      setLeads((prev) => {
        const next = prev.filter((l) => l.id !== id)
        queueMicrotask(() => void persistLeadsToGithub(next))
        return next
      })
    },
    [persistLeadsToGithub],
  )

  const createLead = useCallback(
    (payload: {
      name: string
      city: string
      url?: string
      notes?: string
    }) => {
      setLeads((prev) => {
        const id = nextLeadId(prev)
        const d = todayIso()
        const lead: Lead = {
          id,
          name: payload.name.trim(),
          city: payload.city.trim(),
          url: (payload.url ?? '').trim(),
          sent: d,
          stage: 'SENT',
          lastContact: d,
          notes: (payload.notes ?? '').trim(),
          activity: [
            {
              ts: nowIso(),
              type: 'created',
              detail: 'Lead created, demo sent',
            },
          ],
        }
        const next = [...prev, lead]
        queueMicrotask(() => void persistLeadsToGithub(next))
        queueMicrotask(() =>
          pushActivity({
            category: 'LEAD',
            message: `Lead created: ${lead.name}`,
          }),
        )
        return next
      })
    },
    [persistLeadsToGithub, pushActivity],
  )

  const getProjectState = useCallback(
    (slug: string) => stateCache[slug],
    [stateCache],
  )

  const loadProjectState = useCallback(async (slug: string) => {
    const path = `${REPO_PATHS.projectsDir}/${slug}/state.md`
    const f = await getTextFile(path)
    if (!f) {
      showError(`Missing state.md for ${slug}`)
      return
    }
    const parsed = parseStateMd(f.content, slug)
    setStateCache((prev) => ({
      ...prev,
      [slug]: { parsed, sha: f.sha },
    }))
  }, [showError])

  const saveProjectState = useCallback(
    async (
      slug: string,
      parsed: ParsedState,
      opts?: { sessionNote?: string },
    ) => {
      let next = parsed
      if (opts?.sessionNote?.trim()) {
        next = appendSessionNote(parsed, opts.sessionNote.trim())
      }
      const path = `${REPO_PATHS.projectsDir}/${slug}/state.md`
      const msg = `overwatch: update ${slug}/state.md`
      try {
        setSyncing(true)
        const fresh = await getTextFile(path)
        const sha = fresh?.sha
        const content = serializeStateMd(next)
        await putTextFile(path, content, msg, sha)
        const again = await getTextFile(path)
        if (again) {
          const p = parseStateMd(again.content, slug)
          setStateCache((prev) => ({
            ...prev,
            [slug]: { parsed: p, sha: again.sha },
          }))
          setProjectCards((cards) =>
            cards.map((c) => {
              if (c.slug !== slug) return c
              const sessions = p.sessionLog
              const updated =
                sessions.length > 0 ? sessions[sessions.length - 1].date : '—'
              return {
                ...c,
                name: p.projectName,
                status: p.status,
                priority: p.priority,
                updated,
                taskPreview:
                  p.currentTask.slice(0, 120) +
                  (p.currentTask.length > 120 ? '…' : ''),
                nextPreview:
                  p.nextAction.slice(0, 80) +
                  (p.nextAction.length > 80 ? '…' : ''),
                blocker: p.blocker.trim() ? p.blocker : null,
              }
            }),
          )
        }
        pushActivity({
          category: 'PROJECT',
          message: `Pushed ${slug}/state.md`,
        })
      } catch (err) {
        const m =
          err instanceof GitHubApiError ? err.message : String(err)
        showError(m)
      } finally {
        setSyncing(false)
      }
    },
    [pushActivity, showError],
  )

  const executeWipSwap = useCallback(
    async (parkSlug: string, activateSlug: string) => {
      try {
        setSyncing(true)
        const pathPark = `${REPO_PATHS.projectsDir}/${parkSlug}/state.md`
        const pathAct = `${REPO_PATHS.projectsDir}/${activateSlug}/state.md`
        const fp = await getTextFile(pathPark)
        let fa = await getTextFile(pathAct)
        if (!fp || !fa) throw new Error('Missing state files for WIP swap')
        let pa = parseStateMd(fp.content, parkSlug)
        let pb = parseStateMd(fa.content, activateSlug)
        pa = { ...pa, status: 'PARKED' }
        await putTextFile(pathPark, serializeStateMd(pa), 'overwatch: park WIP', fp.sha)
        fa = (await getTextFile(pathAct))!
        pb = parseStateMd(fa.content, activateSlug)
        pb = { ...pb, status: 'WIP' }
        await putTextFile(pathAct, serializeStateMd(pb), 'overwatch: activate WIP', fa.sha)
        await loadProjects()
        await loadProjectState(parkSlug)
        await loadProjectState(activateSlug)
        pushActivity({
          category: 'WIP',
          message: `WIP: ${activateSlug} active; ${parkSlug} parked`,
        })
      } catch (err) {
        const m =
          err instanceof GitHubApiError ? err.message : String(err)
        showError(m)
      } finally {
        setSyncing(false)
      }
    },
    [loadProjectState, loadProjects, pushActivity, showError],
  )

  const prepareWipToggle = useCallback(
    async (
      slug: string,
      draft: ParsedState,
    ): Promise<
      | { action: 'direct'; newStatus: ParsedState['status'] }
      | { action: 'confirm_swap'; parkSlug: string; activateSlug: string }
    > => {
      if (draft.status === 'WIP') {
        return { action: 'direct', newStatus: 'PARKED' }
      }
      const otherWip = projectCards.find(
        (p) => p.slug !== slug && p.status === 'WIP',
      )
      if (otherWip) {
        return {
          action: 'confirm_swap',
          parkSlug: otherWip.slug,
          activateSlug: slug,
        }
      }
      return { action: 'direct', newStatus: 'WIP' }
    },
    [projectCards],
  )

  const logInbox = useCallback(
    async (text: string) => {
      const line = text.trim()
      if (!line) return
      const d = todayIso()
      try {
        setSyncing(true)
        setInbox((prev) => [{ ts: d, text: line }, ...prev])
        const prevFile = await getTextFile(REPO_PATHS.inboxMd)
        const nextContent = appendInboxLine(prevFile?.content ?? null, d, line)
        await putTextFile(
          REPO_PATHS.inboxMd,
          nextContent,
          'overwatch: inbox append',
          prevFile?.sha,
        )
        const fresh = await getTextFile(REPO_PATHS.inboxMd)
        if (fresh) {
          const entries = parseInboxMd(fresh.content)
          setInbox([...entries].reverse())
          setInboxSha(fresh.sha)
        }
        pushActivity({
          category: 'INBOX',
          message: `New transmission logged`,
        })
      } catch (err) {
        const m =
          err instanceof GitHubApiError ? err.message : String(err)
        showError(m)
      } finally {
        setSyncing(false)
      }
    },
    [pushActivity, showError],
  )

  const retrySync = useCallback(() => {
    void refreshAll()
  }, [refreshAll])

  const value: AppContextValue = {
    tab,
    setTab,
    syncError,
    clearSyncError,
    retrySync,
    loading,
    syncing,
    leads,
    leadsLoading,
    leadsSha,
    updateLead,
    deleteLead,
    createLead,
    setLeadStage,
    inbox,
    inboxLoading,
    logInbox,
    inboxTextAreaRef,
    projectCards,
    projectsLoading,
    projectDetailSlug,
    openProjectDetail: setProjectDetailSlug,
    closeProjectDetail: () => setProjectDetailSlug(null),
    leadDetailId,
    openLeadDetail: setLeadDetailId,
    closeLeadDetail: () => setLeadDetailId(null),
    getProjectState,
    loadProjectState,
    saveProjectState,
    prepareWipToggle,
    executeWipSwap,
    refreshAll,
    activityLog,
    pushActivity,
    wipName,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

