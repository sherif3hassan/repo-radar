import { createTheme } from '@mui/material/styles'

/**
 * Chart tokens, carried on the MUI palette so they resolve per colour scheme
 * like everything else.
 *
 * `series` is deliberately NOT `palette.primary.main`. Bars are non-text marks
 * and need only 3:1, so they keep the lighter, more readable blue; links and
 * buttons are text and need 7:1, which forces a much darker step. One token
 * cannot serve both.
 */
export interface VizPalette {
  surface: string
  series: string
  seriesAlt: string
  gridline: string
  baseline: string
  label: string
  categorical: readonly string[]
}

declare module '@mui/material/styles' {
  interface Palette {
    viz: VizPalette
  }
  interface PaletteOptions {
    viz?: VizPalette
  }
  interface TypographyVariants {
    fontFamilyMono: string
  }
  interface TypographyVariantsOptions {
    fontFamilyMono?: string
  }
}

const SANS = '"Instrument Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

const HYPERLEGIBLE = '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif'

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

export interface AppThemeOptions {
  fontScale?: number
  lineHeight?: number
  hyperlegible?: boolean
  reducedMotion?: boolean
}

const CATEGORICAL_LIGHT = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
] as const

const CATEGORICAL_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
] as const

const light = {
  page: '#f9f9f7',
  surface: '#fcfcfb',
  ink: '#0b0b0b', // 19.17:1
  inkSecondary: '#45443f', // 8.79:1 on surface, 8.49:1 on the lightest tint
  accent: '#184f95', // 7.89:1 as text, and under white at 7.89:1
  accentHover: '#104281', // 9.66:1
  series: '#2a78d6', // 4.30:1 — mark only
  seriesAlt: '#eb6834', // 3.12:1 — mark only
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  /** Control borders that are the only thing identifying an icon-only button. */
  controlBorder: '#898781', // 3.50:1
  categorical: CATEGORICAL_LIGHT,
}

const dark = {
  page: '#0d0d0d',
  surface: '#1a1a19',
  ink: '#ffffff', // 17.42:1
  inkSecondary: '#c3c2b7', // 9.72:1
  accent: '#86b6ef', // 8.25:1
  accentHover: '#b7d3f6', // 11.33:1
  series: '#3987e5', // 4.79:1 — mark only
  seriesAlt: '#d95926', // 3.55:1 — mark only
  gridline: '#2c2c2a',
  baseline: '#383835',
  controlBorder: '#75736d',
  categorical: CATEGORICAL_DARK,
}


export const tokens = { light, dark }

const status = {
  success: { main: '#0ca30c' },
  warning: { main: '#b45309' },
  error: { main: '#d03b3b' },
}

export const createAppTheme = ({
  fontScale = 1,
  lineHeight = 1.5,
  hyperlegible = false,
  reducedMotion = false,
}: AppThemeOptions = {}) =>
  createTheme({
    ...(reducedMotion ? { transitions: { create: () => 'none' } } : {}),
  cssVariables: { colorSchemeSelector: 'class' },
  defaultColorScheme: 'light',
  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
        primary: { main: light.accent, dark: light.accentHover, contrastText: light.surface },
        background: { default: light.page, paper: light.surface },
        text: { primary: light.ink, secondary: light.inkSecondary },
        divider: light.gridline,
        ...status,
        viz: {
          surface: light.surface,
          series: light.series,
          seriesAlt: light.seriesAlt,
          gridline: light.gridline,
          baseline: light.baseline,
          label: light.inkSecondary,
          categorical: light.categorical,
        },
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: { main: dark.accent, dark: dark.accentHover, contrastText: dark.page },
        background: { default: dark.page, paper: dark.surface },
        text: { primary: dark.ink, secondary: dark.inkSecondary },
        divider: dark.gridline,
        ...status,
        viz: {
          surface: dark.surface,
          series: dark.series,
          seriesAlt: dark.seriesAlt,
          gridline: dark.gridline,
          baseline: dark.baseline,
          label: dark.inkSecondary,
          categorical: dark.categorical,
        },
      },
    },
  },
  typography: {
    fontFamily: hyperlegible ? HYPERLEGIBLE : SANS,
    fontFamilyMono: MONO,
    // MUI derives every rem size from this, so one number scales the app.
    fontSize: 14 * fontScale,
    body1: { lineHeight },
    body2: { lineHeight },
    h1: { fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.3px' },
    h2: { fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.2px' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: ({ theme: t }) => ({
          // Disabling the ripple also removes MUI's focus indicator, so the
          // ring has to be put back explicitly. `:focus-visible` keeps it off
          // mouse clicks and on for keyboard users.
          '&.Mui-focusVisible, &:focus-visible': {
            outline: `2px solid ${t.palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          border: `1px solid ${t.palette.mode === 'dark' ? dark.controlBorder : light.controlBorder}`,
          borderRadius: 7,
          minWidth: 44,
          minHeight: 44,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44 },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
    },
    ...(reducedMotion
      ? { MuiSkeleton: { defaultProps: { animation: false as const } } }
      : {}),
  },
  })

export const theme = createAppTheme()
