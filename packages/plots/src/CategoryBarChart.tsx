import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { BarChart } from '@mui/x-charts/BarChart'
import { visuallyHidden } from '@repo-radar/util'
import { useMemo } from 'react'

import type { BarDatum } from './MagnitudeBarChart'

export interface CategoryBarChartProps {
  data: readonly BarDatum[]
  title?: string
  colors: readonly string[]
  maxSlots?: number
  height?: number
  skipAnimation?: boolean
}

const ROW_HEIGHT = 34
const CHART_CHROME = 72
const LABEL_WIDTH = { wide: 140, narrow: 88 } as const


export function CategoryBarChart({
  data,
  title = 'By category',
  colors,
  maxSlots = 8,
  height,
  skipAnimation = false,
}: CategoryBarChartProps) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const rows = useMemo(() => {
    const ranked = [...data].sort((a, b) => b.value - a.value)
    const head = ranked.slice(0, maxSlots)
    const tail = ranked.slice(maxSlots)

    return tail.length > 0
      ? [...head, { label: 'Other', value: tail.reduce((sum, d) => sum + d.value, 0) }]
      : head
  }, [data, maxSlots])

  if (data.length === 0) return null

  const colorFor = (index: number) =>
    index < maxSlots ? (colors[index] ?? theme.palette.text.disabled) : theme.palette.text.disabled

  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Typography variant="subtitle2" component="figcaption" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>

      <Box component="table" sx={visuallyHidden}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Repositories</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </Box>

      <BarChart
        aria-hidden="true"
        dataset={rows}
        layout="horizontal"
        height={height ?? rows.length * ROW_HEIGHT + CHART_CHROME}
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
        xAxis={[
          {
            // Counts are whole repositories; fractional ticks would be nonsense.
            tickMinStep: 1,
            tickLabelStyle: { fill: theme.palette.text.secondary, fontSize: 11 },
          },
        ]}
        series={[
          {
            dataKey: 'value',
            label: 'Repositories',
            valueFormatter: (value) =>
              value === null ? '—' : `${value} ${value === 1 ? 'repository' : 'repositories'}`,
          },
        ]}
        sx={{
          '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: theme.palette.divider },
          '& .MuiChartsGrid-line': { stroke: theme.palette.divider },
          ...Object.fromEntries(
            rows.map((_, index) => [
              `& .MuiBarElement-root:nth-of-type(${index + 1})`,
              { fill: colorFor(index) },
            ]),
          ),
        }}
      />
    </Box>
  )
}
