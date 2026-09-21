import type { RateLimit } from '@repo-radar/types'

/**
 * The latest rate-limit snapshot per resource, seen on any response.
 *
 * An external store rather than Redux state: this is an observation of the last
 * HTTP response, not state the app owns, so the indicator can read it with
 * `useSyncExternalStore` without dispatching an action per request.
 *
 * Keyed by resource because GitHub keeps `core` (60/hour) and `search`
 * (10/minute) as separate budgets. One shared snapshot would flip between
 * "9/10" and "57/60" depending on which request answered last.
 */
const snapshots = new Map<string, RateLimit>()
const listeners = new Set<() => void>()

/** The `core` budget by default — the one the header indicator shows. */
export const getRateLimit = (resource = 'core'): RateLimit | null =>
  snapshots.get(resource) ?? null

export const subscribeToRateLimit = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Responses resolve out of order, so a snapshot is only accepted if it is not
 * from an older window and, within one window, does not report more remaining
 * budget than already seen: that figure only falls, so a higher one belongs to a
 * response that was sent earlier and arrived later.
 */
export const recordRateLimit = (next: RateLimit | null): void => {
  if (!next) return

  const current = snapshots.get(next.resource)

  if (current) {
    const currentWindow = Date.parse(current.resetAt)
    const nextWindow = Date.parse(next.resetAt)

    if (nextWindow < currentWindow) return

    if (nextWindow === currentWindow && next.remaining > current.remaining) return
  }

  snapshots.set(next.resource, next)
  for (const listener of listeners) listener()
}

/**
 * Clears recorded snapshots only. Live subscribers (e.g. `RateLimitIndicator`'s
 * `useSyncExternalStore`) keep their subscription — clearing `listeners` here
 * would drop them permanently, since nothing ever resubscribes after mount.
 */
export const resetRateLimit = (): void => {
  snapshots.clear()
}
