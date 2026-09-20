import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import type { Theme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { visuallyHidden } from '@repo-radar/util'
import { useId } from 'react'

export interface StatTileProps {
  label: string
  value: string | null
  hint?: string
  loading?: boolean
}

/**
 * MUI never adds `tabIndex` to a Tooltip's child, so a bare `<span>` cannot be
 * focused and a hint that changes what the figure means, such as "Excludes N
 * open pull requests", would be mouse-only. A hinted tile is therefore focusable
 * and points at a static, visually hidden description.
 *
 * The description is static because Tooltip's own `aria-describedby` is dynamic
 * and open-only: it would announce the hint while the popper is showing rather
 * than as soon as focus lands.
 */
export function StatTile({ label, value, hint, loading = false }: StatTileProps) {
  const hintId = useId()

  const heading = (
    <Typography
      variant="caption"
      component="div"
      color="text.secondary"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontSize: 11,
        ...(hint ? { cursor: 'help', textDecoration: 'underline dotted' } : {}),
      }}
    >
      {label}
    </Typography>
  )

  return (
    <Box sx={{ minWidth: 92 }}>
      {hint ? (
        <Tooltip title={hint}>
          <span tabIndex={0} aria-describedby={hintId}>
            {heading}
            <Box component="span" id={hintId} sx={visuallyHidden}>
              {hint}
            </Box>
          </span>
        </Tooltip>
      ) : (
        heading
      )}

      {loading ? (
        <Skeleton width={64} height={28} />
      ) : (
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            fontFamily: (t: Theme) => t.typography.fontFamilyMono,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value ?? '—'}
        </Typography>
      )}
    </Box>
  )
}
