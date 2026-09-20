import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { BarChart } from '@mui/x-charts/BarChart'
import { formatCompactNumber, visuallyHidden } from '@repo-radar/util'
import { useMemo } from 'react'

/**
 * Deliberately generic. This package never imports the domain model, so the
 * chart takes `{ label, value }` and `apps/web` does the mapping — which is
 * what keeps the charting library replaceable behind one prop shape.
 */
// A `type` rather than an `interface` on purpose: only type aliases get the
// implicit index signature that x-charts' `dataset` prop requires.
export type BarDatum = {
  label: string
  value: number
  shortLabel?: string
}

export interface MagnitudeBarChartProps {
  data: readonly BarDatum[]
  title?: string
  height?: number
  color?: string
  skipAnimation?: boolean
}

const ROW_HEIGHT = 34
const CHART_CHROME = 72

/**
 * Width reserved for the category axis.
 *
 * 168px of label plus bars does not fit on a 360px screen — the bars end up
 * too short to compare, which defeats the chart. Narrow viewports get a
 * smaller gutter and the short labels.
 */
const LABEL_WIDTH = { wide: 168, narrow: 88 } as const

export function MagnitudeBarChart({
  data,
  title = 'Stars per tracked repository',
  height,
  color,
  skipAnimation = false,
}: MagnitudeBarChartProps) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const seriesColor = color ?? theme.palette.primary.main
  const lineColor = theme.palette.divider
  const labelColor = theme.palette.text.secondary

  /**
   * Memoised, and above the early return so the hook order never changes.
   *
   * x-charts keeps an internal reselect store: handing it a freshly built
   * array on every render defeats that memoisation and makes it recompute the
   * whole chart, which it warns about in development.
   */
  const sorted = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.value - a.value)
        .map((datum) => ({
          ...datum,
          label: narrow ? (datum.shortLabel ?? datum.label) : datum.label,
        })),
    [data, narrow],
  )

  if (data.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Track a repository to see how its stars compare.
        </Typography>
      </Box>
    )
  }

  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Typography variant="subtitle2" component="figcaption" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>

      {/*
        The chart is an SVG of rectangles: it conveys nothing to a screen
        reader, and nothing to an agent reading the DOM either. This table is
        the same data in a form both can use. It is the accessible equivalent,
        not a decorative extra, so it carries the real numbers.
      */}
      <Box component="table" sx={visuallyHidden}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Repository</th>
            <th scope="col">Stars</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{datum.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Box>

      {/* The table above is the accessible equivalent, so the redundant SVG is
          hidden rather than announced twice. */}
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
            tickLabelStyle: { fill: labelColor, fontSize: narrow ? 11 : 12 },
          },
        ]}
        xAxis={[
          {
            valueFormatter: (value: number) => formatCompactNumber(value),
            tickLabelStyle: { fill: labelColor, fontSize: 11 },
          },
        ]}
        series={[
          {
            dataKey: 'value',
            label: 'Stars',
            color: seriesColor,
            valueFormatter: (value) =>
              value === null ? '—' : `${value.toLocaleString()} stars`,
          },
        ]}
        sx={{
          '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: lineColor },
          '& .MuiChartsGrid-line': { stroke: lineColor },
        }}
      />
    </Box>
  )
}
