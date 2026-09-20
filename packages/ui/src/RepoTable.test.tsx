import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { RepoTable, RepoTableRow } from './RepoTable'

afterEach(cleanup)

describe('RepoTable', () => {
  it('is a real table with columns announced by th[scope]', () => {
    render(
      <RepoTable>
        <RepoTableRow
          fullName="facebook/react"
          stats={{
            stars: 228_000,
            openIssues: 1_200,
            openPullRequests: 400,
            lastCommitAt: '2026-09-19T00:00:00Z',
          }}
        />
      </RepoTable>,
    )

    const table = screen.getByRole('table', { name: 'Tracked repositories' })
    const headers = within(table).getAllByRole('columnheader')

    expect(headers.map((h) => h.textContent)).toEqual([
      'Repository',
      'Stars',
      'Issues',
      'Last commit',
      'Actions',
    ])
  })

  /**
   * A failed row must replace only its own stats. The regression this guards
   * against would let one dead repository blank the whole table.
   */
  it('replaces only the failed row’s cells with an error, leaving the row header', () => {
    render(
      <RepoTable>
        <RepoTableRow fullName="facebook/react" error={{ kind: 'not-found' }} />
        <RepoTableRow
          fullName="vuejs/core"
          stats={{
            stars: 48_000,
            openIssues: 300,
            openPullRequests: 50,
            lastCommitAt: '2026-09-19T00:00:00Z',
          }}
        />
      </RepoTable>,
    )

    expect(screen.getByText('Repository not found')).toBeInTheDocument()
    expect(screen.getByText('facebook/react')).toBeInTheDocument()
    expect(screen.getByText('48K')).toBeInTheDocument()
  })

  it('labels commit freshness in text, not colour alone', () => {
    render(
      <RepoTable>
        <RepoTableRow
          fullName="facebook/react"
          stats={{
            stars: 1,
            openIssues: 1,
            openPullRequests: 0,
            lastCommitAt: new Date().toISOString(),
          }}
        />
      </RepoTable>,
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('labels an unknown last-commit date rather than leaving it blank', () => {
    render(
      <RepoTable>
        <RepoTableRow
          fullName="facebook/react"
          stats={{ stars: 1, openIssues: 1, openPullRequests: 0, lastCommitAt: null }}
        />
      </RepoTable>,
    )

    expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0)
  })
})
