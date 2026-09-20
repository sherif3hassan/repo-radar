import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { Theme } from '@mui/material/styles'
import type { GithubError } from '@repo-radar/types'
import { formatCompactNumber, formatRelativeDate, visuallyHidden } from '@repo-radar/util'
import type { ReactNode } from 'react'

import { ErrorState } from './ErrorState'
import type { RepoCardStats } from './RepoCard'

export function RepoTable({ children }: { children: ReactNode }) {
  return (
    <TableContainer>
      <Table size="small" aria-label="Tracked repositories">
        <TableHead>
          <TableRow>
            <TableCell component="th" scope="col">
              Repository
            </TableCell>
            <TableCell component="th" scope="col" align="right">
              Stars
            </TableCell>
            <TableCell component="th" scope="col" align="right">
              Issues
            </TableCell>
            <TableCell component="th" scope="col">
              Last commit
            </TableCell>
            <TableCell component="th" scope="col" align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  )
}

export interface RepoTableRowProps {
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

const freshness = (iso: string | null): { label: string; tone: 'success' | 'warning' | 'error' } => {
  if (!iso) return { label: 'Unknown', tone: 'warning' }

  const days = (Date.now() - Date.parse(iso)) / 86_400_000
  if (days <= 30) return { label: 'Active', tone: 'success' }
  if (days <= 365) return { label: 'Quiet', tone: 'warning' }
  return { label: 'Stale', tone: 'error' }
}

const MONO = { fontFamily: (t: Theme) => t.typography.fontFamilyMono }


export function RepoTableRow({
  fullName,
  avatarUrl,
  htmlUrl,
  description,
  stats,
  loading = false,
  error,
  onRetry,
  actions,
}: RepoTableRowProps) {
  const identity = (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar src={avatarUrl} alt="" variant="rounded" sx={{ width: 32, height: 32 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography component="div" sx={{ ...MONO, fontSize: 13, fontWeight: 500 }}>
          {htmlUrl ? (
            <Link href={htmlUrl} target="_blank" rel="noreferrer" color="inherit">
              {fullName}
            </Link>
          ) : (
            fullName
          )}
        </Typography>
        {loading ? (
          <Skeleton width={220} height={14} />
        ) : description ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  )

  if (error) {
    return (
      <TableRow>
        <TableCell component="th" scope="row" sx={{ maxWidth: 0 }}>
          {identity}
        </TableCell>
        <TableCell colSpan={3}>
          <ErrorState error={error} onRetry={onRetry} dense />
        </TableCell>
        <TableCell align="right">{actions}</TableCell>
      </TableRow>
    )
  }

  const fresh = stats ? freshness(stats.lastCommitAt) : null

  return (
    <TableRow>
      <TableCell component="th" scope="row" sx={{ maxWidth: 0 }}>
        {identity}
      </TableCell>

      <TableCell align="right" sx={{ ...MONO, fontVariantNumeric: 'tabular-nums' }}>
        {loading || !stats ? <Skeleton width={46} sx={{ ml: 'auto' }} /> : formatCompactNumber(stats.stars)}
      </TableCell>

      <TableCell
        align="right"
        sx={{ ...MONO, fontVariantNumeric: 'tabular-nums' }}
        title={
          stats?.openPullRequests != null
            ? `Excludes ${formatCompactNumber(stats.openPullRequests)} open pull requests, which GitHub counts as issues.`
            : undefined
        }
      >
        {loading || !stats ? (
          <Skeleton width={34} sx={{ ml: 'auto' }} />
        ) : (
          formatCompactNumber(stats.openIssues)
        )}
      </TableCell>

      <TableCell>
        {loading || !stats || !fresh ? (
          <Skeleton width={90} />
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
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              {formatRelativeDate(stats.lastCommitAt) ?? 'Unknown'}
            </Typography>
            {/* The dot is decorative; this is what actually conveys freshness
                to a screen reader, so colour is never the only signal. */}
            <Box component="span" sx={visuallyHidden}>
              {fresh.label}
            </Box>
          </Stack>
        )}
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {actions}
        </Stack>
      </TableCell>
    </TableRow>
  )
}
