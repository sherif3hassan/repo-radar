/**
 * Every failure the app can surface, in one shape.
 *
 * Lives here rather than in `data-access` because `ui` renders these states and
 * must not import the data layer to learn their shape.
 *
 * @remarks
 * `resetAt` is an ISO string, not a `Date`: these errors are stored in the RTK
 * Query cache, and non-serializable values there break persistence and
 * time-travel debugging.
 */
export type GithubError =
  | { kind: 'rate-limit'; resetAt: string; authenticated: boolean }
  | { kind: 'not-found' }
  | { kind: 'network' }
  /** A 422 from search. GitHub's body explains precisely what was wrong. */
  | { kind: 'invalid-query'; message: string }
  | { kind: 'parse'; issues: string }
  | { kind: 'unknown'; status?: number }

/** The failure users actually hit: 60 requests/hour unauthenticated. */
export const isRateLimit = (
  error: GithubError,
): error is Extract<GithubError, { kind: 'rate-limit' }> => error.kind === 'rate-limit'

const KINDS = new Set([
  'rate-limit',
  'not-found',
  'network',
  'invalid-query',
  'parse',
  'unknown',
])

export const isGithubError = (error: unknown): error is GithubError =>
  typeof error === 'object' &&
  error !== null &&
  'kind' in error &&
  KINDS.has((error as { kind: unknown }).kind as string)

/**
 * Narrow RTK Query's `BaseQueryError | SerializedError` to one shape.
 *
 * A `queryFn` that *throws* produces a `SerializedError` that never passed
 * through our baseQuery, so components would otherwise handle two unions.
 */
export const asGithubError = (error: unknown): GithubError =>
  isGithubError(error) ? error : { kind: 'unknown' }
