import { StalenessBarChart } from '@repo-radar/plots'
import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Days since the last commit.
 *
 * The one chart where colour carries meaning rather than identity — lower is
 * better, so bars are banded by threshold. The band is also stated in the
 * accessible table, so colour is never the only signal.
 */
const meta = {
  title: 'plots/StalenessBarChart',
  component: StalenessBarChart,
  args: { skipAnimation: true },
} satisfies Meta<typeof StalenessBarChart>

export default meta
type Story = StoryObj<typeof meta>

/** All three bands at once, which is the normal case for a real list. */
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

/** A long-abandoned repository dwarfs the rest of the axis. */
export const VeryStale: Story = {
  args: {
    data: [
      { label: 'org/current', value: 2 },
      { label: 'org/ancient', value: 3200 },
    ],
  },
}

/** Committed today. Zero days must not render as "no data". */
export const CommittedToday: Story = {
  args: {
    data: [
      { label: 'org/today', value: 0 },
      { label: 'org/last-week', value: 7 },
    ],
  },
}

/** Custom thresholds — a team with a tighter definition of "active". */
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
