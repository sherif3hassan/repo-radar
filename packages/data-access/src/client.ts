import type { GithubError, RateLimit } from '@repo-radar/types'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'

import {
  ACCEPT,
  API_ROOT,
  API_VERSION,
  MAX_CONCURRENT_REQUESTS,
  SECONDARY_LIMIT_BACKOFF_SECONDS,
} from './constants'
import { createLimiter } from './limiter'
import { recordRateLimit } from './rateLimitStore'

const limiter = createLimiter(MAX_CONCURRENT_REQUESTS)

/**
 * The token is supplied by the app, never read from the environment here.
 *
 * Vite inlines `VITE_*` variables into the public bundle, so a build-time token
 * would be published to anyone who opens devtools. The deployed app is
 * unauthenticated unless a user pastes their own token, which stays in their
 * browser. `apps/web` owns that state and injects an accessor at startup.
 */
let readToken: () => string | null = () => null

export const setTokenAccessor = (accessor: () => string | null): void => {
  readToken = accessor
}

const headerNumber = (headers: Headers, key: string): number | null => {
  const raw = headers.get(key)
  if (raw === null) return null

  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export const parseRateLimit = (headers: Headers): RateLimit | null => {
  const limit = headerNumber(headers, 'x-ratelimit-limit')
  const remaining = headerNumber(headers, 'x-ratelimit-remaining')
  const reset = headerNumber(headers, 'x-ratelimit-reset')

  if (limit === null || remaining === null || reset === null) return null

  return {
    limit,
    remaining,
    resetAt: new Date(reset * 1000).toISOString(),
    resource: headers.get('x-ratelimit-resource') ?? 'core',
  }
}

/**
 * GitHub's error bodies are specific and useful — "None of the search
 * qualifiers apply to this search type" tells a user exactly what to change,
 * where "422" tells them nothing. Prefer the field-level message when present.
 */
const explain = (body: unknown): string | null => {
  if (typeof body !== 'object' || body === null) return null

  const { message, errors } = body as { message?: unknown; errors?: unknown }

  if (Array.isArray(errors)) {
    const first = errors.find(
      (entry): entry is { message: string } =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { message?: unknown }).message === 'string',
    )
    if (first) return first.message
  }

  return typeof message === 'string' ? message : null
}

/**
 * Maps an HTTP failure onto the domain error union.
 *
 * 403 is overloaded: an exhausted quota, a secondary limit, or a plain refusal.
 * The secondary limit throttles bursts and leaves the hourly budget intact, so
 * `remaining` is not zero; it announces itself with `Retry-After`, a 429, or its
 * message. A 401 is a bad token, which the user can fix but only gets the chance
 * to if it is not folded into "something went wrong".
 */
export const toGithubError = (
  status: number,
  headers: Headers,
  authenticated: boolean,
  body?: unknown,
  now: number = Date.now(),
): GithubError => {
  if (status === 404) return { kind: 'not-found' }

  if (status === 401) return { kind: 'unauthorized' }

  if (status === 422) {
    return {
      kind: 'invalid-query',
      message: explain(body) ?? 'GitHub could not process that query.',
    }
  }

  if (status === 403 || status === 429) {
    const rateLimit = parseRateLimit(headers)
    if (rateLimit && rateLimit.remaining === 0) {
      return { kind: 'rate-limit', resetAt: rateLimit.resetAt, authenticated }
    }

    const retryAfter = headerNumber(headers, 'retry-after')
    const message = explain(body) ?? ''

    if (retryAfter !== null || status === 429 || /rate limit/i.test(message)) {
      const wait = retryAfter ?? SECONDARY_LIMIT_BACKOFF_SECONDS
      return {
        kind: 'rate-limit',
        resetAt: new Date(now + wait * 1000).toISOString(),
        authenticated,
        secondary: true,
      }
    }
  }

  return { kind: 'unknown', status }
}

export interface GithubRequest {
  path: string
  params?: Record<string, string | number | undefined>
}

export interface GithubMeta {
  rateLimit: RateLimit | null
  status: number
  link: string | null
}

/**
 * Total item count from a paginated response, read from `rel="last"`.
 *
 * Asking for `per_page=1` turns the last-page number into the item count, which
 * is far cheaper than paging through results just to count them. GitHub omits
 * `Link` entirely when everything fits on one page.
 */
export const countFromLink = (link: string | null, itemsOnFirstPage: number): number => {
  if (!link) return itemsOnFirstPage

  const match = /[?&]page=(\d+)>;\s*rel="last"/.exec(link)
  return match?.[1] ? Number(match[1]) : itemsOnFirstPage
}

/**
 * Returns raw JSON. Validation happens per-endpoint with the schemas from
 * `@repo-radar/types`, so a malformed response becomes a typed parse error at
 * this boundary rather than an `undefined` three components deep.
 *
 * The abort signal goes to both the limiter and `fetch`: the limiter drops a
 * request superseded while still queued, and `fetch` cancels one already on the
 * wire. RTK Query aborts the previous request when a query's argument changes,
 * so without this every superseded search would run to completion.
 *
 * Offline, DNS failure and CORS are indistinguishable from here, and the user
 * needs the same advice for all of them, so they share the `network` error. An
 * aborted request lands there too, but RTK Query discards its own aborts.
 */
export const githubBaseQuery: BaseQueryFn<
  GithubRequest,
  unknown,
  GithubError,
  object,
  GithubMeta
> = async ({ path, params }, { signal }) => {
  const url = new URL(path, API_ROOT)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const token = readToken()
  const headers = new Headers({
    Accept: ACCEPT,
    'X-GitHub-Api-Version': API_VERSION,
  })
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await limiter.run(() => fetch(url, { headers, signal }), signal)
  } catch {
    return { error: { kind: 'network' } }
  }

  const rateLimit = parseRateLimit(response.headers)
  recordRateLimit(rateLimit)

  const meta: GithubMeta = {
    rateLimit,
    status: response.status,
    link: response.headers.get('link'),
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    return {
      error: toGithubError(response.status, response.headers, Boolean(token), body),
      meta,
    }
  }

  try {
    return { data: (await response.json()) as unknown, meta }
  } catch {
    return { error: { kind: 'parse', issues: 'response body was not valid JSON' }, meta }
  }
}
