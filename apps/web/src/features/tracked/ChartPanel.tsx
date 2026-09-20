import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { CategoryBarChart, MagnitudeBarChart, StalenessBarChart } from '@repo-radar/plots'
import { useId, useState } from 'react'

import { useReducedMotion } from '../../app/preferences'
import { useVizPalette } from '../../app/viz'
import type { TrackedMetrics } from './useTrackedMetrics'

const VIEWS = ['Stars', 'Issues', 'Activity', 'Languages'] as const
type View = (typeof VIEWS)[number]

/**
 * One chart at a time, switched by tabs.
 *
 * Four charts stacked would push the repository table off the screen and make
 * every chart narrower than the bars need. Switching keeps each one full width
 * — which matters, because a horizontal bar chart is only as readable as its
 * bars are long.
 */
export function ChartPanel({ metrics }: { metrics: TrackedMetrics }) {
  const viz = useVizPalette()
  const reducedMotion = useReducedMotion()
  const [view, setView] = useState<View>('Stars')
  const baseId = useId()

  if (!metrics.hasData) return null

  const panelId = `${baseId}-panel`
  const tabId = `${baseId}-tab`

  return (
    <Card>
      <Tabs
        value={view}
        onChange={(_event, next: View) => setView(next)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Chart view"
        sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
      >
        {VIEWS.map((name) => (
          <Tab
            key={name}
            value={name}
            label={name}
            id={`${tabId}-${name}`}
            aria-controls={panelId}
          />
        ))}
      </Tabs>

      <CardContent role="tabpanel" id={panelId} aria-labelledby={`${tabId}-${view}`}>
        {view === 'Stars' ? (
          <MagnitudeBarChart
            title="Stars per tracked repository"
            data={metrics.stars}
            color={viz.series}
            skipAnimation={reducedMotion}
          />
        ) : null}

        {view === 'Issues' ? (
          <MagnitudeBarChart
            title="Open issues per tracked repository"
            data={metrics.issues}
            color={viz.seriesAlt}
            skipAnimation={reducedMotion}
          />
        ) : null}

        {view === 'Activity' ? (
          <StalenessBarChart data={metrics.staleness} skipAnimation={reducedMotion} />
        ) : null}

        {view === 'Languages' ? (
          <CategoryBarChart
            title="Repositories by language"
            data={metrics.languages}
            colors={viz.categorical}
            skipAnimation={reducedMotion}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
