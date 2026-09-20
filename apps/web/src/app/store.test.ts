import { githubApi } from '@repo-radar/data-access'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fontSet,
  lineSpacingSet,
  motionSet,
  preferencesReset,
  textScaleSet,
} from '../features/settings/preferencesSlice'
import { tokenSet } from '../features/settings/settingsSlice'
import {
  allUntracked,
  repoTracked,
  repoUntracked,
} from '../features/tracked/trackedSlice'
import { rawRepo } from '../test/msw/fixtures'
import { server } from '../test/msw/server'
import { loadPersistedState, savePersistedState } from './persistence'
import { hydrate, makeStore } from './store'

const REACT = { owner: 'facebook', name: 'react' }
const VUE = { owner: 'vuejs', name: 'core' }

/** Long enough to pass the 200 ms debounce. */
const PAST_DEBOUNCE_MS = 250

describe('makeStore', () => {
  /**
   * `setTokenAccessor` binds a module-level singleton in `data-access`. If it
   * were bound once at module scope instead of inside `makeStore`, this store
   * — created fresh for the test, the same way `renderWithProviders` does —
   * would send `Authorization: null` while its token leaked into whichever
   * store was created last. Asserting the header on the wire is the only way
   * to catch that: reading `store.getState()` back would pass either way.
   */
  it('sends an injected store’s token as the Authorization header', async () => {
    let authorization: string | null = null
    server.use(
      http.get('https://api.github.com/repos/:owner/:name', ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json(rawRepo())
      }),
      http.get('https://api.github.com/repos/:owner/:name/commits', () =>
        HttpResponse.json([]),
      ),
      http.get('https://api.github.com/repos/:owner/:name/pulls', () =>
        HttpResponse.json([]),
      ),
    )

    const store = makeStore({ settings: { token: 'github_pat_abc' } })

    await store.dispatch(
      githubApi.endpoints.getRepoStats.initiate({ owner: 'facebook', name: 'react' }),
    )

    expect(authorization).toBe('Bearer github_pat_abc')
  })

  it('sends no Authorization header when the store holds no token', async () => {
    let authorization: string | null = null
    server.use(
      http.get('https://api.github.com/repos/:owner/:name', ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json(rawRepo())
      }),
      http.get('https://api.github.com/repos/:owner/:name/commits', () =>
        HttpResponse.json([]),
      ),
      http.get('https://api.github.com/repos/:owner/:name/pulls', () =>
        HttpResponse.json([]),
      ),
    )

    const store = makeStore()

    await store.dispatch(
      githubApi.endpoints.getRepoStats.initiate({ owner: 'facebook', name: 'react' }),
    )

    expect(authorization).toBeNull()
  })
})

