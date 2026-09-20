const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatCompactNumber = (value: number): string => compact.format(value)

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const DIVISIONS = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
] as const satisfies readonly { amount: number; unit: Intl.RelativeTimeFormatUnit }[]


export const formatRelativeDate = (
  iso: string | null | undefined,
  now: Date = new Date(),
): string | null => {
  if (!iso) return null

  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null

  let duration = (then.getTime() - now.getTime()) / 1000

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relative.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }

  return null
}
