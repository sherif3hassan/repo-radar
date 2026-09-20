import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import { Icon, RepoCard } from '@repo-radar/ui'
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
  title: 'ui/RepoCard',
  component: RepoCard,
  args: {
    fullName: 'facebook/react',
    htmlUrl: 'https://github.com/facebook/react',
    description: 'The library for web and native user interfaces',
    stats: {
      stars: 228_000,
      openIssues: 855,
      openPullRequests: 526,
      lastCommitAt: daysAgo(2),
      language: 'JavaScript',
    },
    actions,
  },
} satisfies Meta<typeof RepoCard>

export default meta
type Story = StoryObj<typeof meta>

export const Loaded: Story = {}

export const Loading: Story = {
  args: { loading: true, stats: undefined, description: undefined },
}

export const Failed: Story = {
  args: { error: { kind: 'not-found' }, stats: undefined },
}

export const LongName: Story = {
  args: {
    fullName: 'some-organisation/an-extremely-long-repository-name-for-testing-overflow',
    description:
      'A description long enough to wrap onto several lines, which is what most real repositories have and what the layout has to survive.',
  },
}

export const NoDescription: Story = {
  args: { description: null },
}

export const ZeroStars: Story = {
  args: {
    fullName: 'someone/brand-new',
    description: 'Created yesterday',
    stats: { stars: 0, openIssues: 0, openPullRequests: 0, lastCommitAt: daysAgo(1) },
  },
}

export const IssueCountUncorrected: Story = {
  args: {
    stats: {
      stars: 228_000,
      openIssues: 1381,
      openPullRequests: null,
      lastCommitAt: daysAgo(2),
    },
  },
}

export const NoCommitDate: Story = {
  args: {
    stats: { stars: 3, openIssues: 0, openPullRequests: 0, lastCommitAt: null },
  },
}

/** The freshness dot and its text label, across every band the tracked grid shows. */
export const FreshnessBands: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 420 }}>
      <RepoCard
        fullName="active/repo"
        description="Committed this week"
        stats={{
          stars: 1200,
          openIssues: 4,
          openPullRequests: 1,
          lastCommitAt: daysAgo(3),
          language: 'TypeScript',
        }}
      />
      <RepoCard
        fullName="quiet/repo"
        description="A few months since the last commit"
        stats={{
          stars: 800,
          openIssues: 21,
          openPullRequests: 2,
          lastCommitAt: daysAgo(150),
          language: 'JavaScript',
        }}
      />
      <RepoCard
        fullName="stale/repo"
        description="Years old"
        stats={{
          stars: 90,
          openIssues: 60,
          openPullRequests: 0,
          lastCommitAt: daysAgo(1200),
          language: 'Rust',
        }}
      />
      <RepoCard
        fullName="unknown/repo"
        description="GitHub could not attribute the last commit"
        stats={{ stars: 5, openIssues: 0, openPullRequests: 0, lastCommitAt: null }}
      />
    </Stack>
  ),
}
