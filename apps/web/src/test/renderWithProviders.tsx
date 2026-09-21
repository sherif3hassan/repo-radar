import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

import { Providers } from '../app/Providers'
import { makeStore, type AppStore } from '../app/store'

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  store?: AppStore
}

/**
 * Renders inside a *fresh* store every time, so one test's RTK Query cache can
 * never satisfy another test's query and hide a missing request.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', store = makeStore(), ...options }: RenderWithProvidersOptions = {},
): RenderResult & { store: AppStore; user: ReturnType<typeof userEvent.setup> } {
  /**
   * `delay: null` removes user-event's wait between keystrokes. The default
   * awaits a macrotask per character, and with a React re-render and MUI's
   * dialog transitions behind each one, typing a token took ~1.9s of the 5s
   * timeout on this machine alone — enough that a slower CI runner tipped it
   * over. A timed-out `user.type` is worse than a slow one: its promise keeps
   * running and types the rest of the string into whatever the next test
   * renders, so one timeout fails two tests.
   *
   * Nothing here tests typing cadence, so the delay only bought flakiness.
   */
  const user = userEvent.setup({ delay: null })

  const result = render(ui, {
    wrapper: ({ children }) => (
      <Providers store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Providers>
    ),
    ...options,
  })

  return { ...result, store, user }
}
