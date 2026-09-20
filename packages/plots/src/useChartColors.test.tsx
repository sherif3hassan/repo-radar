import { ThemeProvider, createTheme } from '@mui/material/styles'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { useChartColors } from './useChartColors'

const cssVarsTheme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
})

const wrap =
  (theme: ReturnType<typeof createTheme>) =>
  ({ children }: { children: ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  )

/**
 * With `cssVariables` on, `theme.palette` is frozen to the default scheme, so
 * reading it directly gives a dark-mode user light-scheme ink on a dark surface.
 * The chart colours must instead be references that resolve at paint time.
 */
describe('useChartColors', () => {
  it('returns CSS variable references when the theme uses them', () => {
    const { result } = renderHook(() => useChartColors(), { wrapper: wrap(cssVarsTheme) })

    expect(result.current.label).toMatch(/^var\(--mui-palette-text-secondary/)
    expect(result.current.line).toMatch(/^var\(--mui-palette-divider/)
    expect(result.current.success).toMatch(/^var\(--mui-palette-success-main/)
    expect(result.current.warning).toMatch(/^var\(--mui-palette-warning-main/)
    expect(result.current.error).toMatch(/^var\(--mui-palette-error-main/)
  })

  it('is the same in dark mode, because the reference is what resolves', () => {
    const { result } = renderHook(() => useChartColors(), {
      wrapper: ({ children }) => (
        <ThemeProvider theme={cssVarsTheme} defaultMode="dark">
          {children}
        </ThemeProvider>
      ),
    })

    expect(result.current.label).toMatch(/^var\(--mui-palette-text-secondary/)
  })

  it('falls back to concrete colours under a plain theme', () => {
    const { result } = renderHook(() => useChartColors(), {
      wrapper: wrap(createTheme()),
    })

    expect(result.current.label).not.toMatch(/^var\(/)
    expect(result.current.label).toMatch(/^rgba?\(|^#/)
  })
})
