import type { ProjectRegistryRow } from '../types'

/**
 * projects.md lines after header:
 * `- slug — Display Name` or `- slug - Display Name`
 * `slug|Display Name`
 */
export function parseProjectsMd(content: string): ProjectRegistryRow[] {
  const out: ProjectRegistryRow[] = []
  for (let line of content.split('\n')) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue

    const pipe = line.split('|')
    if (pipe.length >= 2) {
      const slug = pipe[0].replace(/^-\s*/, '').trim()
      const nameHint = pipe.slice(1).join('|').trim()
      if (slug) out.push({ slug, nameHint: nameHint || undefined })
      continue
    }

    const mdash = line.match(/^-\s*(\S+)\s*[—–-]\s*(.+)$/)
    if (mdash) {
      out.push({ slug: mdash[1], nameHint: mdash[2].trim() })
    }
  }
  return out
}
