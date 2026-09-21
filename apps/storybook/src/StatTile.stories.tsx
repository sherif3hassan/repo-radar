import { StatTile } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'ui/StatTile',
  component: StatTile,
  args: {
    label: 'Stars',
    value: '228,000',
  },
} satisfies Meta<typeof StatTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithHint: Story = {
  args: {
    label: 'Open issues',
    value: '855',
    hint: 'Excludes 526 open pull requests',
  },
}

export const Loading: Story = {
  args: { value: null, loading: true },
}

export const NoValue: Story = {
  args: { value: null },
}
