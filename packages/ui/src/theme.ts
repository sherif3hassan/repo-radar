import { alpha, createTheme } from '@mui/material/styles'

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
    /**
     * The border that is the only thing identifying an icon-only button.
     * Lives on the palette (rather than as a plain `light`/`dark` constant
     * read directly) so `t.vars.palette.control.border` resolves per scheme
     * through CSS variables — see the note on `MuiIconButton` below.
     */
    control: { border: string }
    /**
     * The ambient gradient behind the app shell. Its own token rather than
     * `alpha(primary.main, …)` computed at the call site: `sx` and
     * `styleOverrides` only see `t.palette`, which is baked to the default
     * scheme once and never updates when the `.dark` class is applied — see
     * the note above `createAppTheme`. Precomputing per scheme here and
     * reading it through `t.vars` is what makes it react to scheme changes.
     */
    decor: { glow: string }
  }
  interface PaletteOptions {
    viz?: VizPalette
    control?: { border: string }
    decor?: { glow: string }
  }
  interface TypographyVariants {
    fontFamilyMono: string
  }
  interface TypographyVariantsOptions {
    fontFamilyMono?: string
  }
}

const SANS =
  '"Instrument Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

const HYPERLEGIBLE = '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif'

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

export interface AppThemeOptions {
  fontScale?: number
  lineHeight?: number
  hyperlegible?: boolean
  reducedMotion?: boolean
}

const CATEGORICAL_LIGHT = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
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

const LIGHT_ACCENT = '#184f95'
const DARK_ACCENT = '#86b6ef'

const light = {
  page: '#f9f9f7',
  surface: '#fcfcfb',
  ink: '#0b0b0b',
  inkSecondary: '#45443f',
  accent: LIGHT_ACCENT,
  accentHover: '#104281',
  series: '#2a78d6',
  seriesAlt: '#eb6834',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  /** Control borders that are the only thing identifying an icon-only button. */
  controlBorder: '#898781',
  categorical: CATEGORICAL_LIGHT,
  success: '#046004',
  warning: '#8a3f00',
  error: '#a01f1f',
  /** The app shell's ambient gradient — a faint wash, not a visible blob. */
  glow: alpha(LIGHT_ACCENT, 0.05),
}

const dark = {
  page: '#0d0d0d',
  surface: '#1a1a19',
  ink: '#ffffff',
  inkSecondary: '#c3c2b7',
  accent: DARK_ACCENT,
  accentHover: '#b7d3f6',
  series: '#3987e5',
  seriesAlt: '#d95926',
  gridline: '#2c2c2a',
  baseline: '#383835',
  controlBorder: '#75736d',
  categorical: CATEGORICAL_DARK,
  success: '#4fdb4f',
  warning: '#e0a030',
  error: '#f58a89',
  glow: alpha(DARK_ACCENT, 0.16),
}

export const tokens = { light, dark }

/**
 * Success/warning/error, read from whichever scheme's tokens are passed in.
 *
 * Unlike `series`/`accent`, a single shared value can't serve both schemes:
 * `StatChip` renders status colour as small mono text, so it needs the same
 * AAA floor as ink rather than the 3:1 mark floor, and a colour that clears
 * 7:1 on a light surface is nowhere near 7:1 on a dark one.
 */
const statusPalette = (t: Pick<typeof light, 'success' | 'warning' | 'error'>) => ({
  success: { main: t.success },
  warning: { main: t.warning },
  error: { main: t.error },
})

/**
 * Preferences are applied by rebuilding the theme, so no component needs to know
 * they exist.
 *
 * Inside `styleOverrides`, read colours through `t.vars.palette`. `t.palette` is
 * baked to the default scheme when the theme is created and does not change when
 * the `.dark` class is applied, because that callback runs once rather than per
 * scheme. `t.vars` holds `var(--mui-palette-*)` references that the browser
 * resolves against whichever scheme is active. It is only undefined when CSS
 * variables are disabled, which is why the plain palette stays as a fallback.
 */
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
          primary: {
            main: light.accent,
            dark: light.accentHover,
            contrastText: light.surface,
          },
          background: { default: light.page, paper: light.surface },
          text: { primary: light.ink, secondary: light.inkSecondary },
          divider: light.gridline,
          control: { border: light.controlBorder },
          decor: { glow: light.glow },
          ...statusPalette(light),
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
          control: { border: dark.controlBorder },
          decor: { glow: dark.glow },
          ...statusPalette(dark),
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
      fontSize: 14 * fontScale,
      body1: { lineHeight },
      body2: { lineHeight },
      h1: { fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.3px' },
      h2: { fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.2px' },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: { borderRadius: 8 },
    components: {
      /**
       * Every bordered surface (`RepoCard`, `ChartPanel`, the languages card)
       * gets the same hover treatment for free — one rule here rather than
       * repeating it in every `ui`/`apps/web` component that renders a `Card`.
       * `t.transitions.create` is what `reducedMotion` above patches to
       * `() => 'none'`, so this needs no separate reduced-motion check.
       */
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: ({ theme: t }) => ({
            transition: t.transitions.create('border-color', { duration: 150 }),
            '&:hover': {
              borderColor: t.vars ? t.vars.palette.primary.main : t.palette.primary.main,
            },
          }),
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: ({ theme: t }) => ({
            transition: t.transitions.create(
              ['background-color', 'border-color', 'color'],
              {
                duration: 150,
              },
            ),
            '&.Mui-focusVisible, &:focus-visible': {
              outline: `2px solid ${t.vars ? t.vars.palette.primary.main : t.palette.primary.main}`,
              outlineOffset: 2,
            },
          }),
        },
      },
      /**
       * `IconButton`'s own built-in root style already sets a `transition`
       * (`background-color` only) and a `:hover` background at 4% opacity —
       * `theme.palette.action.hover`'s default alpha, all but invisible on
       * an icon-only control that already carries a border. Since a later,
       * more specific rule's `transition`/`:hover` fully replace an earlier
       * one's rather than merge with it, the `MuiButtonBase` overrides above
       * never reach `IconButton` at all; the border and icon colour have to
       * be shifted here, on `IconButton`'s own slot, to actually be seen.
       */
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            border: `1px solid ${t.vars ? t.vars.palette.control.border : t.palette.control.border}`,
            borderRadius: 7,
            minWidth: 44,
            minHeight: 44,
            transition: t.transitions.create(
              ['border-color', 'color', 'background-color'],
              {
                duration: 150,
              },
            ),
            '&:hover': {
              borderColor: t.vars ? t.vars.palette.primary.main : t.palette.primary.main,
              color: t.vars ? t.vars.palette.primary.main : t.palette.primary.main,
            },
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
