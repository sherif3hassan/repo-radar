import { githubApi } from '@repo-radar/data-access'
import type { RepoRef } from '@repo-radar/types'
import { pool } from '@repo-radar/util'
import { useCallback, useState } from 'react'

import { useAppDispatch } from '../../app/hooks'

/**
 * `api.util.invalidateTags` is the one-liner, but it fires every refetch at
 * once: twenty repositories is sixty immediate requests against a 60/hour
 * budget. Three at a time keeps per-card independence and stays inside it.
 */
const CONCURRENCY = 3

export function useRefreshAll(refs: readonly RepoRef[]) {
  const dispatch = useAppDispatch()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshAll = useCallback(async () => {
    if (refs.length === 0) return

    setIsRefreshing(true)
    try {
      await pool(refs, CONCURRENCY, async (ref) => {
        const request = dispatch(
          githubApi.endpoints.getRepoStats.initiate(ref, { forceRefetch: true }),
        )
        try {
          await request
        } catch {
          // Already recorded on that repository's own cache entry and rendered
          // by its own row. One bad repo must not abort the rest.
        } finally {
          // `initiate` adds a subscription; without this the entry would never
          // become eligible for cache cleanup.
          request.unsubscribe()
        }
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [dispatch, refs])

  return { refreshAll, isRefreshing }
}
