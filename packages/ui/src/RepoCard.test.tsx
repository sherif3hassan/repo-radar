import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { RepoCard, type RepoCardStats } from './RepoCard'

afterEach(cleanup)

const stats: RepoCardStats = {
  stars: 228_000,
  openIssues: 1_200,
  openPullRequests: 400,
  lastCommitAt: '2026-09-19T00:00:00Z',
}

describe('RepoCard', () => {
  it('renders the repository stats', () => {
    render(<RepoCard fullName="facebook/react" stats={stats} />)

    expect(screen.getByRole('article', { name: 'facebook/react' })).toBeInTheDocument()
    expect(screen.getByText('228K')).toBeInTheDocument()
    expect(screen.getByText('1.2K')).toBeInTheDocument()
  })

  it('renders an error in place of stats, and keeps the retry action reachable', () => {
    render(
      <RepoCard
        fullName="facebook/react"
        error={{ kind: 'not-found' }}
        onRetry={() => {}}
      />,
    )

    expect(screen.getByText('Repository not found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.queryByText('Stars')).not.toBeInTheDocument()
  })

  it('shows loading placeholders instead of stats while loading', () => {
    render(<RepoCard fullName="facebook/react" loading />)

    expect(screen.queryByText('228K')).not.toBeInTheDocument()
  })

  /**
   * The skeleton-to-stats swap is React replacing one DOM node with another,
   * not a style change on a node that persists — a `transition` cannot
   * animate that, only a mount-time `animation` can. This is the moment a
   * tracked repository's numbers actually arrive, so it is the one place in
   * the card worth confirming settles in rather than snapping.
   *
   * Asserted against the injected stylesheet rather than `getComputedStyle`:
   * jsdom's CSS engine does not resolve the `display: contents` + child
   * combinator this relies on to keep the stat chips in the parent's flex
   * row (verified against real Chrome via the `RepoCard` Storybook story
   * instead — computed `animationName` came back correctly set there).
   */
  it('animates the stats in when the loading skeleton resolves', () => {
    const { rerender } = render(<RepoCard fullName="facebook/react" loading />)

    rerender(<RepoCard fullName="facebook/react" stats={stats} />)

    const rules = Array.from(document.styleSheets).flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText)
      } catch {
        return []
      }
    })

    expect(
      rules.some((rule) => /animation:\s*animation-\w+ 240ms ease-out both/.test(rule)),
    ).toBe(true)
  })

  it('links the name to the repository when a URL is given', () => {
    render(
      <RepoCard
        fullName="facebook/react"
        htmlUrl="https://github.com/facebook/react"
        stats={stats}
      />,
    )

    expect(screen.getByRole('link', { name: 'facebook/react' })).toHaveAttribute(
      'href',
      'https://github.com/facebook/react',
    )
  })

  it('renders plain text, not a link, without a URL', () => {
    render(<RepoCard fullName="facebook/react" stats={stats} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('facebook/react')).toBeInTheDocument()
  })
})
