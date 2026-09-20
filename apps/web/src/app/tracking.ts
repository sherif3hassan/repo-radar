import type { RepoRef } from '@repo-radar/types'
import { useCallback } from 'react'

import {
  repoTracked,
  repoUntracked,
  selectIsTracked,
  selectTrackedRefs,
} from '../features/tracked/trackedSlice'
import { useAppDispatch, useAppSelector } from './hooks'

/**
 * Tracking is used by two features — search adds, tracked removes — and
 * features must not import each other. This is the shared surface they both go
 * through, which is what the isolation rule prescribes.
 */
export function useTracking() {
  const dispatch = useAppDispatch()
  const refs = useAppSelector(selectTrackedRefs)

  const track = useCallback((ref: RepoRef) => dispatch(repoTracked(ref)), [dispatch])
  const untrack = useCallback((ref: RepoRef) => dispatch(repoUntracked(ref)), [dispatch])

  return { refs, track, untrack }
}

/** Subscribes to one repository's membership only, so a card does not re-render
 * every time an unrelated repository is tracked. */
export function useIsTracked(ref: RepoRef): boolean {
  return useAppSelector((state) => selectIsTracked(state, ref))
}
