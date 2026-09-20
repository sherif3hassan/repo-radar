import { ThemeProvider } from '@mui/material/styles'
import { render } from '@testing-library/react'
import { createAppTheme, tokens, type VizPalette } from '@repo-radar/ui'
import { describe, expect, it } from 'vitest'

import { useVizPalette } from './viz'

function capture(mode: 'light' | 'dark'): VizPalette {
  let palette: VizPalette | undefined

  function Probe() {
    palette = useVizPalette()
    return null
  }

  render(
    <ThemeProvider theme={createAppTheme()} defaultMode={mode}>
      <Probe />
    </ThemeProvider>,
  )

  if (!palette) throw new Error('useVizPalette did not render')
  return palette
}

/**
 * The contrast tests in `theme.test.ts` assert raw token values, which is why
 * they stayed green while every chart in dark mode drew the LIGHT palette:
 * with `cssVariables` on, `theme.palette` is frozen to the default scheme. This
 * test goes through a real ThemeProvider instead.
 */
describe('useVizPalette', () => {
  it('returns the light palette in light mode', () => {
    const viz = capture('light')

    expect(viz.series).toBe(tokens.light.series)
    expect(viz.seriesAlt).toBe(tokens.light.seriesAlt)
    expect(viz.categorical).toEqual(tokens.light.categorical)
  })

  it('returns the DARK palette in dark mode, not the frozen light one', () => {
    const viz = capture('dark')

    expect(viz.series).toBe(tokens.dark.series)
    expect(viz.seriesAlt).toBe(tokens.dark.seriesAlt)
    expect(viz.categorical).toEqual(tokens.dark.categorical)
    expect(viz.series).not.toBe(tokens.light.series)
  })
})
