import { useTheme } from '@mui/material/styles'
import { ShareBar, type BarDatum } from '@repo-radar/plots'
import { theme } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const languages: BarDatum[] = [
  { label: 'TypeScript', value: 7 },
  { label: 'JavaScript', value: 4 },
  { label: 'Rust', value: 2 },
  { label: 'Go', value: 1 },
]

const meta = {
  title: 'plots/ShareBar',
  component: ShareBar,
  args: {
    data: languages,
    colors: [],
    title: 'Repositories by language',
    monoFontFamily: theme.typography.fontFamilyMono,
  },
} satisfies Meta<typeof ShareBar>

export default meta
type Story = StoryObj<typeof meta>

function ThemedShareBar(props: React.ComponentProps<typeof ShareBar>) {
  const theme = useTheme()
  return <ShareBar {...props} colors={theme.palette.viz.categorical} />
}

const withPalette = (args: React.ComponentProps<typeof ShareBar>) => (
  <ThemedShareBar {...args} />
)

export const Default: Story = { render: withPalette }

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
    ].map((label, index) => ({ label, value: 20 - index })),
  },
}

export const SingleCategory: Story = {
  render: withPalette,
  args: { data: [{ label: 'TypeScript', value: 6 }] },
}

export const AllZero: Story = {
  render: withPalette,
  args: { data: [{ label: 'TypeScript', value: 0 }] },
}

export const Empty: Story = { render: withPalette, args: { data: [] } }
