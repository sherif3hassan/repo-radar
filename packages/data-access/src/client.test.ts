import type { BaseQueryApi } from '@reduxjs/toolkit/query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  countFromLink,
  githubBaseQuery,
  parseRateLimit,
  setTokenAccessor,
  toGithubError,
} from './client'
import {
  getRateLimit,
  recordRateLimit,
  resetRateLimit,
  subscribeToRateLimit,
} from './rateLimitStore'

const headers = (init: Record<string, string>) => new Headers(init)

const RESET_EPOCH = 1_789_000_000
const RESET_ISO = new Date(RESET_EPOCH * 1000).toISOString()

const budget = (remaining: string, limit = '60') => ({
  'x-ratelimit-limit': limit,
  'x-ratelimit-remaining': remaining,
  'x-ratelimit-reset': String(RESET_EPOCH),
})

describe('parseRateLimit', () => {
  it('reads the rate-limit headers', () => {
    expect(parseRateLimit(headers(budget('42')))).toEqual({
      limit: 60,
      remaining: 42,
      resetAt: RESET_ISO,
      resource: 'core',
    })
  })

  it('reads which budget the response counted against', () => {
    const result = parseRateLimit(
      headers({ ...budget('9', '10'), 'x-ratelimit-resource': 'search' }),
    )

    expect(result).toMatchObject({ limit: 10, resource: 'search' })
  })

  it('returns null when the headers are absent', () => {
    expect(parseRateLimit(headers({}))).toBeNull()
  })

  /**
   * `Number(null)` is 0, so a naive cast would report a spurious "0 remaining"
   * and misclassify every 403 as rate limiting.
   */
  it('returns null rather than zero when a header is missing', () => {
    const result = parseRateLimit(
      headers({ 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '10' }),
    )
    expect(result).toBeNull()
  })

  it('returns null for non-numeric values', () => {
    expect(
      parseRateLimit(headers({ ...budget('10'), 'x-ratelimit-limit': 'lots' })),
    ).toBeNull()
  })
})

describe('toGithubError', () => {
  const NOW = 1_700_000_000_000

  it('maps 404 to not-found', () => {
    expect(toGithubError(404, headers({}), false)).toEqual({ kind: 'not-found' })
  })

  it('maps 401 to unauthorized', () => {
    expect(toGithubError(401, headers({}), true)).toEqual({ kind: 'unauthorized' })
  })

  describe('primary rate limit', () => {
    it('maps an exhausted 403 to rate-limit', () => {
      expect(toGithubError(403, headers(budget('0')), false)).toEqual({
        kind: 'rate-limit',
        resetAt: RESET_ISO,
        authenticated: false,
      })
    })

    it('records whether the request was authenticated', () => {
      const error = toGithubError(429, headers(budget('0', '5000')), true)

      expect(error).toMatchObject({ kind: 'rate-limit', authenticated: true })
    })

    it('is not flagged as secondary', () => {
      expect(toGithubError(403, headers(budget('0')), false)).not.toHaveProperty(
        'secondary',
      )
    })
  })

  /**
   * The secondary limit throttles bursts and leaves the hourly budget intact,
   * so `remaining` is not zero. It used to fall through to "unknown" even
   * though a comment in this file named it.
   */
  describe('secondary rate limit', () => {
    it('honours Retry-After', () => {
      const error = toGithubError(
        403,
        headers({ ...budget('40'), 'retry-after': '30' }),
        false,
        undefined,
        NOW,
      )

      expect(error).toEqual({
        kind: 'rate-limit',
        resetAt: new Date(NOW + 30_000).toISOString(),
        authenticated: false,
        secondary: true,
      })
    })

    it('treats a bare 429 as a limit and waits the documented minute', () => {
      const error = toGithubError(429, headers({}), false, undefined, NOW)

      expect(error).toMatchObject({
        kind: 'rate-limit',
        secondary: true,
        resetAt: new Date(NOW + 60_000).toISOString(),
      })
    })

    it('recognises the message on a 403 with budget left', () => {
      const error = toGithubError(
        403,
        headers(budget('55')),
        false,
        { message: 'You have exceeded a secondary rate limit. Please wait.' },
        NOW,
      )

      expect(error).toMatchObject({ kind: 'rate-limit', secondary: true })
    })

    it('keeps a primary limit primary even when Retry-After is present', () => {
      const error = toGithubError(
        403,
        headers({ ...budget('0'), 'retry-after': '30' }),
        false,
      )

      expect(error).not.toHaveProperty('secondary')
    })
  })

  it('does not treat a plain 403 with remaining budget as rate-limit', () => {
    expect(toGithubError(403, headers(budget('55')), false)).toEqual({
      kind: 'unknown',
      status: 403,
    })
  })

  it('falls back to unknown with the status', () => {
    expect(toGithubError(500, headers({}), false)).toEqual({
      kind: 'unknown',
      status: 500,
    })
  })

  it('carries GitHub’s explanation for a rejected query', () => {
    const error = toGithubError(422, headers({}), false, {
      message: 'Validation Failed',
      errors: [{ message: 'None of the search qualifiers apply to this search type.' }],
    })

    expect(error).toEqual({
      kind: 'invalid-query',
      message: 'None of the search qualifiers apply to this search type.',
    })
  })

  it('falls back to the top-level message when there is no field error', () => {
    expect(
      toGithubError(422, headers({}), false, { message: 'Validation Failed' }),
    ).toEqual({
      kind: 'invalid-query',
      message: 'Validation Failed',
    })
  })

  it('still reports a rejected query when the body is unusable', () => {
    expect(toGithubError(422, headers({}), false, null)).toMatchObject({
      kind: 'invalid-query',
    })
  })
})

