import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GithubError } from '@repo-radar/types'
import { formatCompactNumber, formatRelativeDate } from '@repo-radar/util'
import type { ReactNode } from 'react'

import { clampLines } from './clamp'
import { ErrorState } from './ErrorState'
import { StatTile } from './StatTile'

export interface RepoCardStats {
  stars: number
  openIssues: number
  openPullRequests: number | null
  lastCommitAt: string | null
}

export interface RepoCardProps {
  fullName: string
  avatarUrl?: string
  htmlUrl?: string
  description?: string | null
  stats?: RepoCardStats
  loading?: boolean
  error?: GithubError
  onRetry?: () => void
  actions?: ReactNode
}

export function RepoCard({
  fullName,
  avatarUrl,
  htmlUrl,
  description,
  stats,
  loading = false,
  error,
  onRetry,
  actions,
}: RepoCardProps) {
  return (
    <Card component="article" aria-label={fullName}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar src={avatarUrl} alt="" variant="rounded" sx={{ width: 40, height: 40 }} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
              {htmlUrl ? (
                <Link href={htmlUrl} target="_blank" rel="noreferrer" underline="hover" color="inherit">
                  {fullName}
                </Link>
              ) : (
                fullName
              )}
            </Typography>

            {description ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, ...clampLines(2) }}
              >
                {description}
              </Typography>
            ) : null}
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        </Stack>

        {error ? (
          <Box sx={{ mt: 2 }}>
            <ErrorState error={error} onRetry={onRetry} dense />
          </Box>
        ) : (
          <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 2 }}>
            <StatTile
              label="Stars"
              loading={loading}
              value={stats ? formatCompactNumber(stats.stars) : null}
            />
            <StatTile
              label="Open issues"
              loading={loading}
              value={stats ? formatCompactNumber(stats.openIssues) : null}
              hint={
                stats?.openPullRequests != null
                  ? `Excludes ${formatCompactNumber(stats.openPullRequests)} open pull requests, which GitHub counts as issues.`
                  : 'GitHub counts open pull requests as issues, so this may include both.'
              }
            />
            <StatTile
              label="Last commit"
              loading={loading}
              value={stats ? formatRelativeDate(stats.lastCommitAt) : null}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
