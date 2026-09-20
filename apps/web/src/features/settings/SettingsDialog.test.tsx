import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeStore } from '../../app/store'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SettingsBar } from './SettingsBar'
import { defaultPreferences, type PreferencesState } from './preferencesSlice'

const open = async (store = makeStore()) => {
  const result = renderWithProviders(<SettingsBar />, { store })
  await result.user.click(screen.getByRole('button', { name: 'Settings' }))
  return result
}

/** Option labels repeat across groups, so every query is scoped to its group. */
const group = (name: string) => within(screen.getByRole('radiogroup', { name }))

describe('SettingsDialog', () => {
  describe('token', () => {
    it('saves a token into the store', async () => {
      const store = makeStore()
      const { user } = await open(store)

      await user.type(screen.getByLabelText('Personal access token'), 'github_pat_abc')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(store.getState().settings.token).toBe('github_pat_abc')
    })

    // Whitespace is not a token; it must not put the app into a state where it
    // believes it is authenticated.
    it('treats a blank token as no token', async () => {
      const store = makeStore()
      const { user } = await open(store)

      await user.type(screen.getByLabelText('Personal access token'), '   ')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(store.getState().settings.token).toBeNull()
    })

    it('removes a stored token', async () => {
      const store = makeStore({ settings: { token: 'github_pat_abc' } })
      const { user } = await open(store)

      await user.click(screen.getByRole('button', { name: 'Remove token' }))

      expect(store.getState().settings.token).toBeNull()
    })
  })

  describe('accessibility preferences', () => {
    it.each<[string, string, keyof PreferencesState, string]>([
      ['Text size', 'Larger', 'textScale', 'larger'],
      ['Line spacing', 'Relaxed', 'lineSpacing', 'relaxed'],
      ['Motion', 'Reduce', 'motion', 'reduced'],
      ['Typeface', 'Hyperlegible', 'font', 'hyperlegible'],
    ])('%s → %s', async (groupName, option, key, expected) => {
      const store = makeStore()
      const { user } = await open(store)

      await user.click(group(groupName).getByRole('radio', { name: option }))

      expect(store.getState().preferences[key]).toBe(expected)
    })

    it('reflects preferences already stored', async () => {
      await open(makeStore({ preferences: { ...defaultPreferences, textScale: 'larger' } }))

      expect(group('Text size').getByRole('radio', { name: 'Larger' })).toBeChecked()
    })

    /**
     * Preferences are applied by rebuilding the theme, so a component reads
     * the result from tokens without knowing preferences exist.
     */
    it('scales rendered text through the theme', async () => {
      const normal = await open()
      const before = getComputedStyle(screen.getByRole('button', { name: 'Save' })).fontSize
      normal.unmount()

      await open(makeStore({ preferences: { ...defaultPreferences, textScale: 'larger' } }))
      const after = getComputedStyle(screen.getByRole('button', { name: 'Save' })).fontSize

      expect(Number.parseFloat(after)).toBeGreaterThan(Number.parseFloat(before))
    })
  })
})
