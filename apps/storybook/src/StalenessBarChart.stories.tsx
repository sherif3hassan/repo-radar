import { StalenessBarChart } from '@repo-radar/plots'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'plots/StalenessBarChart',
  component: StalenessBarChart,
  args: { skipAnimation: true },
} satisfies Meta<typeof StalenessBarChart>

export default meta
type Story = StoryObj<typeof meta>

export const AllBands: Story = {
  args: {
    data: [
      { label: 'vuejs/core', shortLabel: 'core', value: 1 },
      { label: 'facebook/react', shortLabel: 'react', value: 12 },
      { label: 'mswjs/msw', shortLabel: 'msw', value: 120 },
      { label: 'someone/abandoned', shortLabel: 'abandoned', value: 900 },
    ],
  },
}

export const AllActive: Story = {
  args: {
    data: [
      { label: 'org/one', value: 0 },
      { label: 'org/two', value: 3 },
      { label: 'org/three', value: 11 },
    ],
  },
}

export const VeryStale: Story = {
  args: {
    data: [
      { label: 'org/current', value: 2 },
      { label: 'org/ancient', value: 3200 },
    ],
  },
}

export const CommittedToday: Story = {
  args: {
    data: [
      { label: 'org/today', value: 0 },
      { label: 'org/last-week', value: 7 },
    ],
  },
}

export const TighterThresholds: Story = {
  args: {
    thresholds: { active: 7, quiet: 60 },
    data: [
      { label: 'org/yesterday', value: 1 },
      { label: 'org/last-month', value: 30 },
      { label: 'org/last-year', value: 300 },
    ],
  },
}

export const Empty: Story = {
  args: { data: [] },
}
