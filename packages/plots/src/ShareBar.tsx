import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { visuallyHidden } from '@repo-radar/util'
import { useMemo } from 'react'

import type { BarDatum } from './MagnitudeBarChart'

export interface ShareBarProps {
  data: readonly BarDatum[]
  colors: readonly string[]
  title?: string
  maxSlots?: number
}

/**
 * One bar divided into parts — the question a pie chart is reaching for,
 * answered in a form people actually read accurately.
 *
 * Length is judged far better than angle or area, which is why a pie becomes
 * guesswork past about four slices. A single stacked bar keeps the
 * part-to-whole reading and stays legible at eight.
 *
 * Segments are separated by a surface-coloured gap rather than a border, so
 * adjacent fills never appear to blend into one.
 */
export function ShareBar({
  data,
  colors,
  title = 'Composition',
  maxSlots = 8,
}: ShareBarProps) {
  const theme = useTheme()

  const { segments, total } = useMemo(() => {
    const ranked = [...data].sort((a, b) => b.value - a.value)
    const head = ranked.slice(0, maxSlots)
    const tail = ranked.slice(maxSlots)

    const rows =
      tail.length > 0
        ? [...head, { label: 'Other', value: tail.reduce((sum, d) => sum + d.value, 0) }]
        : head

    return {
      segments: rows.map((row, index) => ({
        ...row,
        color:
          index < maxSlots
            ? (colors[index] ?? theme.palette.text.disabled)
            : theme.palette.text.disabled,
      })),
      total: rows.reduce((sum, row) => sum + row.value, 0),
    }
  }, [data, colors, maxSlots, theme.palette.text.disabled])

  if (segments.length === 0 || total === 0) return null

  const share = (value: number) => Math.round((value / total) * 100)

  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Typography
        variant="subtitle2"
        component="figcaption"
        sx={{ mb: 1, fontWeight: 600, fontSize: 13 }}
      >
        {title}
      </Typography>

      {/* The accessible equivalent: proportions as numbers. */}
      <Box component="table" sx={visuallyHidden}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Repositories</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.label}>
              <th scope="row">{segment.label}</th>
              <td>{segment.value}</td>
              <td>{share(segment.value)}%</td>
            </tr>
          ))}
        </tbody>
      </Box>

      <Box
        aria-hidden="true"
        sx={{ display: 'flex', gap: '2px', height: 14, borderRadius: 1, overflow: 'hidden' }}
      >
        {segments.map((segment) => (
          <Tooltip
            key={segment.label}
            title={`${segment.label} — ${segment.value} (${share(segment.value)}%)`}
          >
            <Box sx={{ flexGrow: segment.value, bgcolor: segment.color, minWidth: 3 }} />
          </Tooltip>
        ))}
      </Box>

      {/* Two or more parts always get a legend, so identity is never colour
          alone. */}
      <Box
        aria-hidden="true"
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.25 }}
      >
        {segments.map((segment) => (
          <Box
            key={segment.label}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
          >
            <Box
              sx={{ width: 9, height: 9, borderRadius: 0.5, bgcolor: segment.color, flexShrink: 0 }}
            />
            <Typography variant="caption" sx={{ fontSize: 12, color: 'text.secondary' }}>
              {segment.label}{' '}
              <Box
                component="span"
                sx={{ fontFamily: theme.typography.fontFamilyMono, color: 'text.primary' }}
              >
                {share(segment.value)}%
              </Box>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
