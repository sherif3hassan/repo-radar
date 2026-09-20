import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import type { ReactNode } from 'react'

/** A bordered card around a single chart, matching the app's other bordered surfaces. */
export function ChartPanel({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
