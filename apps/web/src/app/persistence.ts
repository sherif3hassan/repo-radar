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
  trackedIds: z.array(z.string()),
  token: z.string().nullable(),
  /**
   * Added after v1 shipped, and deliberately NOT a version bump: an unknown
   * version is discarded, which would throw away a returning user's tracked
   * repositories to gain a settings default. An optional field with a default
   * reads old payloads unchanged.
   */
  preferences: preferencesSchema.default(defaultPreferences),
})

export type PersistedState = z.infer<typeof persistedSchema>

const CURRENT_VERSION = 1 as const

/** Never throws. A malformed or unreadable payload yields null and is cleared. */
export const loadPersistedState = (): PersistedState | null => {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private mode, or site data blocked. The app works without persistence.
    return null
  }

  if (raw === null) return null

  try {
    const parsed = persistedSchema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
  } catch {
    // Not valid JSON.
  }

  // Written by an older version, or corrupt. Drop it rather than carry it.
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing more to do */
  }
  return null
}

export const savePersistedState = (state: Omit<PersistedState, 'version'>): void => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: CURRENT_VERSION, ...state } satisfies PersistedState),
    )
  } catch {
    // Quota exceeded or storage disabled — not worth interrupting the user.
  }
}

export const clearPersistedState = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
