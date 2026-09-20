import { githubApi } from '@repo-radar/data-access'
import type { BarDatum } from '@repo-radar/plots'
import { toFullName, type RepoRef } from '@repo-radar/types'
import { useMemo, useState } from 'react'
import { shallowEqual } from 'react-redux'

import { useAppSelector } from '../../app/hooks'

const MS_PER_DAY = 86_400_000

interface Resolved {
  ref: RepoRef
  stars: number
  openIssues: number
  lastCommitAt: string | null
  language: string | null
}

/**
 * Every tracked repository that has resolved, in one pass.
 *
 * One selector rather than one per chart: each would otherwise walk the cache
 * separately, and the views share the same underlying entries.
 *
 * Repositories still loading or errored are absent, so the charts show what is
 * known rather than blocking on the slowest request.
 */
function useResolved(refs: readonly RepoRef[]): Resolved[] {
  const raw = useAppSelector(
    (state) =>
      refs.map((ref) => {
        const { data } = githubApi.endpoints.getRepoStats.select(ref)(state)
        return data
          ? ([data.stars, data.openIssues, data.lastCommitAt, data.language] as const)
          : null
      }),
    shallowEqual,
  )

  return useMemo(
    () =>
      refs.flatMap((ref, index) => {
        const entry = raw[index]
        if (!entry) return []

        const [stars, openIssues, lastCommitAt, language] = entry
        return [{ ref, stars, openIssues, lastCommitAt, language }]
      }),
    [refs, raw],
  )
}

const toDatum = (resolved: Resolved, value: number): BarDatum => ({
  // `plots` is domain-agnostic, so the app decides that the short form of
  // `owner/name` is `name`.
  label: toFullName(resolved.ref),
  shortLabel: resolved.ref.name,
  value,
})

export interface TrackedTotals {
  repositories: number
  stars: number
  openIssues: number
  /**
   * Median rather than mean: one repository abandoned for five years would
   * drag an average far past anything the list actually looks like.
   */
  medianStalenessDays: number | null
}

export interface TrackedMetrics {
  stars: BarDatum[]
  issues: BarDatum[]
  staleness: BarDatum[]
  languages: BarDatum[]
  totals: TrackedTotals
  /** True once at least one repository has data to chart. */
  hasData: boolean
}

const median = (values: readonly number[]): number | null => {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? null)
}

export function useTrackedMetrics(refs: readonly RepoRef[]): TrackedMetrics {
  const resolved = useResolved(refs)

  // Captured once per mount: "days ago" does not need to tick, and reading the
  // clock during render makes the computation impure.
  const [now] = useState(() => Date.now())

  return useMemo(() => {
    const staleness = resolved.flatMap((entry) => {
      if (!entry.lastCommitAt) return []

      const parsed = Date.parse(entry.lastCommitAt)
      if (Number.isNaN(parsed)) return []

      return [toDatum(entry, Math.max(0, (now - parsed) / MS_PER_DAY))]
    })

    const byLanguage = new Map<string, number>()
    for (const entry of resolved) {
      const language = entry.language ?? 'Unknown'
      byLanguage.set(language, (byLanguage.get(language) ?? 0) + 1)
    }

    return {
      stars: resolved.map((entry) => toDatum(entry, entry.stars)),
      issues: resolved.map((entry) => toDatum(entry, entry.openIssues)),
      staleness,
      languages: [...byLanguage].map(([label, value]) => ({ label, value })),
      totals: {
        repositories: resolved.length,
        stars: resolved.reduce((sum, entry) => sum + entry.stars, 0),
        openIssues: resolved.reduce((sum, entry) => sum + entry.openIssues, 0),
        medianStalenessDays: median(staleness.map((datum) => datum.value)),
      },
      hasData: resolved.length > 0,
    }
  }, [resolved, now])
}
