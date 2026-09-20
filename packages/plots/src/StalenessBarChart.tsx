import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { BarChart } from '@mui/x-charts/BarChart'
import { visuallyHidden } from '@repo-radar/util'
import { useMemo } from 'react'

import type { BarDatum } from './MagnitudeBarChart'

export interface StalenessBarChartProps {
  data: readonly BarDatum[]
  title?: string
  height?: number
  thresholds?: { active: number; quiet: number }
  skipAnimation?: boolean
}

const ROW_HEIGHT = 34
const CHART_CHROME = 72
const LABEL_WIDTH = { wide: 168, narrow: 88 } as const

const DEFAULT_THRESHOLDS = { active: 30, quiet: 365 }

const plural = (days: number) => (days === 1 ? '1 day' : `${Math.round(days)} days`)

/**
 * Days since the last commit, per repository.
 *
 * A second chart rather than a second axis on the stars chart: stars and days
 * have unrelated magnitudes, and plotting them against two y-scales would make
 * the crossover points artefacts of the scaling rather than facts about the
 * data.
 *
 * Unlike stars, this one is *diverging in meaning* — lower is better — so the
 * bars are banded by threshold. The band is also stated in the accessible
 * table, never carried by colour alone.
 */
export function StalenessBarChart({
  data,
  title = 'Days since last commit',
  height,
  thresholds = DEFAULT_THRESHOLDS,
  skipAnimation = false,
}: StalenessBarChartProps) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const band = (days: number) => {
    if (days <= thresholds.active) return { label: 'Active', color: theme.palette.success.main }
    if (days <= thresholds.quiet) return { label: 'Quiet', color: theme.palette.warning.main }
    return { label: 'Stale', color: theme.palette.error.main }
  }

  /**
   * Memoised, and above the early return so the hook order never changes.
   *
   * x-charts memoises internally with reselect; a freshly built array each
   * render defeats it and forces a full recompute.
   */
  const sorted = useMemo(
    () =>
      [...data]
        .sort((a, b) => a.value - b.value)
        .map((datum) => ({
          ...datum,
          label: narrow ? (datum.shortLabel ?? datum.label) : datum.label,
        })),
    [data, narrow],
  )

  if (data.length === 0) return null

  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Typography variant="subtitle2" component="figcaption" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>

      <Box component="table" sx={visuallyHidden}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Repository</th>
            <th scope="col">Days since last commit</th>
            <th scope="col">Activity</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{plural(datum.value)}</td>
              <td>{band(datum.value).label}</td>
            </tr>
          ))}
        </tbody>
      </Box>

      <BarChart
        aria-hidden="true"
        dataset={sorted}
        layout="horizontal"
        height={height ?? sorted.length * ROW_HEIGHT + CHART_CHROME}
        hideLegend
        skipAnimation={skipAnimation}
        grid={{ vertical: true }}
        borderRadius={4}
        margin={{ right: 8, top: 8, bottom: 8 }}
        yAxis={[
          {
            scaleType: 'band',
            dataKey: 'label',
            width: narrow ? LABEL_WIDTH.narrow : LABEL_WIDTH.wide,
            categoryGapRatio: 0.35,
            tickLabelStyle: { fill: theme.palette.text.secondary, fontSize: narrow ? 11 : 12 },
          },
        ]}
        xAxis={[{ tickLabelStyle: { fill: theme.palette.text.secondary, fontSize: 11 } }]}
        series={[
          {
            dataKey: 'value',
            label: 'Days',
            valueFormatter: (value) =>
              value === null ? '—' : `${plural(value)} — ${band(value).label}`,
          },
        ]}
        // Per-bar colour by band, so the chart says the same thing the
        // freshness pills do.
        slotProps={{
          bar: { style: { transition: skipAnimation ? 'none' : undefined } },
        }}
        sx={{
          '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: theme.palette.divider },
          '& .MuiChartsGrid-line': { stroke: theme.palette.divider },
          ...Object.fromEntries(
            sorted.map((datum, index) => [
              `& .MuiBarElement-root:nth-of-type(${index + 1})`,
              { fill: band(datum.value).color },
            ]),
          ),
        }}
      />
    </Box>
  )
}
