import { useTheme } from '@mui/material/styles'

export interface ChartColors {
  /** Axis ticks and labels. Text, so it must meet 7:1 in both schemes. */
  label: string
  line: string
  disabled: string
  success: string
  warning: string
  error: string
  primary: string
}

/**
 * Chart colours that follow the active colour scheme.
 *
 * With `cssVariables` enabled, `theme.palette` is frozen to the *default*
 * scheme: in dark mode `text.secondary` is still the light-scheme ink, which on
 * a dark surface is about 1.9:1 — axis labels effectively disappear. The
 * `theme.vars` references resolve at paint time, so they track the class MUI
 * toggles on the root instead.
 *
 * Falls back to the plain palette when CSS variables are off, so the package
 * still works under a stock theme.
 */
export function useChartColors(): ChartColors {
  const theme = useTheme()
  const { palette } = theme.vars ?? theme

  return {
    label: palette.text.secondary,
    line: palette.divider,
    disabled: palette.text.disabled,
    success: palette.success.main,
    warning: palette.warning.main,
    error: palette.error.main,
    primary: palette.primary.main,
  }
}
