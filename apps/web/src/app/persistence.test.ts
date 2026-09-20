import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultPreferences } from '../features/settings/preferencesSlice'
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
} from './persistence'

const KEY = 'repo-radar'

const save = (state: { trackedIds: string[]; token: string | null }) =>
  savePersistedState({ ...state, preferences: defaultPreferences })

describe('persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('round-trips a payload', () => {
    save({ trackedIds: ['facebook/react'], token: null })

    expect(loadPersistedState()).toEqual({
      version: 1,
      trackedIds: ['facebook/react'],
      token: null,
      preferences: defaultPreferences,
    })
  })

  /**
   * Preferences were added after v1 shipped. Bumping the version would have
   * discarded a returning user's tracked repositories to gain a settings
   * default, so the field defaults instead.
   */
  it('reads a payload written before preferences existed', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, trackedIds: ['facebook/react'], token: null }),
    )

    expect(loadPersistedState()).toEqual({
      version: 1,
      trackedIds: ['facebook/react'],
      token: null,
      preferences: defaultPreferences,
    })
  })

  /**
   * The failure this whole field exists to avoid: renaming a preference enum
   * value must not wipe a returning user's tracked repositories and token
   * just because their stored `preferences` no longer parses.
   */
  it('keeps tracked repositories when only preferences fail to parse', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        trackedIds: ['facebook/react'],
        token: 'ghp_x',
        preferences: { textScale: 'enormous' },
      }),
    )

    expect(loadPersistedState()).toEqual({
      version: 1,
      trackedIds: ['facebook/react'],
      token: 'ghp_x',
      preferences: defaultPreferences,
    })
  })

  it('round-trips preferences', () => {
    savePersistedState({
      trackedIds: [],
      token: null,
      preferences: { ...defaultPreferences, textScale: 'larger', font: 'hyperlegible' },
    })

    expect(loadPersistedState()?.preferences).toEqual({
      ...defaultPreferences,
      textScale: 'larger',
      font: 'hyperlegible',
    })
  })

  it('stamps the current version', () => {
    save({ trackedIds: [], token: 'ghp_x' })

    expect(JSON.parse(window.localStorage.getItem(KEY) ?? '{}')).toMatchObject({
      version: 1,
    })
  })

  it('returns null when nothing is stored', () => {
    expect(loadPersistedState()).toBeNull()
  })

  it.each([
    ['not json at all', 'ids: [react]'],
    ['a payload from an older version', JSON.stringify({ version: 0, trackedIds: [] })],
    [
      'a payload with the wrong shape',
      JSON.stringify({ version: 1, trackedIds: 'react' }),
    ],
    ['a payload missing fields', JSON.stringify({ version: 1 })],
  ])('falls back to null for %s', (_label, stored) => {
    window.localStorage.setItem(KEY, stored)

    expect(loadPersistedState()).toBeNull()
  })

  it('clears an unreadable payload rather than carrying it', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 0 }))

    loadPersistedState()

    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it('survives storage throwing on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })

    expect(loadPersistedState()).toBeNull()
  })

  it('survives storage throwing on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(() => save({ trackedIds: [], token: null })).not.toThrow()
  })

  it('clears the key', () => {
    save({ trackedIds: ['a/b'], token: null })
    clearPersistedState()

    expect(loadPersistedState()).toBeNull()
  })
})
