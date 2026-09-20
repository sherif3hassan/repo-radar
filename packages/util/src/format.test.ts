import { describe, expect, it } from 'vitest'

import { formatCompactNumber, formatRelativeDate } from './format'

describe('formatCompactNumber', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1_000, '1K'],
    [1_500, '1.5K'],
    [228_000, '228K'],
    [1_200_000, '1.2M'],
  ])('formats %i as %s', (input, expected) => {
    expect(formatCompactNumber(input)).toBe(expected)
  })
})

describe('formatRelativeDate', () => {
  const now = new Date('2026-09-19T12:00:00Z')

  it.each([
    ['2026-09-19T11:59:30Z', '30 seconds ago'],
    ['2026-09-19T11:00:00Z', '1 hour ago'],
    ['2026-09-16T12:00:00Z', '3 days ago'],
    ['2026-06-19T12:00:00Z', '3 months ago'],
  ])('formats %s as %s', (iso, expected) => {
    expect(formatRelativeDate(iso, now)).toBe(expected)
  })

  it('handles future dates', () => {
    expect(formatRelativeDate('2026-09-20T12:00:00Z', now)).toBe('tomorrow')
  })

  it.each([null, undefined, '', 'not-a-date'])('returns null for %p', (input) => {
    expect(formatRelativeDate(input, now)).toBeNull()
  })
})
