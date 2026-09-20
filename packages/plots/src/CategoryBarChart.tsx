import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { BarChart } from '@mui/x-charts/BarChart'
import { visuallyHidden } from '@repo-radar/util'
import { useMemo } from 'react'

import type { BarDatum } from './datum'
import { useChartColors } from './useChartColors'

export interface CategoryBarChartProps {
  data: readonly BarDatum[]
  title?: string
  colors: readonly string[]
  maxSlots?: number
  height?: number
  skipAnimation?: boolean
  monoFontFamily?: string
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
  monoFontFamily,
}: CategoryBarChartProps) {
  const theme = useTheme()
  const chart = useChartColors()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const rows = useMemo(() => {
    const ranked = [...data].sort((a, b) => b.value - a.value)
    const head = ranked.slice(0, maxSlots)
    const tail = ranked.slice(maxSlots)

    return tail.length > 0
      ? [
          ...head,
          {
            label: 'Other',
            value: tail.reduce((sum, d) => sum + d.value, 0),
            detail: tail
              .map((d) => d.detail)
              .filter((d): d is string => Boolean(d))
              .join(', '),
          },
        ]
      : head
  }, [data, maxSlots])

  if (data.length === 0) return null

  const colorFor = (index: number) =>
    index < maxSlots ? (colors[index] ?? chart.disabled) : chart.disabled
  const hasDetail = rows.some((row) => row.detail)

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
            <th scope="col">Category</th>
            <th scope="col">Repositories</th>
            {hasDetail ? <th scope="col">Which repositories</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
              {hasDetail ? <td>{row.detail ?? ''}</td> : null}
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
            categoryGapRatio: 0.5,
            tickLabelStyle: {
              fill: chart.label,
              fontSize: narrow ? 11 : 12,
              fontFamily: monoFontFamily,
            },
          },
        ]}
        xAxis={[
          {
            tickMinStep: 1,
            tickLabelStyle: { fill: chart.label, fontSize: 11, fontFamily: monoFontFamily },
          },
        ]}
        series={[
          {
            dataKey: 'value',
            label: 'Repositories',
            valueFormatter: (value, context) => {
              if (value === null) return '—'
              const count = `${value} ${value === 1 ? 'repository' : 'repositories'}`
              const detail = rows[context.dataIndex]?.detail
              return detail ? `${count} — ${detail}` : count
            },
          },
        ]}
        sx={{
          '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
            stroke: chart.line,
          },
          '& .MuiChartsGrid-line': { stroke: chart.line },
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
