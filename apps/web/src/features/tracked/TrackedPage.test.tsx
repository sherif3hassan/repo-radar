import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { makeStore } from '../../app/store'
import { RATE_LIMIT_HEADERS, rawCommits, rawRepo } from '../../test/msw/fixtures'
import { server } from '../../test/msw/server'
import { renderWithProviders } from '../../test/renderWithProviders'
import { TrackedPage } from './TrackedPage'

const storeWith = (ids: string[]) => makeStore({ tracked: { ids } })

/** Every tracked repository renders as a card, named by its full repository name. */
const findRepo = (fullName: string) => screen.findByRole('article', { name: fullName })
const getRepo = (fullName: string) => screen.getByRole('article', { name: fullName })

const originalMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('TrackedPage', () => {
  it('invites a search when nothing is tracked', () => {
    renderWithProviders(<TrackedPage />, { store: storeWith([]) })

    expect(screen.getByText('Nothing tracked yet')).toBeInTheDocument()
  })

  it('renders a card per tracked repository', async () => {
    renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react', 'vuejs/core']),
    })

    expect(await findRepo('facebook/react')).toBeInTheDocument()
    expect(getRepo('vuejs/core')).toBeInTheDocument()
    expect(screen.getByText('2 tracked repositories')).toBeInTheDocument()
  })

  it('shows stars and last commit', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const card = await findRepo('facebook/react')
    expect(await within(card).findByText('228K')).toBeInTheDocument()
  })

  /**
   * GitHub's `open_issues_count` counts pull requests as issues. The fixture
   * reports 950 with 50 open PRs, so the card must show 900.
   */
  it('excludes pull requests from the open issue count', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const card = await findRepo('facebook/react')
    expect(await within(card).findByText('900')).toBeInTheDocument()
    expect(within(card).queryByText('950')).not.toBeInTheDocument()
  })

  it('labels commit freshness in text, not only colour', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const card = await findRepo('facebook/react')
    expect(await within(card).findByText('Active')).toBeInTheDocument()
  })

  /**
   * The compact error form used to swap its content for the title alone, so a
   * failed card lost the reset time and the token remedy that the search page
   * shows in full for the same error.
   */
  it('keeps the guidance on a failed card', async () => {
    server.use(
      http.get('https://api.github.com/repos/ghost/limited', () =>
        HttpResponse.json(
          { message: 'rate limited' },
          { status: 403, headers: RATE_LIMIT_HEADERS },
        ),
      ),
    )

    renderWithProviders(<TrackedPage />, { store: storeWith(['ghost/limited']) })

    const card = await findRepo('ghost/limited')
    expect(await within(card).findByText('GitHub rate limit reached')).toBeInTheDocument()
    expect(within(card).getByText(/60 per hour/)).toBeInTheDocument()
    expect(within(card).getByText(/personal access token/)).toBeInTheDocument()
  })

  /**
   * The requirement this whole design exists for: each card owns its own cache
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

    await waitFor(() =>
      expect(calls.toSorted()).toEqual(['facebook/react', 'vuejs/core']),
    )
  })

  it('charts stars once repositories have resolved', async () => {
    renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react', 'vuejs/core']),
    })

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

    const chart = within(
      await screen.findByRole('table', { name: 'Stars per tracked repository' }),
    )
    expect(chart.getByRole('columnheader', { name: 'Stars' })).toBeInTheDocument()
    expect(chart.getByRole('rowheader', { name: 'facebook/react' })).toBeInTheDocument()
    expect(chart.getByText('228,000')).toBeInTheDocument()
  })

  /**
   * Stars, issues and activity are permanent charts now — not tabs behind a
   * click — since only three dashboard-worthy measures remain once languages
   * moved to `SummaryCard`'s share bar.
   */
  it('charts issues alongside stars and activity', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    expect(
      await screen.findByRole('table', { name: 'Open issues per tracked repository' }),
    ).toBeInTheDocument()
  })

  it('states commit activity in text, not only bar colour', async () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    const staleness = within(
      await screen.findByRole('table', { name: 'Days since last commit' }),
    )
    expect(staleness.getByRole('columnheader', { name: 'Activity' })).toBeInTheDocument()
    expect(
      staleness.getByRole('rowheader', { name: 'facebook/react' }),
    ).toBeInTheDocument()
  })

  it('reserves the chart’s place before any repository has resolved, rather than popping it in', () => {
    renderWithProviders(<TrackedPage />, { store: storeWith(['facebook/react']) })

    expect(
      screen.queryByRole('table', { name: 'Stars per tracked repository' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/see how its stars compare/)).toBeInTheDocument()
  })

  it('untracks a repository', async () => {
    const { user, store } = renderWithProviders(<TrackedPage />, {
      store: storeWith(['facebook/react', 'vuejs/core']),
    })

    await findRepo('facebook/react')
    await user.click(screen.getByRole('button', { name: 'Stop tracking facebook/react' }))

    expect(store.getState().tracked.ids).toEqual(['vuejs/core'])
    await waitFor(() =>
      expect(screen.queryByRole('article', { name: 'facebook/react' })).not.toBeInTheDocument(),
    )
  })
})
