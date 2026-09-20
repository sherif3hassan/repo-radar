import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { toFullName } from '@repo-radar/types'
import { EmptyState, RepoTable } from '@repo-radar/ui'
import { visuallyHidden } from '@repo-radar/util'
import { Link } from 'react-router'

import { useTracking } from '../../app/tracking'
import { ChartPanel } from './ChartPanel'
import { SummaryCard } from './SummaryCard'
import { TrackedRepo } from './TrackedRepoCard'
import { useRefreshAll } from './useRefreshAll'
import { useTrackedMetrics } from './useTrackedMetrics'

/**
 * A table is for comparing columns. Below `md` there are none worth comparing,
 * so each repository becomes a card instead.
 *
 * The app maps the domain model onto the charts' generic shape, which is what
 * lets `plots` stay domain-agnostic.
 */
export function TrackedPage() {
  const theme = useTheme()
  const stacked = useMediaQuery(theme.breakpoints.down('md'))
  const { refs } = useTracking()
  const { refreshAll, isRefreshing } = useRefreshAll(refs)

  const metrics = useTrackedMetrics(refs)

  if (refs.length === 0) {
    return (
      <>
        <Typography variant="h1" component="h1" sx={visuallyHidden}>
          Tracked repositories
        </Typography>
        <EmptyState
          title="Nothing tracked yet"
          description="Search for a repository and track it to watch its stars, open issues and last commit here."
          action={
            <Button component={Link} to="/search" variant="contained">
              Search repositories
            </Button>
          }
        />
      </>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        spacing={2}
      >
        <Stack direction="row" spacing={1.5} alignItems="baseline">
          <Typography variant="h1" component="h1">
            Tracked
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {refs.length} tracked {refs.length === 1 ? 'repository' : 'repositories'}
          </Typography>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          onClick={() => void refreshAll()}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh all'}
        </Button>
      </Stack>

      <SummaryCard metrics={metrics} />
      <ChartPanel metrics={metrics} />

      {stacked ? (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {refs.map((ref) => (
            <TrackedRepo key={toFullName(ref)} repo={ref} variant="card" />
          ))}
        </Box>
      ) : (
        <Card>
          <RepoTable>
            {refs.map((ref) => (
              <TrackedRepo key={toFullName(ref)} repo={ref} variant="row" />
            ))}
          </RepoTable>
        </Card>
      )}
    </Stack>
  )
}
