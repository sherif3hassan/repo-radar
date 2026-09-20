import { ThemeProvider, createTheme } from '@mui/material/styles'
import { cleanup, render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BarDatum } from './datum'
import { CategoryBarChart } from './CategoryBarChart'
import { MagnitudeBarChart } from './MagnitudeBarChart'
import { ShareBar } from './ShareBar'
import { StalenessBarChart } from './StalenessBarChart'

const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
})

const renderChart = (ui: ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)

/**
 * `useMediaQuery` reads `window.matchMedia`, which jsdom does not implement, so
 * every query is reported as not matching. Stubbing it to match everything is
 * how a phone-width viewport is reached from a test.
 */
const useNarrowViewport = () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Each body row as `[row header, ...cells]`, in document order. */
const rowsOf = (table: HTMLElement): string[][] =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => [
      ...within(row)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent ?? ''),
      ...within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent ?? ''),
    ])

const repos: BarDatum[] = [
  { label: 'vuejs/core', shortLabel: 'core', value: 48_000 },
  { label: 'facebook/react', shortLabel: 'react', value: 228_000 },
  { label: 'sveltejs/svelte', shortLabel: 'svelte', value: 81_500 },
]

describe('MagnitudeBarChart', () => {
  it('ships the numbers as a table, largest first', () => {
    renderChart(<MagnitudeBarChart data={repos} skipAnimation />)

    const table = screen.getByRole('table', { name: 'Stars per tracked repository' })

    expect(rowsOf(table)).toEqual([
      ['facebook/react', '228,000'],
      ['sveltejs/svelte', '81,500'],
      ['vuejs/core', '48,000'],
    ])
  })

  it('names the table after the title it was given', () => {
    renderChart(<MagnitudeBarChart data={repos} title="Popularity" skipAnimation />)

    expect(screen.getByRole('table', { name: 'Popularity' })).toBeTruthy()
  })

  it('sorts a copy, leaving the caller’s data alone', () => {
    const input = [...repos]

    renderChart(<MagnitudeBarChart data={input} skipAnimation />)

    expect(input.map((datum) => datum.label)).toEqual([
      'vuejs/core',
      'facebook/react',
      'sveltejs/svelte',
    ])
  })

  it('invites the user to track something rather than drawing an empty chart', () => {
    renderChart(<MagnitudeBarChart data={[]} />)

    expect(
      screen.getByText('Track a repository to see how its stars compare.'),
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('reserves height for the repositories still resolving, so later rows do not shift the page', () => {
    const { container } = renderChart(<MagnitudeBarChart data={[]} minRows={3} skipAnimation />)

    expect(getComputedStyle(container.firstChild as HTMLElement).minHeight).toBe('174px')
  })

  /**
   * The short label exists because 168px of axis does not fit on a phone. The
   * table has no such constraint, and `react` on its own is ambiguous when two
   * owners share a repository name.
   */
  it('keeps full repository names in the table on a narrow screen', () => {
    useNarrowViewport()

    renderChart(<MagnitudeBarChart data={repos} skipAnimation />)

    const table = screen.getByRole('table', { name: 'Stars per tracked repository' })

    expect(rowsOf(table).map(([name]) => name)).toEqual([
      'facebook/react',
      'sveltejs/svelte',
      'vuejs/core',
    ])
  })
})

describe('StalenessBarChart', () => {
  const days = (entries: Array<[string, number]>): BarDatum[] =>
    entries.map(([label, value]) => ({ label, value }))

  it('lists the freshest repository first', () => {
    renderChart(
      <StalenessBarChart
        data={days([
          ['old/repo', 500],
          ['new/repo', 2],
          ['mid/repo', 90],
        ])}
        skipAnimation
      />,
    )

    const table = screen.getByRole('table', { name: 'Days since last commit' })

    expect(rowsOf(table)).toEqual([
      ['new/repo', '2 days', 'Active'],
      ['mid/repo', '90 days', 'Quiet'],
      ['old/repo', '500 days', 'Stale'],
    ])
  })

  it.each([
    [0, 'Active'],
    [30, 'Active'],
    [31, 'Quiet'],
    [365, 'Quiet'],
    [366, 'Stale'],
  ])('bands %i days as %s', (value, band) => {
    renderChart(<StalenessBarChart data={days([['a/b', value]])} skipAnimation />)

    const [row] = rowsOf(screen.getByRole('table'))
    expect(row?.at(-1)).toBe(band)
  })

  it('honours custom thresholds', () => {
    renderChart(
      <StalenessBarChart
        data={days([['a/b', 10]])}
        thresholds={{ active: 5, quiet: 20 }}
        skipAnimation
      />,
    )

    const [row] = rowsOf(screen.getByRole('table'))
    expect(row?.at(-1)).toBe('Quiet')
  })

  it('says “1 day” rather than “1 days”', () => {
    renderChart(<StalenessBarChart data={days([['a/b', 1]])} skipAnimation />)

    const [row] = rowsOf(screen.getByRole('table'))
    expect(row?.[1]).toBe('1 day')
  })

  it('invites the user to track something rather than drawing an empty chart', () => {
    renderChart(<StalenessBarChart data={[]} />)

    expect(
      screen.getByText('Track a repository to see how recently it was active.'),
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('reserves height for the repositories still resolving', () => {
    const { container } = renderChart(<StalenessBarChart data={[]} minRows={4} />)

    const placeholder = container.firstChild as HTMLElement
    expect(getComputedStyle(placeholder).minHeight).toBe('208px')
  })

  it('keeps full repository names in the table on a narrow screen', () => {
    useNarrowViewport()

    renderChart(
      <StalenessBarChart
        data={[
          { label: 'facebook/react', shortLabel: 'react', value: 3 },
          { label: 'vuejs/core', shortLabel: 'core', value: 40 },
        ]}
        skipAnimation
      />,
    )

    expect(rowsOf(screen.getByRole('table')).map(([name]) => name)).toEqual([
      'facebook/react',
      'vuejs/core',
    ])
  })
})

describe('CategoryBarChart', () => {
  const languages: BarDatum[] = [
    { label: 'TypeScript', value: 4 },
    { label: 'Rust', value: 2 },
    { label: 'Go', value: 1 },
    { label: 'Zig', value: 1 },
  ]

  it('tabulates repositories per category, most common first', () => {
    renderChart(<CategoryBarChart data={languages} colors={['#111']} skipAnimation />)

    const table = screen.getByRole('table', { name: 'By category' })

    expect(rowsOf(table)).toEqual([
      ['TypeScript', '4'],
      ['Rust', '2'],
      ['Go', '1'],
      ['Zig', '1'],
    ])
  })

  it('folds the tail into a single “Other” row that keeps the total', () => {
    renderChart(
      <CategoryBarChart
        data={languages}
        colors={['#111', '#222']}
        maxSlots={2}
        skipAnimation
      />,
    )

    expect(rowsOf(screen.getByRole('table'))).toEqual([
      ['TypeScript', '4'],
      ['Rust', '2'],
      ['Other', '2'],
    ])
  })

  it('adds no “Other” row when everything fits', () => {
    renderChart(
      <CategoryBarChart data={languages} colors={[]} maxSlots={4} skipAnimation />,
    )

    expect(rowsOf(screen.getByRole('table')).map(([name]) => name)).not.toContain('Other')
  })

  it('renders nothing when there is no data', () => {
    const { container } = renderChart(<CategoryBarChart data={[]} colors={[]} />)

    expect(container.querySelector('figure')).toBeNull()
  })
})

describe('ShareBar', () => {
  const shares: BarDatum[] = [
    { label: 'TypeScript', value: 6 },
    { label: 'Rust', value: 3 },
    { label: 'Go', value: 1 },
  ]

  it('states each share as a whole-number percentage', () => {
    renderChart(<ShareBar data={shares} colors={['#111', '#222', '#333']} />)

    expect(rowsOf(screen.getByRole('table', { name: 'Composition' }))).toEqual([
      ['TypeScript', '6', '60%'],
      ['Rust', '3', '30%'],
      ['Go', '1', '10%'],
    ])
  })

  it('folds the tail into “Other” and still sums to the whole', () => {
    renderChart(<ShareBar data={shares} colors={['#111']} maxSlots={1} />)

    expect(rowsOf(screen.getByRole('table'))).toEqual([
      ['TypeScript', '6', '60%'],
      ['Other', '4', '40%'],
    ])
  })

  it('hides the drawn bar and legend, leaving the table as the one description', () => {
    const { container } = renderChart(<ShareBar data={shares} colors={['#111']} />)

    const drawn = container.querySelectorAll('[aria-hidden="true"]')

    expect(drawn.length).toBe(2)
    expect(screen.getAllByRole('table')).toHaveLength(1)
  })

  it.each([
    ['no data', []],
    ['a zero total', [{ label: 'Nothing', value: 0 }]],
  ])('renders nothing for %s', (_name, data) => {
    const { container } = renderChart(<ShareBar data={data} colors={[]} />)

    expect(container.querySelector('figure')).toBeNull()
  })
})
