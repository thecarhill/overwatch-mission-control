/** `deadline` is YYYY-MM-DD or ISO slice */
export function formatDeadlineLabel(
  deadline: string | null,
  relative: boolean,
): string {
  if (!deadline) return '—'
  const day = deadline.slice(0, 10)
  if (!relative || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return day

  const target = new Date(`${day}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 1) return `in ${diff}d`
  if (diff < -1) return `${-diff}d overdue`
  return day
}

export function formatIsoDate(iso: string): string {
  return iso.slice(0, 10)
}
