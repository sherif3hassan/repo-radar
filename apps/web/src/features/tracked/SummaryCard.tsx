import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import { ShareBar } from '@repo-radar/plots'
import { StatTile } from '@repo-radar/ui'
import { formatCompactNumber } from '@repo-radar/util'

import { useVizPalette } from '../../app/viz'
import type { TrackedMetrics } from './useTrackedMetrics'

const days = (value: number | null): string | null => {
  if (value === null) return null

  const rounded = Math.round(value)
  return rounded === 1 ? '1 day' : `${formatCompactNumber(rounded)} days`
}

/**
 * Three numbers and a composition strip.
 *
 * Sometimes the answer is not a chart: "how many stars across everything I
 * track" is a single figure, and rendering it as a bar would make it slower to
 * read, not faster. The charts below answer the comparative questions.
 */
export function SummaryCard({ metrics }: { metrics: TrackedMetrics }) {
  const theme = useTheme()
  const viz = useVizPalette()

  if (!metrics.hasData) return null

  const { totals } = metrics

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 4 }}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
          }
          sx={{ mb: metrics.languages.length > 0 ? 3 : 0 }}
        >
          <StatTile label="Tracked" value={String(totals.repositories)} />
          <StatTile label="Total stars" value={formatCompactNumber(totals.stars)} />
          <StatTile
            label="Open issues"
            value={formatCompactNumber(totals.openIssues)}
            hint="Excludes pull requests, which GitHub counts as issues."
          />
          <StatTile
            label="Median activity"
            value={days(totals.medianStalenessDays)}
            hint="Median days since the last commit. A median rather than an average, so one abandoned repository does not skew it."
          />
        </Stack>

        {metrics.languages.length > 0 ? (
          <Box>
            <ShareBar
              title="Languages"
              data={metrics.languages}
              colors={viz.categorical}
              monoFontFamily={theme.typography.fontFamilyMono}
            />
          </Box>
        ) : null}
      </CardContent>
    </Card>
  )
}
