import { useTheme } from '@mui/material/styles'
import { MagnitudeBarChart, type BarDatum } from '@repo-radar/plots'
import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * The hard cases for a chart are shapes of data, not states of the app: one
 * bar, thirty bars, a dominant outlier, a zero.
 *
 * Note the `color` prop. The app's chart token is deliberately not
 * `palette.primary` — bars are non-text marks needing 3:1, while links and
 * buttons are text needing 7:1 — so the caller supplies it.
 */
const repos: BarDatum[] = [
  { label: 'facebook/react', shortLabel: 'react', value: 228_000 },
  { label: 'vuejs/core', shortLabel: 'core', value: 50_200 },
  { label: 'colinhacks/zod', shortLabel: 'zod', value: 39_100 },
  { label: 'mswjs/msw', shortLabel: 'msw', value: 16_400 },
  { label: 'reduxjs/redux-toolkit', shortLabel: 'redux-toolkit', value: 10_900 },
]

const meta = {
  title: 'plots/MagnitudeBarChart',
  component: MagnitudeBarChart,
  args: { data: repos, skipAnimation: true },
} satisfies Meta<typeof MagnitudeBarChart>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A component, not a bare render function — the token comes from the theme
 * exactly as the app supplies it, and hooks are only legal inside components.
 */
function ThemedChart({
  token,
  ...props
}: React.ComponentProps<typeof MagnitudeBarChart> & { token: 'series' | 'seriesAlt' }) {
  const theme = useTheme()
  return <MagnitudeBarChart {...props} color={theme.palette.viz[token]} />
}

export const Stars: Story = {
  render: (args) => (
    <ThemedChart {...args} token="series" title="Stars per tracked repository" />
  ),
}

/**
 * A second magnitude takes the documented next hue, so two one-hue ramps never
 * read as one scale in different shades.
 */
export const OpenIssues: Story = {
  render: (args) => (
    <ThemedChart
      {...args}
      token="seriesAlt"
      title="Open issues per tracked repository"
      data={[
        { label: 'facebook/react', shortLabel: 'react', value: 855 },
        { label: 'vuejs/core', shortLabel: 'core', value: 631 },
        { label: 'mswjs/msw', shortLabel: 'msw', value: 112 },
        { label: 'colinhacks/zod', shortLabel: 'zod', value: 44 },
      ]}
    />
  ),
}

/** One tracked repository: the bar is full width and says nothing comparative. */
export const SingleBar: Story = {
  args: { data: [repos[0]!] },
}

/** A dominant value crushes the rest — worth seeing before it surprises you. */
export const ExtremeOutlier: Story = {
  args: {
    data: [
      { label: 'torvalds/linux', value: 190_000 },
      { label: 'tiny/one', value: 12 },
      { label: 'tiny/two', value: 40 },
    ],
  },
}

/** Zero is a real value, not a missing one. */
export const WithZero: Story = {
  args: {
    data: [...repos.slice(0, 2), { label: 'someone/brand-new', value: 0 }],
  },
}

/** Every value identical — no comparison to make, and it should still read. */
export const AllEqual: Story = {
  args: {
    data: ['alpha', 'beta', 'gamma'].map((name) => ({ label: `org/${name}`, value: 500 })),
  },
}

export const ManyBars: Story = {
  args: {
    data: Array.from({ length: 18 }, (_, i) => ({
      label: `org-${i}/repository-${i}`,
      shortLabel: `repository-${i}`,
      value: Math.round(50_000 / (i + 1)),
    })),
  },
}

/** Nothing tracked — a message, never an empty axis frame. */
export const Empty: Story = {
  args: { data: [] },
}