describe('countFromLink', () => {
  const link = (page: number) =>
    `<https://api.github.com/x?per_page=1&page=2>; rel="next", <https://api.github.com/x?per_page=1&page=${page}>; rel="last"`

  it('reads the total from rel="last"', () => {
    expect(countFromLink(link(526), 1)).toBe(526)
  })

  it('falls back to the items on the first page when there is no Link', () => {
    expect(countFromLink(null, 1)).toBe(1)
    expect(countFromLink(null, 0)).toBe(0)
  })

  it('falls back when Link has no last page', () => {
    expect(countFromLink('<https://api.github.com/x?page=2>; rel="next"', 1)).toBe(1)
  })
})

describe('rate limit store', () => {
  beforeEach(resetRateLimit)

  const snapshot = (
    over: Partial<Parameters<typeof recordRateLimit>[0] & object> = {},
  ) => ({
    limit: 60,
    remaining: 59,
    resetAt: RESET_ISO,
    resource: 'core',
    ...over,
  })

  it('starts empty and records a snapshot', () => {
    expect(getRateLimit()).toBeNull()

    recordRateLimit(snapshot())

    expect(getRateLimit()).toEqual(snapshot())
  })

  it('ignores a snapshot from an older window', () => {
    const newer = snapshot({ remaining: 30 })
    const older = snapshot({
      remaining: 59,
      resetAt: new Date((RESET_EPOCH - 3600) * 1000).toISOString(),
    })

    recordRateLimit(newer)
    recordRateLimit(older)

    expect(getRateLimit()).toEqual(newer)
  })

  it('ignores an earlier response that arrives late', () => {
    recordRateLimit(snapshot({ remaining: 40 }))
    recordRateLimit(snapshot({ remaining: 45 }))

    expect(getRateLimit()?.remaining).toBe(40)
  })

  it('accepts a lower remaining within the same window', () => {
    recordRateLimit(snapshot({ remaining: 40 }))
    recordRateLimit(snapshot({ remaining: 39 }))

    expect(getRateLimit()?.remaining).toBe(39)
  })

  it('ignores null', () => {
    recordRateLimit(snapshot({ remaining: 10 }))
    recordRateLimit(null)

    expect(getRateLimit()?.remaining).toBe(10)
  })

  /**
   * One shared snapshot used to flip the header chip between "9/10" and "57/60"
   * depending on which request answered last, because search and core are
   * separate budgets.
   */
  it('keeps the search budget from overwriting the core one', () => {
    recordRateLimit(snapshot({ remaining: 57 }))
    recordRateLimit(snapshot({ resource: 'search', limit: 10, remaining: 9 }))

    expect(getRateLimit()).toMatchObject({ resource: 'core', remaining: 57 })
    expect(getRateLimit('search')).toMatchObject({ resource: 'search', remaining: 9 })
  })

  it('notifies subscribers when a snapshot is recorded', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToRateLimit(listener)

    recordRateLimit(snapshot())

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('stops notifying after unsubscribing', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToRateLimit(listener)
    unsubscribe()

    recordRateLimit(snapshot())

    expect(listener).not.toHaveBeenCalled()
  })

  it('does not notify for a stale snapshot it discards', () => {
    recordRateLimit(snapshot({ remaining: 40 }))
    const listener = vi.fn()
    const unsubscribe = subscribeToRateLimit(listener)

    recordRateLimit(snapshot({ remaining: 45 }))

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})

describe('githubBaseQuery', () => {
  /**
   * `BaseQueryApi` carries a `ThunkDispatch` and store types that a base query
   * never touches here, so only the field under test is real.
   */
  const api = (signal: AbortSignal) => ({ signal }) as unknown as BaseQueryApi

  const ok = () =>
    new Response('{}', {
      status: 200,
      headers: { ...budget('9', '10'), 'x-ratelimit-resource': 'search' },
    })

  beforeEach(resetRateLimit)
  afterEach(() => vi.unstubAllGlobals())

  /**
   * RTK Query aborts the previous request when a query's argument changes. If
   * the signal is not forwarded, every superseded search keeps running.
   */
  it('forwards the abort signal to fetch', async () => {
    const fetchMock = vi.fn(async () => ok())
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await githubBaseQuery({ path: '/search/repositories' }, api(controller.signal), {})

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit
    expect(init.signal).toBe(controller.signal)
  })

  it('never sends a request whose signal is already aborted', async () => {
    const fetchMock = vi.fn(async () => ok())
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    controller.abort()

    const result = await githubBaseQuery({ path: '/x' }, api(controller.signal), {})

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result).toMatchObject({ error: { kind: 'network' } })
  })

  it('records the budget the response counted against', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ok()),
    )

    await githubBaseQuery({ path: '/x' }, api(new AbortController().signal), {})

    expect(getRateLimit('search')).toMatchObject({ remaining: 9, limit: 10 })
    expect(getRateLimit()).toBeNull()
  })

  it('maps a 401 to unauthorized', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"message":"Bad credentials"}', { status: 401 })),
    )

    const result = await githubBaseQuery(
      { path: '/x' },
      api(new AbortController().signal),
      {},
    )

    expect(result).toMatchObject({ error: { kind: 'unauthorized' } })
  })

  /**
   * `Headers.set` throws `TypeError` on a character outside Latin-1 — reachable
   * from a token mangled by a bad copy-paste (a Cyrillic homoglyph here). The
   * error must map onto `unauthorized`, not escape as an unhandled exception.
   */
  it('maps a token with a non-Latin-1 character to unauthorized without throwing', async () => {
    setTokenAccessor(() => 'ghp_рbad')
    const fetchMock = vi.fn(async () => ok())
    vi.stubGlobal('fetch', fetchMock)

    const result = await githubBaseQuery(
      { path: '/x' },
      api(new AbortController().signal),
      {},
    )

    expect(result).toMatchObject({ error: { kind: 'unauthorized' } })
    expect(fetchMock).not.toHaveBeenCalled()

    setTokenAccessor(() => null)
  })
})
