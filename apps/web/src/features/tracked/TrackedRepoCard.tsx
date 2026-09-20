import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import type { SxProps, Theme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import { useGetRepoStatsQuery } from '@repo-radar/data-access'
import { asGithubError, toFullName, type RepoRef } from '@repo-radar/types'
import { Icon, RepoCard } from '@repo-radar/ui'

import { useTracking } from '../../app/tracking'

export interface TrackedRepoProps {
  repo: RepoRef
  /** The entrance animation, if any — `RepoCard` itself takes no `sx`. */
  sx?: SxProps<Theme>
}

/**
 * The connected half of the presentational component.
 *
 * Each instance owns its own cache entry, so loading, error and refresh are
 * per-repository by construction — there is no shared loading flag anywhere in
 * this app.
 */
export function TrackedRepo({ repo, sx }: TrackedRepoProps) {
  const { data, isFetching, isError, error, refetch } = useGetRepoStatsQuery(repo)
  const { untrack } = useTracking()

  const fullName = toFullName(repo)

  const shared = {
    fullName: data?.fullName ?? fullName,
    avatarUrl: data?.avatarUrl,
    htmlUrl: data?.htmlUrl ?? `https://github.com/${fullName}`,
    description: data?.description,
    stats: data
      ? {
          stars: data.stars,
          openIssues: data.openIssues,
          openPullRequests: data.openPullRequests,
          lastCommitAt: data.lastCommitAt,
          language: data.language,
        }
      : undefined,
    loading: isFetching && !data,
    error: isError ? asGithubError(error) : undefined,
    onRetry: () => void refetch(),
  }

  const actions = (
    <>
      <Tooltip title="Refresh">
        <span>
          <IconButton
            size="small"
            aria-label={`Refresh ${fullName}`}
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <Icon name="refresh" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Stop tracking">
        <IconButton
          size="small"
          aria-label={`Stop tracking ${fullName}`}
          onClick={() => untrack(repo)}
        >
          <Icon name="close" />
        </IconButton>
      </Tooltip>
    </>
  )

  return (
    <Box sx={sx}>
      <RepoCard {...shared} actions={actions} />
    </Box>
  )
}
