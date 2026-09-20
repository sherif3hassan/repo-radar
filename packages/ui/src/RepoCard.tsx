import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GithubError } from '@repo-radar/types'
import { formatCompactNumber, formatRelativeDate, visuallyHidden } from '@repo-radar/util'
import type { ReactNode } from 'react'

import { clampLines } from './clamp'
import { ErrorState } from './ErrorState'
import { freshness } from './freshness'
import { StatChip } from './StatChip'

export interface RepoCardStats {
  stars: number
  openIssues: number
  openPullRequests: number | null
  lastCommitAt: string | null
  language?: string | null
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
  const fresh = freshness(stats?.lastCommitAt ?? null)

  return (
    <Card component="article" aria-label={fullName}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            src={avatarUrl}
            alt=""
            variant="rounded"
            sx={{ width: 40, height: 40 }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
              {htmlUrl ? (
                <Link
                  href={htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  underline="hover"
                  color="inherit"
                >
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
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}
          >
            {loading ? (
              <>
                <Skeleton variant="rounded" width={54} height={22} />
                <Skeleton variant="rounded" width={46} height={22} />
                <Skeleton variant="rounded" width={40} height={22} />
              </>
            ) : (
              <>
                {stats?.language ? <StatChip icon="code" label={stats.language} /> : null}
                <StatChip
                  icon="star"
                  label={stats ? formatCompactNumber(stats.stars) : '—'}
                  hint="Stars"
                />
                <StatChip
                  icon="issue"
                  label={stats ? formatCompactNumber(stats.openIssues) : '—'}
                  hint={
                    stats?.openPullRequests != null
                      ? `Excludes ${formatCompactNumber(stats.openPullRequests)} open pull requests, which GitHub counts as issues.`
                      : 'GitHub counts open pull requests as issues, so this may include both.'
                  }
                />
              </>
            )}

            <Box sx={{ flexGrow: 1 }} />

            {loading ? (
              <Skeleton width={90} height={20} />
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  component="span"
                  aria-hidden="true"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: `${fresh.tone}.main`,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary' }}>
                  {stats ? (formatRelativeDate(stats.lastCommitAt) ?? 'Unknown') : '—'}
                </Typography>
                <Box component="span" sx={visuallyHidden}>
                  {fresh.label}
                </Box>
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
