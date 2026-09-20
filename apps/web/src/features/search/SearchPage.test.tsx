import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

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
    // Five keystrokes, one request — not one per character.
    await waitFor(() => expect(screen.getByText('No repositories matched')).toBeInTheDocument())
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

    await waitFor(() => expect(screen.getByText('Search for a repository')).toBeInTheDocument())
    expect(called).toBe(false)
  })

  it('reports an empty result set distinctly from an error', async () => {
    renderWithProviders(<SearchPage />, { route: '/search?q=nothing' })

    expect(await screen.findByText('No repositories matched')).toBeInTheDocument()
  })

  // The failure users actually hit. It must name the limit and the reset, not
  // render a generic red box.
  it('renders a rate-limit error with guidance', async () => {
    server.use(
      http.get(SEARCH_URL, () =>
        HttpResponse.json({ message: 'rate limited' }, { status: 403, headers: RATE_LIMIT_HEADERS }),
      ),
    )

    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('GitHub rate limit reached')).toBeInTheDocument()
    expect(screen.getByText(/60 per hour/)).toBeInTheDocument()
    expect(screen.getByText(/personal access token/)).toBeInTheDocument()
  })

  it('renders a network failure with a retry', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.error()))

    renderWithProviders(<SearchPage />, { route: '/search?q=react' })

    expect(await screen.findByText('Could not reach GitHub')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  // "GitHub responded with 422" is useless; its body names the problem.
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

    expect(await screen.findByText('GitHub could not run that search')).toBeInTheDocument()
    expect(
      screen.getByText('None of the search qualifiers apply to this search type.'),
    ).toBeInTheDocument()
  })

  // A schema mismatch must surface here, not as `undefined` inside a component.
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
