/**
 * One bar's worth of data.
 *
 * Deliberately generic: this package never imports the domain model, so charts
 * take `{ label, value }` and `apps/web` does the mapping — which is what keeps
 * the charting library replaceable behind one prop shape.
 *
 * A `type` rather than an `interface` on purpose: only type aliases get the
 * implicit index signature that x-charts' `dataset` prop requires.
 */
export type BarDatum = {
  label: string
  value: number
  /**
   * Used instead of `label` when there is no room for the full one.
   *
   * Supplied by the caller rather than derived here: shortening `owner/name` to
   * `name` is domain knowledge, and this package does not have any.
   */
  shortLabel?: string
}

/** A datum plus the label its bar is drawn with. `label` stays the full one. */
export type DisplayDatum = BarDatum & { display: string }

/**
 * Picks the label each bar is drawn with, in `display`.
 *
 * `label` is left untouched: the axis is short of room, but the accessible
 * table is not, and `react` alone is ambiguous when two owners share a name.
 *
 * A band axis is keyed by its label, so two bars sharing one collapse into a
 * single band and one of them silently disappears. Short labels collide easily —
 * `facebook/react` and `preactjs/react` are both `react` — so a short label is
 * only used when it is unique; otherwise that bar keeps its full label.
 */
export function withDisplayLabels(
  data: readonly BarDatum[],
  narrow: boolean,
): DisplayDatum[] {
  const wanted = data.map((datum) =>
    narrow ? (datum.shortLabel ?? datum.label) : datum.label,
  )

  const counts = new Map<string, number>()
  for (const label of wanted) counts.set(label, (counts.get(label) ?? 0) + 1)

  return data.map((datum, index) => {
    const display = wanted[index] ?? datum.label
    return { ...datum, display: (counts.get(display) ?? 0) > 1 ? datum.label : display }
  })
}
