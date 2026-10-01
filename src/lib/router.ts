import { useSyncExternalStore, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'

// Tiny history router. Every navigation runs inside a View Transition, so
// elements sharing a `view-transition-name` (tile → hero) morph between pages.

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function transition(update: () => void) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduce) return update()
  document.startViewTransition(() => flushSync(update))
}

addEventListener('popstate', () => transition(notify))

export function usePath() {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => location.pathname,
  )
}

export function navigate(to: string) {
  if (to === location.pathname) return
  transition(() => {
    history.pushState(null, '', to)
    notify()
    window.scrollTo(0, 0)
  })
}

/** onClick for <a href>: client-side navigate, but let modified clicks open new tabs. */
export function linkTo(to: string) {
  return (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(to)
  }
}
