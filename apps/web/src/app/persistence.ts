import { z } from 'zod'

import { defaultPreferences } from '../features/settings/preferencesSlice'

const STORAGE_KEY = 'repo-radar'

/**
 * Persisted payloads are genuinely untrusted input: the data in a returning
 * user's browser was written by a *previous version of this app*. Without a
 * versioned schema and a fallback, a shape change ships as a white screen.
 */
const preferencesSchema = z.object({
  textScale: z.enum(['normal', 'large', 'larger']),
  lineSpacing: z.enum(['normal', 'relaxed']),
  motion: z.enum(['system', 'reduced']),
  font: z.enum(['default', 'hyperlegible']),
})

const persistedSchema = z.object({
  version: z.literal(1),
  trackedIds: z.array(z.string().regex(/^[\w.-]+\/[\w.-]+$/)),
  token: z.string().nullable(),
  /**
   * Added after v1 shipped, and deliberately NOT a version bump: an unknown
   * version is discarded, which would throw away a returning user's tracked
   * repositories to gain a settings default.
   *
   * `.catch()` rather than `.default()`: `.default()` only substitutes for a
   * *missing* key, so a present-but-invalid value (e.g. an old build's
   * preferences after a preference enum value is renamed) would still fail
   * the whole object and wipe `trackedIds` and the token along with it —
   * exactly the failure this field exists to avoid. `.catch()` substitutes
   * the default for both a missing key and an invalid one, so a malformed
   * `preferences` block degrades to defaults without taking the rest of the
   * payload down with it.
   */
  preferences: preferencesSchema.catch(defaultPreferences),
})

export type PersistedState = z.infer<typeof persistedSchema>

const CURRENT_VERSION = 1 as const

/**
 * Never throws. Storage that is blocked, as in private browsing, yields null and
 * the app carries on without persistence. A payload from an older version, or a
 * corrupt one, is cleared rather than carried forward.
 */
export const loadPersistedState = (): PersistedState | null => {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }

  if (raw === null) return null

  try {
    const parsed = persistedSchema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
  } catch {}

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {}
  return null
}

/** Best effort: a full or disabled storage is not worth interrupting the user for. */
export const savePersistedState = (state: Omit<PersistedState, 'version'>): void => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: CURRENT_VERSION, ...state } satisfies PersistedState),
    )
  } catch {}
}

export const clearPersistedState = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
