import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { BarChart } from '@mui/x-charts/BarChart'
import { formatCompactNumber, visuallyHidden } from '@repo-radar/util'
import { useMemo } from 'react'

import { withDisplayLabels, type BarDatum } from './datum'
import { useChartColors } from './useChartColors'

export interface MagnitudeBarChartProps {
  data: readonly BarDatum[]
  title?: string
  emptyMessage?: string
  height?: number
  /**
   * Rows to reserve height for even before they resolve.
   *
   * Tracked repositories arrive one at a time as their queries settle, so
   * sizing height off `data.length` alone would grow the chart — and shift
   * everything below it — on every arrival. Passing the total tracked count
   * reserves the final height up front; the chart still only draws the rows
   * it has.
   */
  minRows?: number
  color?: string
  skipAnimation?: boolean
  monoFontFamily?: string
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

/**
 * A horizontal bar chart of one measure.
 *
 * An SVG of rectangles conveys nothing to a screen reader, or to an agent
 * reading the DOM, so the same data ships as a visually hidden table. That table
 * is the accessible equivalent rather than a decorative extra, and the SVG is
 * hidden so it is not announced twice.
 */
export function MagnitudeBarChart({
  data,
  title = 'Stars per tracked repository',
  emptyMessage = 'Track a repository to see how its stars compare.',
  height,
  minRows,
  color,
  skipAnimation = false,
  monoFontFamily,
}: MagnitudeBarChartProps) {
  const theme = useTheme()
  const colors = useChartColors()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const seriesColor = color ?? colors.primary
  const lineColor = colors.line
  const labelColor = colors.label

  /** x-charts memoises internally; a freshly built array each render defeats it. */
  const sorted = useMemo(
    () =>
      withDisplayLabels(
        [...data].sort((a, b) => b.value - a.value),
        narrow,
      ),
    [data, narrow],
  )

  const resolvedHeight =
    height ?? Math.max(sorted.length, minRows ?? 0) * ROW_HEIGHT + CHART_CHROME

  if (data.length === 0) {
    return (
      <Box
        sx={{
          minHeight: minRows ? resolvedHeight : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Typography
        variant="subtitle2"
        component="figcaption"
        sx={{ mb: 1, fontWeight: 600 }}
      >
        {title}
      </Typography>

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

      <BarChart
        aria-hidden="true"
        dataset={sorted}
        layout="horizontal"
        height={resolvedHeight}
        hideLegend
        skipAnimation={skipAnimation}
        grid={{ vertical: true }}
        borderRadius={4}
        margin={{ right: 8, top: 8, bottom: 8 }}
        yAxis={[
          {
            scaleType: 'band',
            dataKey: 'display',
            width: narrow ? LABEL_WIDTH.narrow : LABEL_WIDTH.wide,
            categoryGapRatio: 0.5,
            tickLabelStyle: {
              fill: labelColor,
              fontSize: narrow ? 11 : 12,
              fontFamily: monoFontFamily,
            },
          },
        ]}
        xAxis={[
          {
            valueFormatter: (value: number) => formatCompactNumber(value),
            tickLabelStyle: {
              fill: labelColor,
              fontSize: 11,
              fontFamily: monoFontFamily,
            },
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
