import { describe, expect, it } from 'vitest'

import { withDisplayLabels, type BarDatum, type DisplayDatum } from './datum'

const datum = (label: string, shortLabel?: string): BarDatum => ({
  label,
  shortLabel,
  value: 1,
})

const labels = (data: DisplayDatum[]) => data.map((d) => d.display)

describe('withDisplayLabels', () => {
  it('uses the full label when there is room', () => {
    const data = [datum('facebook/react', 'react'), datum('vuejs/core', 'core')]

    expect(labels(withDisplayLabels(data, false))).toEqual([
      'facebook/react',
      'vuejs/core',
    ])
  })

  it('uses the short label when narrow', () => {
    const data = [datum('facebook/react', 'react'), datum('vuejs/core', 'core')]

    expect(labels(withDisplayLabels(data, true))).toEqual(['react', 'core'])
  })

  it('falls back to the full label when a datum has no short one', () => {
    expect(labels(withDisplayLabels([datum('org/thing')], true))).toEqual(['org/thing'])
  })

  /**
   * A band axis is keyed by label, so two bars sharing one collapse into a
   * single band and one of them silently disappears from the chart.
   */
  it('keeps full labels for short labels that collide', () => {
    const data = [
      datum('facebook/react', 'react'),
      datum('preactjs/react', 'react'),
      datum('vuejs/core', 'core'),
    ]

    expect(labels(withDisplayLabels(data, true))).toEqual([
      'facebook/react',
      'preactjs/react',
      'core',
    ])
  })

  it('never produces duplicate labels for data with unique full labels', () => {
    const data = ['a/x', 'b/x', 'c/x', 'd/y'].map((full) =>
      datum(full, full.split('/')[1]),
    )

    const result = labels(withDisplayLabels(data, true))
    expect(new Set(result).size).toBe(result.length)
  })

  it('leaves the full label alone, so the accessible table can still use it', () => {
    const data = [datum('facebook/react', 'react'), datum('vuejs/core', 'core')]

    expect(withDisplayLabels(data, true).map((d) => d.label)).toEqual([
      'facebook/react',
      'vuejs/core',
    ])
  })

  it('preserves value and order', () => {
    const data: BarDatum[] = [
      { label: 'a/one', shortLabel: 'one', value: 9 },
      { label: 'b/two', shortLabel: 'two', value: 3 },
    ]

    expect(withDisplayLabels(data, true).map((d) => d.value)).toEqual([9, 3])
  })
})
