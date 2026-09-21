import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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

/** Each stat gets its own bordered tile rather than sitting in one shared card. */
const tileSx = {
  border: 1,
  borderColor: 'divider',
  borderRadius: 2,
  bgcolor: 'background.paper',
  p: 2,
} as const

/**
 * Four numbers and a composition strip.
 *
 * Sometimes the answer is not a chart: "how many stars across everything I
 * track" is a single figure, and rendering it as a bar would make it slower to
 * read, not faster. The charts below answer the comparative questions.
 */
export function SummaryCard({ metrics }: { metrics: TrackedMetrics }) {
  const theme = useTheme()
  const viz = useVizPalette()

  const { totals } = metrics

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'grid',
          /* `minmax(0, 1fr)`, not a bare `1fr`: a bare track will not shrink
           * below a tile's min-content, so a long value overflows the row. */
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        <Box sx={tileSx}>
          <StatTile label="Tracked" value={String(totals.repositories)} />
        </Box>
        <Box sx={tileSx}>
          <StatTile label="Total stars" value={formatCompactNumber(totals.stars)} />
        </Box>
        <Box sx={tileSx}>
          <StatTile
            label="Open issues"
            value={formatCompactNumber(totals.openIssues)}
            hint="Excludes pull requests, which GitHub counts as issues."
          />
        </Box>
        <Box sx={tileSx}>
          <StatTile
            label="Median activity"
            value={days(totals.medianStalenessDays)}
            hint="Median days since the last commit. A median rather than an average, so one abandoned repository does not skew it."
          />
        </Box>
      </Box>

      {/* Reserves the card's footprint before the first repository resolves and
          populates it, rather than popping the whole card in and shifting the
          charts below it. */}
      <Card sx={{ minHeight: 116 }}>
        <CardContent>
          <ShareBar
            title="Languages"
            data={metrics.languages}
            colors={viz.categorical}
            monoFontFamily={theme.typography.fontFamilyMono}
          />
        </CardContent>
      </Card>
    </Stack>
  )
}
