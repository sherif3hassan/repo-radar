import { describe, expect, it } from 'vitest'

import { freshness } from './freshness'

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString()

describe('freshness', () => {
  it('reports Unknown for null', () => {
    expect(freshness(null)).toEqual({ label: 'Unknown', tone: 'warning' })
  })

  /**
   * `Date.parse` returns NaN on a bad string, and NaN fails both threshold
   * comparisons — without this guard control falls through to Stale.
   */
  it('reports Unknown for an unparseable date', () => {
    expect(freshness('not-a-date')).toEqual({ label: 'Unknown', tone: 'warning' })
  })

  it('reports Active within 30 days', () => {
    expect(freshness(daysAgo(10))).toEqual({ label: 'Active', tone: 'success' })
  })

  it('reports Quiet between 30 and 365 days', () => {
    expect(freshness(daysAgo(100))).toEqual({ label: 'Quiet', tone: 'warning' })
  })

  it('reports Stale beyond 365 days', () => {
    expect(freshness(daysAgo(400))).toEqual({ label: 'Stale', tone: 'error' })
  })
})
