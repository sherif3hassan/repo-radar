import Button from '@mui/material/Button'
import { ErrorState } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Every branch of `GithubError`.
 *
 * Reaching these in the running app means exhausting a real rate limit or
 * pulling the network cable. Here they are one click apart, which is most of
 * why this package is worth having.
 */
const meta = {
  title: 'ui/ErrorState',
  component: ErrorState,
  args: { onRetry: () => {} },
} satisfies Meta<typeof ErrorState>

export default meta
type Story = StoryObj<typeof meta>

/** The failure users actually hit: 60 requests/hour unauthenticated. */
export const RateLimited: Story = {
  args: {
    error: {
      kind: 'rate-limit',
      resetAt: new Date(Date.now() + 41 * 60_000).toISOString(),
      authenticated: false,
    },
    action: (
      <Button color="inherit" size="small">
        Add token
      </Button>
    ),
  },
}

/** With a token the advice changes — there is nothing left to suggest. */
export const RateLimitedWithToken: Story = {
  args: {
    error: {
      kind: 'rate-limit',
      resetAt: new Date(Date.now() + 12 * 60_000).toISOString(),
      authenticated: true,
    },
  },
}

export const NotFound: Story = {
  args: { error: { kind: 'not-found' } },
}

export const Network: Story = {
  args: { error: { kind: 'network' } },
}

/** GitHub's own message names the offending qualifier. */
export const InvalidQuery: Story = {
  args: {
    error: {
      kind: 'invalid-query',
      message: 'None of the search qualifiers apply to this search type.',
    },
    onRetry: undefined,
  },
}

/** A schema mismatch surfaces here rather than as `undefined` in a component. */
export const ParseFailure: Story = {
  args: {
    error: { kind: 'parse', issues: 'items.0.stargazers_count: expected number, received string' },
  },
}

export const Unknown: Story = {
  args: { error: { kind: 'unknown', status: 500 } },
}

/** The compact form used inside a single repository row. */
export const Dense: Story = {
  args: { error: { kind: 'not-found' }, dense: true },
}
