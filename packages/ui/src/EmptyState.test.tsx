import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { EmptyState } from './EmptyState'

afterEach(cleanup)

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No repositories matched" />)

    expect(screen.getByText('No repositories matched')).toBeInTheDocument()
  })

  it('renders the description when given one', () => {
    render(<EmptyState title="Nothing tracked" description="Search to add one." />)

    expect(screen.getByText('Search to add one.')).toBeInTheDocument()
  })

  it('renders no description when none is given', () => {
    const { container } = render(<EmptyState title="Nothing tracked" />)

    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('renders the action when given one', () => {
    render(<EmptyState title="Nothing tracked" action={<button>Search</button>} />)

    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })
})
