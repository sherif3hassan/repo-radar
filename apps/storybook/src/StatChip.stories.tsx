import Stack from '@mui/material/Stack'
import { StatChip } from '@repo-radar/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'ui/StatChip',
  component: StatChip,
  args: {
    icon: 'clock',
    label: 'Active',
  },
} satisfies Meta<typeof StatChip>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

export const Success: Story = {
  args: { icon: 'check', label: 'Active', tone: 'success' },
}

export const Warning: Story = {
  args: { icon: 'clock', label: 'Quiet', tone: 'warning' },
}

export const ErrorTone: Story = {
  args: { icon: 'clock', label: 'Stale', tone: 'error' },
}

export const WithHint: Story = {
  args: {
    icon: 'key',
    label: '4,321/5,000',
    hint: 'GitHub API requests remaining this hour',
  },
}

export const NoIcon: Story = {
  args: { icon: undefined, label: 'JavaScript' },
}

export const AllTones: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <StatChip icon="clock" label="Active" tone="success" />
      <StatChip icon="clock" label="Quiet" tone="warning" />
      <StatChip icon="clock" label="Stale" tone="error" />
      <StatChip icon="code" label="TypeScript" tone="neutral" />
    </Stack>
  ),
}
