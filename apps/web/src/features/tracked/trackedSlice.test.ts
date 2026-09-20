import type { UnknownAction } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'

import {
  allUntracked,
  repoTracked,
  repoUntracked,
  selectIsTracked,
  selectTrackedRefs,
  trackedReducer,
  type TrackedState,
} from './trackedSlice'

const react = { owner: 'facebook', name: 'react' }
const vue = { owner: 'vuejs', name: 'core' }

const reduce = (actions: UnknownAction[]): TrackedState =>
  actions.reduce<TrackedState>(
    (state, action) => trackedReducer(state, action),
    trackedReducer(undefined, { type: '@@init' }),
  )

describe('trackedSlice', () => {
  it('tracks a repository by identifier', () => {
    const state = reduce([repoTracked(react)])
    expect(state.ids).toEqual(['facebook/react'])
  })

  it('puts the newest first', () => {
    const state = reduce([repoTracked(react), repoTracked(vue)])
    expect(state.ids).toEqual(['vuejs/core', 'facebook/react'])
  })

  it('ignores a duplicate without reordering', () => {
    const state = reduce([repoTracked(react), repoTracked(vue), repoTracked(react)])
    expect(state.ids).toEqual(['vuejs/core', 'facebook/react'])
  })

  it('untracks', () => {
    const state = reduce([repoTracked(react), repoTracked(vue), repoUntracked(react)])
    expect(state.ids).toEqual(['vuejs/core'])
  })

  it('untracking something absent is a no-op', () => {
    const state = reduce([repoTracked(react), repoUntracked(vue)])
    expect(state.ids).toEqual(['facebook/react'])
  })

  it('clears everything', () => {
    const state = reduce([repoTracked(react), repoTracked(vue), allUntracked()])
    expect(state.ids).toEqual([])
  })
})

describe('selectors', () => {
  it('parses identifiers back into refs', () => {
    const state = { tracked: { ids: ['facebook/react', 'vuejs/core'] } }
    expect(selectTrackedRefs(state)).toEqual([react, vue])
  })

  it('drops identifiers that are not owner/name', () => {
    const state = { tracked: { ids: ['facebook/react', 'nonsense', 'a/b/c', ''] } }
    expect(selectTrackedRefs(state)).toEqual([react])
  })

  it('returns a stable reference for unchanged ids', () => {
    const state = { tracked: { ids: ['facebook/react'] } }
    expect(selectTrackedRefs(state)).toBe(selectTrackedRefs(state))
  })

  it('reports membership', () => {
    const state = { tracked: { ids: ['facebook/react'] } }
    expect(selectIsTracked(state, react)).toBe(true)
    expect(selectIsTracked(state, vue)).toBe(false)
  })
})
