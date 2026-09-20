import { useTheme } from '@mui/material/styles'
import { CategoryBarChart, type BarDatum } from '@repo-radar/plots'
import { theme } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const languages: BarDatum[] = [
  { label: 'TypeScript', value: 7 },
  { label: 'JavaScript', value: 4 },
  { label: 'Rust', value: 2 },
  { label: 'Go', value: 1 },
]

const meta = {
  title: 'plots/CategoryBarChart',
  component: CategoryBarChart,
  args: {
    data: languages,
    colors: [],
    skipAnimation: true,
    title: 'Repositories by language',
    monoFontFamily: theme.typography.fontFamilyMono,
  },
} satisfies Meta<typeof CategoryBarChart>

export default meta
type Story = StoryObj<typeof meta>

function ThemedCategoryChart(props: React.ComponentProps<typeof CategoryBarChart>) {
  const theme = useTheme()
  return <CategoryBarChart {...props} colors={theme.palette.viz.categorical} />
}

const withPalette = (args: React.ComponentProps<typeof CategoryBarChart>) => (
  <ThemedCategoryChart {...args} />
)

export const Default: Story = { render: withPalette }

export const AllEightSlots: Story = {
  render: withPalette,
  args: {
    data: [
      'TypeScript',
      'JavaScript',
      'Rust',
      'Go',
      'Python',
      'Ruby',
      'C++',
      'Elixir',
    ].map((label, index) => ({ label, value: 10 - index })),
  },
}

export const OverflowsToOther: Story = {
  render: withPalette,
  args: {
    data: [
      ...['TypeScript', 'JavaScript', 'Rust', 'Go', 'Python', 'Ruby', 'C++', 'Elixir'].map(
        (label, index): BarDatum => ({ label, value: 12 - index }),
      ),
      { label: 'Zig', value: 4, detail: 'org/zig-tool' },
      { label: 'Haskell', value: 3, detail: 'org/haskell-lib' },
      { label: 'OCaml', value: 2, detail: 'org/ocaml-cli' },
    ],
  },
}

export const WithUnknown: Story = {
  render: withPalette,
  args: {
    data: [
      { label: 'TypeScript', value: 5 },
      { label: 'Unknown', value: 2 },
    ],
  },
}

export const SingleCategory: Story = {
  render: withPalette,
  args: { data: [{ label: 'TypeScript', value: 6 }] },
}

export const SmallCounts: Story = {
  render: withPalette,
  args: {
    data: [
      { label: 'TypeScript', value: 1 },
      { label: 'Rust', value: 1 },
    ],
  },
}

export const Empty: Story = { render: withPalette, args: { data: [] } }
