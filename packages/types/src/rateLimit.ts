/**
 * A snapshot of GitHub's rate-limit headers.
 *
 * Unauthenticated callers get 60 requests/hour, so the app surfaces the
 * remaining budget rather than letting users discover it as a wall of errors.
 *
 * `resetAt` is an ISO string so the value stays serializable wherever it lands.
 */
export interface RateLimit {
  limit: number
  remaining: number
  resetAt: string
}
