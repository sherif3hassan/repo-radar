import { describe, expect, it } from 'vitest'

import { tokens } from './theme'

/** WCAG relative luminance. */
const channel = (value: number): number => {
  const v = value / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  )
}

export const contrast = (a: string, b: string): number => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (lighter + 0.05) / (darker + 0.05)
}

/** WCAG 1.4.6 — enhanced contrast for body text. */
const AAA_TEXT = 7
/** WCAG 1.4.11 — non-text content that carries meaning. */
const GRAPHIC = 3

describe.each([
  ['light', tokens.light],
  ['dark', tokens.dark],
])('%s scheme', (_name, t) => {
  describe('text meets AAA', () => {
    it.each([
      ['primary ink on surface', t.ink, t.surface],
      ['primary ink on page', t.ink, t.page],
      ['secondary ink on surface', t.inkSecondary, t.surface],
      ['secondary ink on page', t.inkSecondary, t.page],
      ['accent as link text on surface', t.accent, t.surface],
      ['accent hover on surface', t.accentHover, t.surface],
    ])('%s', (_label, fg, bg) => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AAA_TEXT)
    })

    // Button text sits ON the accent rather than beside it.
    it('surface text on an accent fill', () => {
      expect(contrast(t.surface, t.accent)).toBeGreaterThanOrEqual(AAA_TEXT)
    })
  })

  describe('meaningful non-text meets 3:1', () => {
    it.each([
      ['chart series on its surface', t.series, t.surface],
      ['control border on surface', t.controlBorder, t.surface],
      ['control border on page', t.controlBorder, t.page],
    ])('%s', (_label, fg, bg) => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(GRAPHIC)
    })
  })

  /**
   * The series colour is a mark, not text. If someone "simplifies" it to equal
   * the accent, bars become near-black; if they set the accent to the series
   * blue, links drop to 4.30:1 and fail AA. They must stay distinct.
   */
  it('keeps the chart series distinct from the interactive accent', () => {
    expect(t.series).not.toBe(t.accent)
  })

  /** Two magnitudes shown side by side must not read as one scale. */
  it('keeps the second magnitude hue distinct from the first', () => {
    expect(t.seriesAlt).not.toBe(t.series)
    expect(contrast(t.seriesAlt, t.surface)).toBeGreaterThanOrEqual(GRAPHIC)
  })

  /**
   * The slot order is the colourblind-safety mechanism, not a preference — it
   * was validated for adjacent-pair separation. Reordering or trimming it
   * silently weakens that, so the test pins both.
   */
  it('keeps the categorical palette at eight slots in a fixed order', () => {
    expect(t.categorical).toHaveLength(8)
    expect(new Set(t.categorical).size).toBe(8)
    expect(t.categorical[0]).toBe(t.series)
  })
})
