import Button from '@mui/material/Button'
import { ErrorState } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'ui/ErrorState',
  component: ErrorState,
  args: { onRetry: () => {} },
} satisfies Meta<typeof ErrorState>

export default meta
type Story = StoryObj<typeof meta>

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

export const RateLimitedWithToken: Story = {
  args: {
    error: {
      kind: 'rate-limit',
      resetAt: new Date(Date.now() + 12 * 60_000).toISOString(),
      authenticated: true,
    },
  },
}

export const SecondaryLimit: Story = {
  args: {
    error: {
      kind: 'rate-limit',
      resetAt: new Date(Date.now() + 60_000).toISOString(),
      authenticated: true,
      secondary: true,
    },
  },
}

export const Unauthorized: Story = {
  args: { error: { kind: 'unauthorized' }, onRetry: undefined },
}

export const NotFound: Story = {
  args: { error: { kind: 'not-found' } },
}

export const Network: Story = {
  args: { error: { kind: 'network' } },
}

export const InvalidQuery: Story = {
  args: {
    error: {
      kind: 'invalid-query',
      message: 'None of the search qualifiers apply to this search type.',
    },
    onRetry: undefined,
  },
}

export const ParseFailure: Story = {
  args: {
    error: {
      kind: 'parse',
      issues: 'items.0.stargazers_count: expected number, received string',
    },
  },
}

export const Unknown: Story = {
  args: { error: { kind: 'unknown', status: 500 } },
}

export const Dense: Story = {
  args: { error: { kind: 'not-found' }, dense: true },
}
