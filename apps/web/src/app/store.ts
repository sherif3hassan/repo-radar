import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  isAnyOf,
} from '@reduxjs/toolkit'
import { githubApi, setTokenAccessor } from '@repo-radar/data-access'

import {
  fontSet,
  lineSpacingSet,
  motionSet,
  preferencesReducer,
  preferencesReset,
  textScaleSet,
} from '../features/settings/preferencesSlice'
import { settingsReducer, tokenSet } from '../features/settings/settingsSlice'
import {
  allUntracked,
  repoTracked,
  repoUntracked,
  trackedReducer,
} from '../features/tracked/trackedSlice'
import { loadPersistedState, savePersistedState } from './persistence'

/**
 * The store is deliberately small. RTK Query owns everything fetched from
 * GitHub; slices hold only what the app itself decides.
 *
 * Slices never import from `app/`, so this module composes them without a cycle.
 */
const rootReducer = combineReducers({
  [githubApi.reducerPath]: githubApi.reducer,
  settings: settingsReducer,
  preferences: preferencesReducer,
  tracked: trackedReducer,
})

/**
 * Derived from the reducer rather than the store, so the listener middleware can
 * be typed without referencing its own output type.
 */
export type RootState = ReturnType<typeof rootReducer>

/** Long enough to collapse a burst of clicks, short enough to survive a tab close. */
const PERSIST_DEBOUNCE_MS = 200

const listener = createListenerMiddleware()

const startListening = listener.startListening.withTypes<RootState, AppDispatch>()

startListening({
  matcher: isAnyOf(
    repoTracked,
    repoUntracked,
    allUntracked,
    tokenSet,
    textScaleSet,
    lineSpacingSet,
    motionSet,
    fontSet,
    preferencesReset,
  ),
  effect: async (_action, api) => {
    api.cancelActiveListeners()
    await api.delay(PERSIST_DEBOUNCE_MS)

    const state = api.getState()
    savePersistedState({
      trackedIds: state.tracked.ids,
      token: state.settings.token,
      preferences: state.preferences,
    })
  },
})

/**
 * Binds the singleton accessor inside `makeStore` itself, rather than once at
 * module scope, so every store this factory produces — including one a test
 * injects through `Providers` — is the one `data-access` actually reads the
 * token from. Bound only at module scope, a store created for a test would
 * dispatch `Authorization: null` while the last-created store's token leaked
 * into it instead.
 */
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listener.middleware).concat(githubApi.middleware),
  })

  setTokenAccessor(() => store.getState().settings.token)

  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']

export const hydrate = (): Partial<RootState> | undefined => {
  const persisted = loadPersistedState()
  if (!persisted) return undefined

  return {
    tracked: { ids: persisted.trackedIds },
    settings: { token: persisted.token },
    preferences: persisted.preferences,
  }
}

export const store = makeStore(hydrate())
