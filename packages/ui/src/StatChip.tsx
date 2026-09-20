import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import type { Theme } from '@mui/material/styles'
import { visuallyHidden } from '@repo-radar/util'
import { useId } from 'react'

import { Icon, type IconName } from './Icon'

export interface StatChipProps {
  icon?: IconName
  label: string
  hint?: string
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}

/** A hinted chip is focusable and described statically, for the reasons given on `StatTile`. */
export function StatChip({ icon, label, hint, tone = 'neutral' }: StatChipProps) {
  const hintId = useId()

  const chip = (
    <Box
      component="span"
      tabIndex={hint ? 0 : undefined}
      aria-describedby={hint ? hintId : undefined}
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
      {label}
      {hint ? (
        <Box component="span" id={hintId} sx={visuallyHidden}>
          {hint}
        </Box>
      ) : null}
    </Box>
  )

  return hint ? <Tooltip title={hint}>{chip}</Tooltip> : chip
}
