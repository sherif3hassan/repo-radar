import { useTheme } from '@mui/material/styles'
import { CategoryBarChart, type BarDatum } from '@repo-radar/plots'
import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * The one chart that legitimately wants categorical colour: a language is an
 * identity, not a magnitude, so hue carries meaning instead of decorating a
 * length.
 *
 * The slot order is the colourblind-safety mechanism — it was validated for
 * adjacent-pair separation in both schemes — so hues are assigned in order and
 * never cycled.
 */
const languages: BarDatum[] = [
  { label: 'TypeScript', value: 7 },
  { label: 'JavaScript', value: 4 },
  { label: 'Rust', value: 2 },
  { label: 'Go', value: 1 },
]

const meta = {
  title: 'plots/CategoryBarChart',
  component: CategoryBarChart,
  args: { data: languages, colors: [], skipAnimation: true, title: 'Repositories by language' },
} satisfies Meta<typeof CategoryBarChart>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A component, not a bare render function — the palette comes from the theme
 * exactly as the app supplies it, and hooks are only legal inside components.
 */
function ThemedCategoryChart(props: React.ComponentProps<typeof CategoryBarChart>) {
  const theme = useTheme()
  return <CategoryBarChart {...props} colors={theme.palette.viz.categorical} />
}

const withPalette = (args: React.ComponentProps<typeof CategoryBarChart>) => (
  <ThemedCategoryChart {...args} />
)

export const Default: Story = { render: withPalette }

/** Exactly the eight validated slots, with none to spare. */
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

/**
 * Past eight, categories fold into "Other" in an inert grey rather than
 * reusing a hue — which would tell the reader two languages share an identity.
 */
export const OverflowsToOther: Story = {
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
      'Zig',
      'Haskell',
      'OCaml',
    ].map((label, index) => ({ label, value: 12 - index })),
  },
}

/** GitHub reports no language for some repositories. */
export const WithUnknown: Story = {
  render: withPalette,
  args: {
    data: [
      { label: 'TypeScript', value: 5 },
      { label: 'Unknown', value: 2 },
    ],
  },
}

/** Everything in one language — a flat bar that still needs to read. */
export const SingleCategory: Story = {
  render: withPalette,
  args: { data: [{ label: 'TypeScript', value: 6 }] },
}

/** Counts are whole repositories, so the axis must not show halves. */
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
