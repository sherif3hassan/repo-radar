import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

export interface StatTileProps {
  label: string
  value: string | null
  hint?: string
  loading?: boolean
}

export function StatTile({ label, value, hint, loading = false }: StatTileProps) {
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
          <span>{heading}</span>
        </Tooltip>
      ) : (
        heading
      )}

      {loading ? (
        <Skeleton width={64} height={28} />
      ) : (
        <Typography variant="h6" component="div" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          {value ?? '—'}
        </Typography>
      )}
    </Box>
  )
}
