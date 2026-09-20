import type { RateLimit } from '@repo-radar/types'

/**
 * The latest rate-limit snapshot seen on any response.
 *
 * An external store rather than Redux state: this is an observation of the last
 * HTTP response, not state the app owns, so the indicator can read it with
 * `useSyncExternalStore` without dispatching an action per request.
 */
let snapshot: RateLimit | null = null
const listeners = new Set<() => void>()

export const getRateLimit = (): RateLimit | null => snapshot

export const subscribeToRateLimit = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const recordRateLimit = (next: RateLimit | null): void => {
  if (!next) return

  // Responses resolve out of order; never move the snapshot backwards in time.
  if (snapshot && Date.parse(next.resetAt) < Date.parse(snapshot.resetAt)) return

  snapshot = next
  for (const listener of listeners) listener()
}

/** Test seam — resets module state between cases. */
export const resetRateLimit = (): void => {
  snapshot = null
  listeners.clear()
}
