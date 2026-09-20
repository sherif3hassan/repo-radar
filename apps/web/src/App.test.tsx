import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { renderWithProviders } from './test/renderWithProviders'

/**
 * A composition smoke test, plus the page-level accessibility structure that
 * is easy to break and invisible until someone uses a screen reader.
 */
describe('App shell', () => {
  const primaryNav = () => within(screen.getByRole('navigation', { name: 'Primary' }))

  it('renders the brand and navigation', () => {
    renderWithProviders(<App />)

    expect(screen.getByText('Repo Radar')).toBeInTheDocument()
    expect(primaryNav().getByRole('link', { name: 'Search' })).toBeInTheDocument()
    expect(primaryNav().getByRole('link', { name: 'Tracked' })).toBeInTheDocument()
  })

  it('redirects the index route to search', () => {
    renderWithProviders(<App />)

    expect(primaryNav().getByRole('link', { name: 'Search' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(primaryNav().getByRole('link', { name: 'Tracked' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  /**
   * Navigation between pages is a landmark of links, not a tablist: tabs switch
   * panels within one page, so announcing these as tabs would mislead a screen
   * reader user about what activating them does.
   */
  it('exposes navigation as a labelled landmark, not a tablist', () => {
    renderWithProviders(<App />)

    expect(screen.getAllByRole('navigation')).toHaveLength(1)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
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
})