describe('persistence wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const settle = () => vi.advanceTimersByTimeAsync(PAST_DEBOUNCE_MS)

  it('writes tracked repositories once the debounce has passed, not before', async () => {
    const store = makeStore()

    store.dispatch(repoTracked(REACT))
    await vi.advanceTimersByTimeAsync(100)
    expect(loadPersistedState()).toBeNull()

    await settle()
    expect(loadPersistedState()?.trackedIds).toEqual(['facebook/react'])
  })

  it('collapses a burst of changes into a single write of the final state', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const store = makeStore()

    store.dispatch(repoTracked(REACT))
    store.dispatch(repoTracked(VUE))
    store.dispatch(repoUntracked(REACT))
    await settle()

    expect(setItem).toHaveBeenCalledTimes(1)
    expect(loadPersistedState()?.trackedIds).toEqual(['vuejs/core'])
  })

  it('saves when a single repository is untracked on its own', async () => {
    const store = makeStore()

    store.dispatch(repoTracked(REACT))
    store.dispatch(repoTracked(VUE))
    await settle()
    store.dispatch(repoUntracked(REACT))
    await settle()

    expect(loadPersistedState()?.trackedIds).toEqual(['vuejs/core'])
  })

  it('persists the removal of the last tracked repository', async () => {
    const store = makeStore()

    store.dispatch(repoTracked(REACT))
    await settle()
    store.dispatch(allUntracked())
    await settle()

    expect(loadPersistedState()?.trackedIds).toEqual([])
  })

  /**
   * Each of these dispatches one action on its own. Combined with a tracked-repo
   * change, a later write would carry the token or preference along regardless,
   * and the test could not tell whether its own action triggers a save at all.
   */
  it('saves when only the token changes', async () => {
    const store = makeStore()

    store.dispatch(tokenSet('github_pat_abc'))
    await settle()

    expect(loadPersistedState()?.token).toBe('github_pat_abc')
  })

  it('saves when only a preference changes', async () => {
    const store = makeStore()

    store.dispatch(textScaleSet('larger'))
    await settle()

    expect(loadPersistedState()?.preferences.textScale).toBe('larger')
  })

  it('saves when only the line spacing changes', async () => {
    const store = makeStore()

    store.dispatch(lineSpacingSet('relaxed'))
    await settle()

    expect(loadPersistedState()?.preferences.lineSpacing).toBe('relaxed')
  })

  it('saves when only the motion preference changes', async () => {
    const store = makeStore()

    store.dispatch(motionSet('reduced'))
    await settle()

    expect(loadPersistedState()?.preferences.motion).toBe('reduced')
  })

  it('saves a preferences reset, so defaults are not undone on reload', async () => {
    const store = makeStore()

    store.dispatch(textScaleSet('larger'))
    await settle()
    store.dispatch(preferencesReset())
    await settle()

    expect(loadPersistedState()?.preferences.textScale).toBe('normal')
  })

  it('saves when only the typeface changes', async () => {
    const store = makeStore()

    store.dispatch(fontSet('hyperlegible'))
    await settle()

    expect(loadPersistedState()?.preferences.font).toBe('hyperlegible')
  })

  it('does not write for actions that change nothing worth keeping', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const store = makeStore()

    store.dispatch({ type: 'unrelated/action' })
    await settle()

    expect(setItem).not.toHaveBeenCalled()
  })
})

describe('hydrate', () => {
  it('starts from defaults when nothing was stored', () => {
    expect(hydrate()).toBeUndefined()
  })

  it('restores what a previous session left behind into a new store', () => {
    savePersistedState({
      trackedIds: ['facebook/react', 'vuejs/core'],
      token: 'github_pat_abc',
      preferences: {
        textScale: 'large',
        lineSpacing: 'relaxed',
        motion: 'reduced',
        font: 'hyperlegible',
      },
    })

    const state = makeStore(hydrate()).getState()

    expect(state.tracked.ids).toEqual(['facebook/react', 'vuejs/core'])
    expect(state.settings.token).toBe('github_pat_abc')
    expect(state.preferences).toEqual({
      textScale: 'large',
      lineSpacing: 'relaxed',
      motion: 'reduced',
      font: 'hyperlegible',
    })
  })

  it('discards an unreadable payload rather than booting from it', () => {
    window.localStorage.setItem('repo-radar', '{not json')

    expect(hydrate()).toBeUndefined()
    expect(window.localStorage.getItem('repo-radar')).toBeNull()
  })

  it('keeps tracked repositories when only the preferences are unreadable', () => {
    window.localStorage.setItem(
      'repo-radar',
      JSON.stringify({
        version: 1,
        trackedIds: ['facebook/react'],
        token: null,
        preferences: { textScale: 'gigantic' },
      }),
    )

    const state = makeStore(hydrate()).getState()

    expect(state.tracked.ids).toEqual(['facebook/react'])
    expect(state.preferences.textScale).toBe('normal')
  })

  it('round-trips through a write and a fresh boot', async () => {
    vi.useFakeTimers()
    try {
      const first = makeStore()
      first.dispatch(repoTracked(REACT))
      first.dispatch(tokenSet('github_pat_abc'))
      await vi.advanceTimersByTimeAsync(PAST_DEBOUNCE_MS)
    } finally {
      vi.useRealTimers()
    }

    const second = makeStore(hydrate()).getState()

    expect(second.tracked.ids).toEqual(['facebook/react'])
    expect(second.settings.token).toBe('github_pat_abc')
  })
})
