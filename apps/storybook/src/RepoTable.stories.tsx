import IconButton from '@mui/material/IconButton'
import { Icon, RepoTable, RepoTableRow } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

const actions = (
  <>
    <IconButton size="small" aria-label="Refresh">
      <Icon name="refresh" />
    </IconButton>
    <IconButton size="small" aria-label="Stop tracking">
      <Icon name="close" />
    </IconButton>
  </>
)

const meta = {
  title: 'ui/RepoTable',
  component: RepoTable,
  args: { children: null },
} satisfies Meta<typeof RepoTable>

export default meta
type Story = StoryObj<typeof meta>

export const MixedStates: Story = {
  render: () => (
    <RepoTable>
      <RepoTableRow
        fullName="facebook/react"
        description="The library for web and native user interfaces"
        stats={{
          stars: 228_000,
          openIssues: 855,
          openPullRequests: 526,
          lastCommitAt: daysAgo(2),
        }}
        actions={actions}
      />
      <RepoTableRow fullName="reduxjs/redux-toolkit" loading actions={actions} />
      <RepoTableRow
        fullName="mswjs/msw"
        description="Seamless REST/GraphQL API mocking library"
        stats={{
          stars: 16_400,
          openIssues: 112,
          openPullRequests: 18,
          lastCommitAt: daysAgo(120),
        }}
        actions={actions}
      />
      <RepoTableRow
        fullName="someone/abandoned"
        description="Last touched a long time ago"
        stats={{
          stars: 42,
          openIssues: 9,
          openPullRequests: 0,
          lastCommitAt: daysAgo(900),
        }}
        actions={actions}
      />
      <RepoTableRow
        fullName="ghost/missing"
        error={{ kind: 'not-found' }}
        onRetry={() => {}}
        actions={actions}
      />
    </RepoTable>
  ),
}

export const FreshnessBands: Story = {
  render: () => (
    <RepoTable>
      <RepoTableRow
        fullName="active/repo"
        description="Committed this week"
        stats={{
          stars: 1200,
          openIssues: 4,
          openPullRequests: 1,
          lastCommitAt: daysAgo(3),
        }}
      />
      <RepoTableRow
        fullName="quiet/repo"
        description="A few months since the last commit"
        stats={{
          stars: 800,
          openIssues: 21,
          openPullRequests: 2,
          lastCommitAt: daysAgo(150),
        }}
      />
      <RepoTableRow
        fullName="stale/repo"
        description="Years old"
        stats={{
          stars: 90,
          openIssues: 60,
          openPullRequests: 0,
          lastCommitAt: daysAgo(1200),
        }}
      />
      <RepoTableRow
        fullName="unknown/repo"
        description="GitHub could not attribute the last commit"
        stats={{ stars: 5, openIssues: 0, openPullRequests: 0, lastCommitAt: null }}
      />
    </RepoTable>
  ),
}

export const AllRateLimited: Story = {
  render: () => {
    const error = {
      kind: 'rate-limit' as const,
      resetAt: new Date(Date.now() + 41 * 60_000).toISOString(),
      authenticated: false,
    }

    return (
      <RepoTable>
        <RepoTableRow
          fullName="facebook/react"
          error={error}
          onRetry={() => {}}
          actions={actions}
        />
        <RepoTableRow
          fullName="vuejs/core"
          error={error}
          onRetry={() => {}}
          actions={actions}
        />
      </RepoTable>
    )
  },
}
