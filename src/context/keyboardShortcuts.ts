import { useEffect, type RefObject } from 'react'
import type { TabId } from '../types'
import { TAB_ORDER } from '../utils/constants'

export function usePanelShortcut(
  setTab: (t: TabId) => void,
  inboxRef: RefObject<HTMLTextAreaElement | null>,
  closeDetail: () => void,
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key >= '1' && e.key <= '6') {
        const i = parseInt(e.key, 10) - 1
        if (TAB_ORDER[i]) {
          e.preventDefault()
          setTab(TAB_ORDER[i])
        }
      }
      if (
        e.key === '/' &&
        !meta &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        setTab('inbox')
        window.setTimeout(() => inboxRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        closeDetail()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setTab, inboxRef, closeDetail])
}
