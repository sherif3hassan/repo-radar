import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { makeStore } from '../../app/store'
import { rawCommits, rawRepo } from '../../test/msw/fixtures'
import { server } from '../../test/msw/server'
import { renderWithProviders } from '../../test/renderWithProviders'
import { TrackedPage } from './TrackedPage'

const storeWith = (ids: string[]) => makeStore({ tracked: { ids } })

/**
 * A row's accessible name is its cells' text joined, so match on a fragment.
 * jsdom has no matchMedia, so `useMediaQuery` is false and the table renders —
 * the stacked variant is covered separately below.
 */
const nameOf = (fullName: string) => new RegExp(fullName.replace('/', '\\/'))

/**
 * Scoped to the tracked table on purpose: the chart renders its own
 * visually-hidden data table for screen readers, so an unscoped row query
 * matches both.
 */
const trackedTable = () => within(screen.getByRole('table', { name: 'Tracked repositories' }))
const findRepo = (fullName: string) => trackedTable().findByRole('row', { name: nameOf(fullName) })
const getRepo = (fullName: string) => trackedTable().getByRole('row', { name: nameOf(fullName) })

const originalMatchMedia = window.matchMedia

/** Forces `useMediaQuery` to report a narrow viewport. */
const setNarrowViewport = () => {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('TrackedPage', () => {
  it('invites a search when nothing is tracked', () => {
    renderWithProviders(<TrackedPage />, { store: storeWith([]) })

    expect(screen.getByText('Nothing tracked yet')).toBeInTheDocument()
  })

  it('renders a row per tracked repository', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react', 'vuejs/core']) })

    expect(await findRepo('facebook/react')).toBeInTheDocument()
    expect(getRepo('vuejs/core')).toBeInTheDocument()
    expect(screen.getByText('2 tracked repositories')).toBeInTheDocument()
  })

  // A real table, so the columns are announced rather than implied by position.
  it('gives the table column headers', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    await findRepo('facebook/react')
    for (const header of ['Repository', 'Stars', 'Issues', 'Last commit', 'Actions']) {
      // Scoped: the chart's accessible table has a "Stars" header too.
      expect(trackedTable().getByRole('columnheader', { name: header })).toBeInTheDocument()
    }
  })

  it('shows stars and last commit', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const row = await findRepo('facebook/react')
    expect(await within(row).findByText('228K')).toBeInTheDocument()
  })

  /**
   * GitHub's `open_issues_count` counts pull requests as issues. The fixture
   * reports 950 with 50 open PRs, so the row must show 900.
   */
  it('excludes pull requests from the open issue count', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const row = await findRepo('facebook/react')
    expect(await within(row).findByText('900')).toBeInTheDocument()
    expect(within(row).queryByText('950')).not.toBeInTheDocument()
  })

  // Colour must never be the only signal, so freshness is also spelled out.
  it('labels commit freshness in text, not only colour', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const row = await findRepo('facebook/react')
    expect(await within(row).findByText('Active')).toBeInTheDocument()
  })

  /**
   * The requirement this whole design exists for: each row owns its own cache
   * entry, so one repository failing must leave its neighbours untouched.
   */
  it('keeps loading and error state independent per repository', async () => {
    server.use(
      http.get('https://api.github.com/repos/ghost/missing', () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
      http.get('https://api.github.com/repos/ghost/missing/commits', () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
      http.get('https://api.github.com/repos/ghost/missing/pulls', () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
    )

    renderWithProviders(<TrackedPage />, {
      store: storeWith(['ghost/missing', 'facebook/react']),
    })

    expect(
      await within(await findRepo('ghost/missing')).findByText('Repository not found'),
    ).toBeInTheDocument()

    const healthy = await findRepo('facebook/react')
    expect(await within(healthy).findByText('228K')).toBeInTheDocument()
    expect(within(healthy).queryByText('Repository not found')).not.toBeInTheDocument()
  })

  it('refreshes a single repository without touching the others', async () => {
    const calls: string[] = []
    server.use(
      http.get('https://api.github.com/repos/:owner/:name', ({ params }) => {
        const fullName = `${String(params.owner)}/${String(params.name)}`
        calls.push(fullName)
        return HttpResponse.json(rawRepo({ full_name: fullName, name: params.name }))
      }),
      http.get('https://api.github.com/repos/:owner/:name/commits', () =>
        HttpResponse.json(rawCommits()),
      ),
    )

    const { user } = renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react', 'vuejs/core']),
    })

    await findRepo('facebook/react')
    await waitFor(() => expect(calls).toHaveLength(2))
    calls.length = 0

    await user.click(screen.getByRole('button', { name: 'Refresh facebook/react' }))

    await waitFor(() => expect(calls).toEqual(['facebook/react']))
  })

  it('refreshes every tracked repository from one control', async () => {
    const calls: string[] = []
    server.use(
      http.get('https://api.github.com/repos/:owner/:name', ({ params }) => {
        const fullName = `${String(params.owner)}/${String(params.name)}`
        calls.push(fullName)
        return HttpResponse.json(rawRepo({ full_name: fullName, name: params.name }))
      }),
      http.get('https://api.github.com/repos/:owner/:name/commits', () =>
        HttpResponse.json(rawCommits()),
      ),
    )

    const { user } = renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react', 'vuejs/core']),
    })

    await findRepo('facebook/react')
    await waitFor(() => expect(calls).toHaveLength(2))
    calls.length = 0

    await user.click(screen.getByRole('button', { name: 'Refresh all' }))

    await waitFor(() => expect(calls.toSorted()).toEqual(['facebook/react', 'vuejs/core']))
  })

  it('charts stars once repositories have resolved', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react', 'vuejs/core']) })

    expect(
      await screen.findByRole('table', { name: 'Stars per tracked repository' }),
    ).toBeInTheDocument()
  })

  /**
   * The chart is an SVG, which conveys nothing to a screen reader. It ships a
   * data table as its accessible equivalent, carrying the real numbers.
   */
  it('gives the chart a readable equivalent', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const chart = within(await screen.findByRole('table', { name: 'Stars per tracked repository' }))
    expect(chart.getByRole('columnheader', { name: 'Stars' })).toBeInTheDocument()
    expect(chart.getByRole('rowheader', { name: 'facebook/react' })).toBeInTheDocument()
    expect(chart.getByText('228,000')).toBeInTheDocument()
  })

  /**
   * Separate views rather than separate axes. Stars, issues, days and language
   * counts have unrelated magnitudes and meanings; sharing scales would invent
   * crossover points that say nothing about the data.
   */
  it.each([
    ['Issues', 'Open issues per tracked repository'],
    ['Activity', 'Days since last commit'],
    ['Languages', 'Repositories by language'],
  ])('switches to the %s view', async (tab, tableName) => {
    const { user } = renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react']),
    })

    await screen.findByRole('table', { name: 'Stars per tracked repository' })
    await user.click(screen.getByRole('tab', { name: tab }))

    expect(await screen.findByRole('table', { name: tableName })).toBeInTheDocument()
  })

  /** Only one chart is mounted at a time, so the others are genuinely gone. */
  it('shows one chart at a time', async () => {
    const { user } = renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react']),
    })

    await screen.findByRole('table', { name: 'Stars per tracked repository' })
    await user.click(screen.getByRole('tab', { name: 'Activity' }))

    expect(
      screen.queryByRole('table', { name: 'Stars per tracked repository' }),
    ).not.toBeInTheDocument()
  })

  it('states commit activity in text, not only bar colour', async () => {
    const { user } = renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react']),
    })

    await screen.findByRole('table', { name: 'Stars per tracked repository' })
    await user.click(screen.getByRole('tab', { name: 'Activity' }))

    const staleness = within(await screen.findByRole('table', { name: 'Days since last commit' }))
    expect(staleness.getByRole('columnheader', { name: 'Activity' })).toBeInTheDocument()
    expect(staleness.getByRole('rowheader', { name: 'facebook/react' })).toBeInTheDocument()
  })

  it('does not show the chart before any repository has resolved', () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    expect(
      screen.queryByRole('table', { name: 'Stars per tracked repository' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/see how its stars compare/)).not.toBeInTheDocument()
  })

  it('untracks a repository', async () => {
    const { user, store } = renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react', 'vuejs/core']),
    })

    await findRepo('facebook/react')
    await user.click(screen.getByRole('button', { name: 'Stop tracking facebook/react' }))

    expect(store.getState().tracked.ids).toEqual(['vuejs/core'])
    await waitFor(() =>
      expect(trackedTable().queryByRole('row', { name: nameOf('facebook/react') })).not.toBeInTheDocument(),
    )
  })

  // Below the breakpoint there are no columns worth comparing, so each
  // repository becomes its own card.
  describe('narrow viewport', () => {
    it('stacks repositories as cards instead of table rows', async () => {
      setNarrowViewport()

      renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

      expect(await screen.findByRole('article', { name: 'facebook/react' })).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })
})
