import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import type { Theme } from '@mui/material/styles'

import { Icon, type IconName } from './Icon'

export interface StatChipProps {
  icon?: IconName
  dot?: string
  label: string
  hint?: string
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}

export function StatChip({ icon, dot, label, hint, tone = 'neutral' }: StatChipProps) {
  const chip = (
    <Box
      component="span"
      sx={(theme: Theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.5,
        borderRadius: 1.5,
        fontSize: 12,
        lineHeight: 1.4,
        fontFamily: theme.typography.fontFamilyMono,
        ...(tone === 'neutral'
          ? {
              color: 'text.secondary',
              bgcolor: 'action.hover',
            }
          : {
              color: `${tone}.main`,
              bgcolor: 'transparent',
              border: 1,
              borderColor: `${tone}.main`,
            }),
        ...(hint ? { cursor: 'help' } : {}),
      })}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {dot ? (
        <Box
          component="span"
          aria-hidden="true"
          sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }}
        />
      ) : null}
      {label}
    </Box>
  )

  return hint ? <Tooltip title={hint}>{chip}</Tooltip> : chip
}
