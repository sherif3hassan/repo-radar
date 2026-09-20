import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { parseFullName, toFullName, type RepoRef } from '@repo-radar/types'

export interface TrackedState {
  /**
   * `owner/name` identifiers only — never snapshots of fetched data.
   * A tracked repository is a subscription; RTK Query owns everything fetched
   * against it.
   */
  ids: string[]
}

const initialState: TrackedState = { ids: [] }

const trackedSlice = createSlice({
  name: 'tracked',
  initialState,
  reducers: {
    repoTracked(state, action: PayloadAction<RepoRef>) {
      const id = toFullName(action.payload)
      if (!state.ids.includes(id)) state.ids.unshift(id)
    },
    repoUntracked(state, action: PayloadAction<RepoRef>) {
      const id = toFullName(action.payload)
      state.ids = state.ids.filter((existing) => existing !== id)
    },
    allUntracked(state) {
      state.ids = []
    },
  },
  selectors: {
    selectTrackedIds: (state) => state.ids,
  },
})

export const { repoTracked, repoUntracked, allUntracked } = trackedSlice.actions
export const trackedReducer = trackedSlice.reducer

const selectIds = (state: { tracked: TrackedState }) => state.tracked.ids

export { selectIds as selectTrackedIds }

/**
 * Memoised so the array identity is stable — every `TrackedRepoCard` depends on
 * it, and a fresh array each render would remount the whole list.
 */
export const selectTrackedRefs = createSelector([selectIds], (ids) =>
  ids.map(parseFullName).filter((ref): ref is RepoRef => ref !== null),
)

export const selectIsTracked = (
  state: { tracked: TrackedState },
  ref: RepoRef,
): boolean => state.tracked.ids.includes(toFullName(ref))
