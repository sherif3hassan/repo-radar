import CssBaseline from '@mui/material/CssBaseline'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from '@repo-radar/ui'
import { useMemo, type ReactNode } from 'react'
import { Provider as ReduxProvider, useSelector } from 'react-redux'

import { LINE_HEIGHTS, TEXT_SCALES } from '../features/settings/preferencesSlice'
import { useHyperlegibleFont } from '../features/settings/useHyperlegibleFont'
import { store as defaultStore, type AppStore, type RootState } from './store'

export interface ProvidersProps {
  children: ReactNode
  /** Tests inject a fresh store so cache state never leaks between cases. */
  store?: AppStore
}

/**
 * Preferences are applied by rebuilding the theme, so no component needs to
 * know they exist — text scale, line spacing and typeface arrive as tokens
 * like every other design decision.
 */
function Themed({ children }: { children: ReactNode }) {
  const preferences = useSelector((state: RootState) => state.preferences)
  const systemReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  useHyperlegibleFont(preferences.font === 'hyperlegible')

  const reducedMotion = preferences.motion === 'reduced' || systemReducedMotion

  const theme = useMemo(
    () =>
      createAppTheme({
        fontScale: TEXT_SCALES[preferences.textScale],
        lineHeight: LINE_HEIGHTS[preferences.lineSpacing],
        hyperlegible: preferences.font === 'hyperlegible',
        reducedMotion,
      }),
    [preferences.textScale, preferences.lineSpacing, preferences.font, reducedMotion],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  )
}

/**
 * Deliberately excludes the router: the app supplies `BrowserRouter` and tests
 * supply `MemoryRouter`, so routing can be driven from a URL in a test without
 * touching global history.
 */
export function Providers({ children, store = defaultStore }: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <Themed>{children}</Themed>
    </ReduxProvider>
  )
}
