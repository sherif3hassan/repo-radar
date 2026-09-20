import { useTheme } from '@mui/material/styles'
import { MagnitudeBarChart, type BarDatum } from '@repo-radar/plots'
import { theme } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

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
  args: {
    data: repos,
    skipAnimation: true,
    monoFontFamily: theme.typography.fontFamilyMono,
  },
} satisfies Meta<typeof MagnitudeBarChart>

export default meta
type Story = StoryObj<typeof meta>

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

export const SingleBar: Story = {
  args: { data: [repos[0]!] },
}

export const ExtremeOutlier: Story = {
  args: {
    data: [
      { label: 'torvalds/linux', value: 190_000 },
      { label: 'tiny/one', value: 12 },
      { label: 'tiny/two', value: 40 },
    ],
  },
}

export const WithZero: Story = {
  args: {
    data: [...repos.slice(0, 2), { label: 'someone/brand-new', value: 0 }],
  },
}

export const AllEqual: Story = {
  args: {
    data: ['alpha', 'beta', 'gamma'].map((name) => ({
      label: `org/${name}`,
      value: 500,
    })),
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

export const Empty: Story = {
  args: { data: [] },
}
