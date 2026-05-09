import type { InboxEntry } from '../types'

/** Parses OVERWATCH inbox.md — lines under # INBOX as `- YYYY-MM-DD: text` */
export function parseInboxMd(md: string): InboxEntry[] {
  const entries: InboxEntry[] = []
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  for (const line of lines) {
    const m = line.match(/^[-*]\s*(\d{4}-\d{2}-\d{2})\s*:\s*(.+)$/)
    if (m) entries.push({ ts: m[1], text: m[2].trim() })
  }
  return entries
}

/** Append one line to inbox body (before EOF); preserves # INBOX header if present */
export function appendInboxLine(md: string | null, todayIso: string, text: string): string {
  const line = `- ${todayIso}: ${text.replace(/\n/g, ' ')}`
  if (!md || !md.trim()) {
    return `# INBOX\n\n${line}\n`
  }
  const trimmed = md.replace(/\r\n/g, '\n').trimEnd()
  return `${trimmed}\n${line}\n`
}
