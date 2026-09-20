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
  const user = userEvent.setup()

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
