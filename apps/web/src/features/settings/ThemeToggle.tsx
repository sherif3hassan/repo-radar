import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useColorScheme } from '@mui/material/styles'
import { Icon, type IconName } from '@repo-radar/ui'

/**
 * MUI persists the choice itself and applies it via a class on the root, so the
 * switch happens at the CSS-variable layer with no React re-render.
 *
 * `mode` is undefined on the very first render before the stored preference is
 * read; rendering a disabled control then avoids a flash of the wrong icon.
 */
const ORDER = ['light', 'dark', 'system'] as const

const ICONS: Record<(typeof ORDER)[number], IconName> = {
  light: 'sun',
  dark: 'moon',
  system: 'monitor',
}

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme()

  if (!mode) {
    return <IconButton size="small" disabled aria-label="Toggle theme" />
  }

  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]!

  return (
    <Tooltip title={`Switch to ${next} theme`}>
      <IconButton
        size="small"
        onClick={() => setMode(next)}
        aria-label={`Switch to ${next} theme`}
      >
        <Icon name={ICONS[mode]} />
      </IconButton>
    </Tooltip>
  )
}
