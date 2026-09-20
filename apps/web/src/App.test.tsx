import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { renderWithProviders } from './test/renderWithProviders'

/**
 * A composition smoke test, plus the page-level accessibility structure that
 * is easy to break and invisible until someone uses a screen reader.
 */
describe('App shell', () => {
  it('renders the brand and navigation', () => {
    renderWithProviders(<App />)

    expect(screen.getByText('Repo Radar')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tracked' })).toBeInTheDocument()
  })

  it('redirects the index route to search', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('tab', { name: 'Search' })).toHaveAttribute('aria-selected', 'true')
  })

  /**
   * The brand repeats on every route, so it is site furniture rather than the
   * page's heading. Exactly one h1 should exist, and it should say where you
   * are.
   */
  it('gives the page a single h1 that is not the brand', () => {
    renderWithProviders(<App />)

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Search repositories')
  })

  it('offers a skip link to main content', () => {
    renderWithProviders(<App />)

    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveAttribute('href', '#main')
  })

  it('exposes a main landmark that the skip link targets', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })

  it('has exactly one tablist', () => {
    renderWithProviders(<App />)

    expect(screen.getAllByRole('tablist')).toHaveLength(1)
  })
})
