import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { loadPersistedState } from '../../app/persistence'
import { makeStore } from '../../app/store'
import { RATE_LIMIT_HEADERS } from '../../test/msw/fixtures'
import { server } from '../../test/msw/server'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SearchPage } from './SearchPage'

const SEARCH_URL = 'https://api.github.com/search/repositories'

describe('SearchPage', () => {
  it('prompts before the term is long enough to search', () => {
    renderWithProviders(<SearchPage />)

    expect(screen.getByText('Search for a repository')).toBeInTheDocument()
  })

  it('reads the initial term from the URL and shows results', async () => {
    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('facebook/react')).toBeInTheDocument()
    expect(screen.getByText('228K')).toBeInTheDocument()
  })

  it('debounces typing into a single request', async () => {
    const requests: string[] = []
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requests.push(new URL(request.url).searchParams.get('q') ?? '')
        return HttpResponse.json({ total_count: 0, incomplete_results: false, items: [] })
      }),
    )

    const { user } = renderWithProviders(<SearchPage />)
    await user.type(screen.getByLabelText('Search GitHub repositories'), 'react')

    await waitFor(() => expect(requests.length).toBeGreaterThan(0))
    await waitFor(() =>
      expect(screen.getByText('No repositories matched')).toBeInTheDocument(),
    )
    expect(requests).toEqual(['react'])
  })

  it('does not request for a term below the minimum length', async () => {
    let called = false
    server.use(
      http.get(SEARCH_URL, () => {
        called = true
        return HttpResponse.json({ total_count: 0, incomplete_results: false, items: [] })
      }),
    )

    const { user } = renderWithProviders(<SearchPage />)
    await user.type(screen.getByLabelText('Search GitHub repositories'), 'r')

    await waitFor(() =>
      expect(screen.getByText('Search for a repository')).toBeInTheDocument(),
    )
    expect(called).toBe(false)
  })

  it('reports an empty result set distinctly from an error', async () => {
    renderWithProviders(<SearchPage />, { route: '/search?q=nothing' })

    expect(await screen.findByText('No repositories matched')).toBeInTheDocument()
  })

  it('renders a rate-limit error with guidance', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json(
          { message: 'rate limited' },
          { status: 403, headers: RATE_LIMIT_HEADERS },
        ),
      ),
    )

    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('GitHub rate limit reached')).toBeInTheDocument()
    expect(screen.getByText(/60 per hour/)).toBeInTheDocument()
    expect(screen.getByText(/personal access token/)).toBeInTheDocument()
  })

  it('tells the user when GitHub rejects their token', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json({ message: 'Bad credentials' }, { status: 401 }),
      ),
    )

    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('GitHub rejected your token')).toBeInTheDocument()
    expect(screen.getByText(/Replace or remove it in Settings/)).toBeInTheDocument()
  })

  it('distinguishes a burst throttle from an exhausted quota', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json(
          { message: 'You have exceeded a secondary rate limit.' },
          { status: 403, headers: { 'retry-after': '30' } },
        ),
      ),
    )

    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('GitHub asked us to slow down')).toBeInTheDocument()
    expect(screen.getByText(/hourly quota is intact/)).toBeInTheDocument()
  })

  it('renders a network failure with a retry', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.error()))

    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('Could not reach GitHub')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('surfaces GitHub’s explanation for an invalid query', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json(
          {
            message: 'Validation Failed',
            errors: [
              { message: 'None of the search qualifiers apply to this search type.' },
            ],
          },
          { status: 422 },
        ),
      ),
    )

    renderWithProviders(<SearchPage />, { route: '/search?q=type:issue react' })

    expect(
      await screen.findByText('GitHub could not run that search'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('None of the search qualifiers apply to this search type.'),
    ).toBeInTheDocument()
  })

  it('surfaces a malformed response as a parse error', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json({ total_count: 'lots', incomplete_results: false, items: [] }),
      ),
    )

    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('Unexpected response from GitHub')).toBeInTheDocument()
  })
})

describe('tracking from search results', () => {
  const RESULTS_ROUTE = '/search?q=react'

  it('tracks a repository and reflects it on the button and in the store', async () => {
    const { user, store } = renderWithProviders(<SearchPage />, { route: RESULTS_ROUTE })

    await user.click(await screen.findByRole('button', { name: 'Track facebook/react' }))

    const button = screen.getByRole('button', { name: 'Stop tracking facebook/react' })
    expect(button).toHaveTextContent('Tracked')
    expect(store.getState().tracked.ids).toEqual(['facebook/react'])
  })

  it('stops tracking on the second click', async () => {
    const { user, store } = renderWithProviders(<SearchPage />, { route: RESULTS_ROUTE })

    await user.click(await screen.findByRole('button', { name: 'Track facebook/react' }))
    await user.click(screen.getByRole('button', { name: 'Stop tracking facebook/react' }))

    expect(
      screen.getByRole('button', { name: 'Track facebook/react' }),
    ).toHaveTextContent('Track')
    expect(store.getState().tracked.ids).toEqual([])
  })

  it('shows a repository that was already tracked as tracked', async () => {
    renderWithProviders(<SearchPage />, {
      route: RESULTS_ROUTE,
      store: makeStore({ tracked: { ids: ['facebook/react'] } }),
    })

    expect(
      await screen.findByRole('button', { name: 'Stop tracking facebook/react' }),
    ).toBeInTheDocument()
  })

  it('remembers the tracked repository across a reload', async () => {
    const { user } = renderWithProviders(<SearchPage />, { route: RESULTS_ROUTE })

    await user.click(await screen.findByRole('button', { name: 'Track facebook/react' }))

    await waitFor(() =>
      expect(loadPersistedState()?.trackedIds).toEqual(['facebook/react']),
    )
  })
})
