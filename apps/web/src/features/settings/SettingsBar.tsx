import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { Icon } from '@repo-radar/ui'
import { useState } from 'react'

import { RateLimitIndicator } from './RateLimitIndicator'
import { SettingsDialog } from './SettingsDialog'
import { ThemeToggle } from './ThemeToggle'

export function SettingsBar() {
  const theme = useTheme()
  // At 360px the labelled button plus the chip plus the toggle will not fit
  // beside the wordmark, so the token control collapses to its icon.
  const compact = useMediaQuery(theme.breakpoints.down('sm'))

  const [open, setOpen] = useState(false)

  // The visible text IS the accessible name. An aria-label here would override
  // it and break WCAG 2.5.3 (Label in Name): a voice-control user saying
  // "Settings" must activate the control they can see.
  const text = 'Settings'

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <RateLimitIndicator />

      {compact ? (
        <Tooltip title={text}>
          <IconButton size="small" aria-label={text} onClick={() => setOpen(true)}>
            <Icon name="settings" />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          size="small"
          color="inherit"
          startIcon={<Icon name="settings" />}
          onClick={() => setOpen(true)}
        >
          {text}
        </Button>
      )}

      <ThemeToggle />

      <SettingsDialog open={open} onClose={() => setOpen(false)} />
    </Stack>
  )
}
