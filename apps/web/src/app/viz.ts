import { useColorScheme, useTheme } from '@mui/material/styles'
import type { VizPalette } from '@repo-radar/ui'

type SchemePalettes = Partial<Record<string, { palette: { viz: VizPalette } }>>

/**
 * `colorSchemes` exists on a theme built with `cssVariables` but is not part of
 * `Theme`'s static type, so it is read behind a guard instead of a blind cast.
 */
const schemePalettes = (theme: object): SchemePalettes | undefined =>
  'colorSchemes' in theme ? (theme.colorSchemes as SchemePalettes) : undefined

/**
 * The chart palette for the colour scheme that is actually showing.
 *
 * `theme.palette.viz` is frozen to the default (light) scheme when
 * `cssVariables` is on, so reading it directly hands a dark-mode user the light
 * series colour — and never reaches the dark palette that was validated for
 * the dark surface. `theme.colorSchemes` holds each scheme's own palette, and
 * `useColorScheme` reports which one is resolved.
 *
 * Lives in `app/` for the same reason `useReducedMotion` does: knowing which
 * scheme is active is a composition-root concern, and the presentational
 * packages take the result as props.
 */
export function useVizPalette(): VizPalette {
  const theme = useTheme()
  const { colorScheme } = useColorScheme()

  const resolved = colorScheme
    ? schemePalettes(theme)?.[colorScheme]?.palette.viz
    : undefined

  return resolved ?? theme.palette.viz
}
