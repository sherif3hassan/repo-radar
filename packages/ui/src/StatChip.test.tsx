import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { StatChip } from './StatChip'
import { StatTile } from './StatTile'

afterEach(cleanup)

describe('StatChip', () => {
  it('renders the label', () => {
    render(<StatChip label="1.2K" />)

    expect(screen.getByText('1.2K')).toBeInTheDocument()
  })

  /**
   * MUI never adds `tabIndex` to a Tooltip's child, so a bare `<span>` cannot
   * be reached by keyboard. A hint that changes what the number means — such
   * as "Excludes N open pull requests" — must not be mouse-only.
   */
  it('is keyboard-focusable and described when it carries a hint', () => {
    render(<StatChip label="1.2K" hint="Excludes 400 open pull requests" />)

    const chip = screen.getByText('1.2K').closest('[tabindex]')
    expect(chip).toHaveAttribute('tabindex', '0')
    expect(screen.getByText('Excludes 400 open pull requests')).toBeInTheDocument()
  })

  it('is not focusable without a hint, since there is nothing to announce', () => {
    render(<StatChip label="1.2K" />)

    expect(screen.getByText('1.2K').closest('[tabindex]')).not.toBeInTheDocument()
  })
})

describe('StatTile', () => {
  it('renders the label and value', () => {
    render(<StatTile label="Stars" value="228K" />)

    expect(screen.getByText('Stars')).toBeInTheDocument()
    expect(screen.getByText('228K')).toBeInTheDocument()
  })

  it('shows a placeholder rather than nothing when the value is null', () => {
    render(<StatTile label="Stars" value={null} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('is keyboard-focusable and described when it carries a hint', () => {
    render(
      <StatTile
        label="Open issues"
        value="1.2K"
        hint="Excludes 400 open pull requests"
      />,
    )

    const tile = screen.getByText('Open issues').closest('[tabindex]')
    expect(tile).toHaveAttribute('tabindex', '0')
    expect(screen.getByText('Excludes 400 open pull requests')).toBeInTheDocument()
  })

  it('is not focusable without a hint', () => {
    render(<StatTile label="Stars" value="228K" />)

    expect(screen.getByText('Stars').closest('[tabindex]')).not.toBeInTheDocument()
  })
})
