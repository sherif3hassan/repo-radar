import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GithubError } from '@repo-radar/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorState } from './ErrorState'

beforeEach(() => {
  vi.setSystemTime(new Date('2026-09-20T12:00:00Z'))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('ErrorState', () => {
  it.each<[GithubError, string]>([
    [
      {
        kind: 'rate-limit',
        resetAt: new Date(Date.now() + 60_000).toISOString(),
        authenticated: false,
      },
      'GitHub rate limit reached',
    ],
    [
      {
        kind: 'rate-limit',
        resetAt: new Date(Date.now() + 60_000).toISOString(),
        authenticated: true,
        secondary: true,
      },
      'GitHub asked us to slow down',
    ],
    [{ kind: 'unauthorized' }, 'GitHub rejected your token'],
    [{ kind: 'not-found' }, 'Repository not found'],
    [
      { kind: 'invalid-query', message: 'bad qualifier' },
      'GitHub could not run that search',
    ],
    [{ kind: 'network' }, 'Could not reach GitHub'],
    [{ kind: 'parse', issues: 'bad shape' }, 'Unexpected response from GitHub'],
    [{ kind: 'unknown' }, 'Something went wrong'],
  ])('describes a %o error', (error, title) => {
    render(<ErrorState error={error} />)

    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('names the offending qualifier for a rejected search, verbatim', () => {
    render(
      <ErrorState error={{ kind: 'invalid-query', message: 'is:open is invalid' }} />,
    )

    expect(screen.getByText('is:open is invalid')).toBeInTheDocument()
  })

  it('tells a primary limit from a secondary one, since the advice differs', () => {
    const resetAt = new Date(Date.now() + 60_000).toISOString()

    render(
      <ErrorState
        error={{ kind: 'rate-limit', resetAt, authenticated: false, secondary: true }}
      />,
    )

    expect(screen.getByText(/Too many requests at once/)).toBeInTheDocument()
    expect(screen.queryByText(/60 per hour/)).not.toBeInTheDocument()
  })

  it('offers to raise the limit only when unauthenticated', () => {
    const resetAt = new Date(Date.now() + 60_000).toISOString()

    const { rerender } = render(
      <ErrorState error={{ kind: 'rate-limit', resetAt, authenticated: false }} />,
    )
    expect(screen.getByText(/personal access token/)).toBeInTheDocument()

    rerender(<ErrorState error={{ kind: 'rate-limit', resetAt, authenticated: true }} />)
    expect(screen.queryByText(/personal access token/)).not.toBeInTheDocument()
  })

  it('calls onRetry when the retry action is activated', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<ErrorState error={{ kind: 'network' }} onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('omits the retry action when none is given', () => {
    render(<ErrorState error={{ kind: 'network' }} />)

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })

  /**
   * `dense` used to swap content for a shorter message, dropping the reset time
   * and the token remedy from every tracked-card error. It must only tighten
   * spacing.
   */
  it('keeps the same guidance in dense mode, only tighter', () => {
    const resetAt = new Date(Date.now() + 60_000).toISOString()
    const error: GithubError = { kind: 'rate-limit', resetAt, authenticated: false }

    render(<ErrorState error={error} />)
    const full = screen.getByRole('alert').textContent ?? ''
    cleanup()

    render(<ErrorState error={error} dense />)
    const dense = screen.getByRole('alert').textContent ?? ''

    expect(dense).toContain('personal access token')
    expect(dense).toContain('GitHub rate limit reached')
    expect(dense).toContain(full.replace('GitHub rate limit reached', '').trim())
  })
})
