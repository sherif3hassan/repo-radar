import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type TextScale = 'normal' | 'large' | 'larger'
export type LineSpacing = 'normal' | 'relaxed'
export type MotionPreference = 'system' | 'reduced'
export type FontChoice = 'default' | 'hyperlegible'

export interface PreferencesState {
  textScale: TextScale
  lineSpacing: LineSpacing
  motion: MotionPreference
  font: FontChoice
}

export const defaultPreferences: PreferencesState = {
  textScale: 'normal',
  lineSpacing: 'normal',
  motion: 'system',
  font: 'default',
}

/** Multipliers, not pixel sizes — everything downstream is in rem. */
export const TEXT_SCALES: Record<TextScale, number> = {
  normal: 1,
  large: 1.125,
  larger: 1.25,
}

/** AAA 1.4.8 asks for at least 1.5 within a paragraph; `relaxed` goes beyond. */
export const LINE_HEIGHTS: Record<LineSpacing, number> = {
  normal: 1.5,
  relaxed: 1.8,
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: defaultPreferences,
  reducers: {
    textScaleSet(state, action: PayloadAction<TextScale>) {
      state.textScale = action.payload
    },
    lineSpacingSet(state, action: PayloadAction<LineSpacing>) {
      state.lineSpacing = action.payload
    },
    motionSet(state, action: PayloadAction<MotionPreference>) {
      state.motion = action.payload
    },
    fontSet(state, action: PayloadAction<FontChoice>) {
      state.font = action.payload
    },
    preferencesReset() {
      return defaultPreferences
    },
  },
})

export const { textScaleSet, lineSpacingSet, motionSet, fontSet, preferencesReset } =
  preferencesSlice.actions
export const preferencesReducer = preferencesSlice.reducer
