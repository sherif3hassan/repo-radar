import { beforeEach, describe, expect, it } from 'vitest'

import { countFromLink, parseRateLimit, toGithubError } from './client'
import { getRateLimit, recordRateLimit, resetRateLimit } from './rateLimitStore'

const headers = (init: Record<string, string>) => new Headers(init)

const RESET_EPOCH = 1_789_000_000

describe('parseRateLimit', () => {
  it('reads the three rate-limit headers', () => {
    const result = parseRateLimit(
      headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '42',
        'x-ratelimit-reset': String(RESET_EPOCH),
      }),
    )

    expect(result).toEqual({
      limit: 60,
      remaining: 42,
      resetAt: new Date(RESET_EPOCH * 1000).toISOString(),
    })
  })

  it('returns null when the headers are absent', () => {
    expect(parseRateLimit(headers({}))).toBeNull()
  })

  it('returns null rather than zero when a header is missing', () => {
    const result = parseRateLimit(
      headers({ 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '10' }),
    )
    expect(result).toBeNull()
  })

  it('returns null for non-numeric values', () => {
    const result = parseRateLimit(
      headers({
        'x-ratelimit-limit': 'lots',
        'x-ratelimit-remaining': '10',
        'x-ratelimit-reset': String(RESET_EPOCH),
      }),
    )
    expect(result).toBeNull()
  })
})

describe('toGithubError', () => {
  it('maps 404 to not-found', () => {
    expect(toGithubError(404, headers({}), false)).toEqual({ kind: 'not-found' })
  })

  it('maps an exhausted 403 to rate-limit', () => {
    const error = toGithubError(
      403,
      headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(RESET_EPOCH),
      }),
      false,
    )

    expect(error).toEqual({
      kind: 'rate-limit',
      resetAt: new Date(RESET_EPOCH * 1000).toISOString(),
      authenticated: false,
    })
  })

  it('does not treat a 403 with remaining budget as rate-limit', () => {
    const error = toGithubError(
      403,
      headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '55',
        'x-ratelimit-reset': String(RESET_EPOCH),
      }),
      false,
    )

    expect(error).toEqual({ kind: 'unknown', status: 403 })
  })

  it('records whether the request was authenticated', () => {
    const error = toGithubError(
      429,
      headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(RESET_EPOCH),
      }),
      true,
    )

    expect(error).toMatchObject({ kind: 'rate-limit', authenticated: true })
  })

  it('falls back to unknown with the status', () => {
    expect(toGithubError(500, headers({}), false)).toEqual({ kind: 'unknown', status: 500 })
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
    expect(toGithubError(422, headers({}), false, { message: 'Validation Failed' })).toEqual({
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

  it('starts empty and records a snapshot', () => {
    expect(getRateLimit()).toBeNull()

    const snapshot = { limit: 60, remaining: 59, resetAt: new Date(RESET_EPOCH * 1000).toISOString() }
    recordRateLimit(snapshot)

    expect(getRateLimit()).toEqual(snapshot)
  })

  it('ignores a snapshot from an older window', () => {
    const newer = { limit: 60, remaining: 30, resetAt: new Date(RESET_EPOCH * 1000).toISOString() }
    const older = { limit: 60, remaining: 59, resetAt: new Date((RESET_EPOCH - 3600) * 1000).toISOString() }

    recordRateLimit(newer)
    recordRateLimit(older)

    expect(getRateLimit()).toEqual(newer)
  })

  it('ignores null', () => {
    const snapshot = { limit: 60, remaining: 10, resetAt: new Date(RESET_EPOCH * 1000).toISOString() }
    recordRateLimit(snapshot)
    recordRateLimit(null)

    expect(getRateLimit()).toEqual(snapshot)
  })
})
