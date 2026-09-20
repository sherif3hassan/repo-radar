import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RouteErrorBoundary } from './RouteErrorBoundary'

function Boom(): never {
  throw new Error('kaboom')
}

describe('RouteErrorBoundary', () => {
  it('renders a reload action instead of unmounting the tree', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  it('renders children unchanged when nothing throws', () => {
    render(
      <RouteErrorBoundary>
        <p>All good</p>
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})
