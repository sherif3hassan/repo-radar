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

/**
 * The dialog is keyed on `open` so it remounts per opening. Its draft state only
 * initialises once, because this component always renders it, so an abandoned
 * token would otherwise survive to the next open and overwrite a saved one.
 *
 * The visible text is the accessible name. An `aria-label` would override it and
 * break WCAG 2.5.3 (Label in Name): a voice-control user saying "Settings" must
 * activate the control they can see. Below `sm` it collapses to an icon, which
 * carries its own label.
 */
export function SettingsBar() {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))

  const [open, setOpen] = useState(false)

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

      <SettingsDialog key={String(open)} open={open} onClose={() => setOpen(false)} />
    </Stack>
  )
}
