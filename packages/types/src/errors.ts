export type GithubError =
  /** `secondary` is GitHub's abuse throttle, not the hourly quota. */
  | { kind: 'rate-limit'; resetAt: string; authenticated: boolean; secondary?: boolean }
  | { kind: 'unauthorized' }
  | { kind: 'not-found' }
  | { kind: 'network' }
  | { kind: 'invalid-query'; message: string }
  | { kind: 'parse'; issues: string }
  | { kind: 'unknown'; status?: number }

export const isRateLimit = (
  error: GithubError,
): error is Extract<GithubError, { kind: 'rate-limit' }> => error.kind === 'rate-limit'

const KINDS = new Set([
  'rate-limit',
  'unauthorized',
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

export const asGithubError = (error: unknown): GithubError =>
  isGithubError(error) ? error : { kind: 'unknown' }
