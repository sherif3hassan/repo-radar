import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { MagnitudeBarChart, StalenessBarChart } from '@repo-radar/plots'
import { toFullName } from '@repo-radar/types'
import { EmptyState, Icon } from '@repo-radar/ui'
import { visuallyHidden } from '@repo-radar/util'
import { Link } from 'react-router'

import { useReducedMotion } from '../../app/preferences'
import { useTracking } from '../../app/tracking'
import { useVizPalette } from '../../app/viz'
import { ChartPanel } from './ChartPanel'
import { SummaryCard } from './SummaryCard'
import { TrackedRepo } from './TrackedRepoCard'
import { useRefreshAll } from './useRefreshAll'
import { useTrackedMetrics } from './useTrackedMetrics'

/**
 * Every tracked repository renders as a card in a responsive grid — the same
 * presentation at every width, so nothing about a repository's card changes
 * depending on viewport.
 *
 * Stars and activity get a fixed, permanent chart each, side by side — the
 * two questions worth comparing across every tracked repository at a glance.
 * Issues gets its own chart below rather than a tab: with only three
 * dashboard-worthy measures once languages moved to `SummaryCard`'s share
 * bar, a tab switcher would hide a chart behind a click for no reason.
 *
 * The app maps the domain model onto the charts' generic shape, which is what
 * lets `plots` stay domain-agnostic.
 */
export function TrackedPage() {
  const theme = useTheme()
  const viz = useVizPalette()
  const reducedMotion = useReducedMotion()
  const { refs } = useTracking()
  const { refreshAll, isRefreshing } = useRefreshAll(refs)

  const metrics = useTrackedMetrics(refs)
  const monoFontFamily = theme.typography.fontFamilyMono

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
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.5}>
          <Typography variant="h1" component="h1">
            Tracked repositories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {refs.length} tracked {refs.length === 1 ? 'repository' : 'repositories'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Icon name="refresh" />}
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh all'}
          </Button>
          <Button
            component={Link}
            to="/search"
            variant="contained"
            startIcon={<Icon name="plus" />}
          >
            Add repository
          </Button>
        </Stack>
      </Stack>

      <SummaryCard metrics={metrics} />

      {metrics.hasData ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' },
              gap: 2,
            }}
          >
            <ChartPanel>
              <MagnitudeBarChart
                title="Stars per tracked repository"
                data={metrics.stars}
                color={viz.series}
                skipAnimation={reducedMotion}
                monoFontFamily={monoFontFamily}
              />
            </ChartPanel>
            <ChartPanel>
              <StalenessBarChart
                data={metrics.staleness}
                skipAnimation={reducedMotion}
                monoFontFamily={monoFontFamily}
              />
            </ChartPanel>
          </Box>

          <ChartPanel>
            <MagnitudeBarChart
              title="Open issues per tracked repository"
              data={metrics.issues}
              color={viz.seriesAlt}
              skipAnimation={reducedMotion}
              monoFontFamily={monoFontFamily}
            />
          </ChartPanel>
        </>
      ) : null}

      <Stack spacing={1.5}>
        <Typography variant="h2" component="h2">
          All tracked
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {refs.map((ref) => (
            <TrackedRepo key={toFullName(ref)} repo={ref} />
          ))}
        </Box>
      </Stack>
    </Stack>
  )
}
