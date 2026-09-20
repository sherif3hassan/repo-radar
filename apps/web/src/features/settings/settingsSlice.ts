import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface SettingsState {
  /**
   * A personal access token the user pastes in themselves. It lifts the rate
   * limit from 60 to 5,000 requests/hour and never leaves their browser.
   *
   * No token is built into the bundle: Vite inlines `VITE_*` at build time, so
   * one there would be public.
   */
  token: string | null
}

const initialState: SettingsState = {
  token: null,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    tokenSet(state, action: PayloadAction<string | null>) {
      const next = action.payload?.trim()
      state.token = next ? next : null
    },
  },
})

export const { tokenSet } = settingsSlice.actions
export const settingsReducer = settingsSlice.reducer
