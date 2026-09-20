import { act, screen } from '@testing-library/react'
import { githubApi } from '@repo-radar/data-access'
import type { RepoRef } from '@repo-radar/types'
import { describe, expect, it } from 'vitest'

import { makeStore } from '../../app/store'
import { renderWithProviders } from '../../test/renderWithProviders'
import { useTrackedMetrics } from './useTrackedMetrics'

const react: RepoRef = { owner: 'facebook', name: 'react' }
const vue: RepoRef = { owner: 'vuejs', name: 'core' }

const refs = [react]

describe('useTrackedMetrics', () => {
  it('collects totals from resolved repositories', async () => {
    const store = makeStore()
    await store.dispatch(githubApi.endpoints.getRepoStats.initiate(react))

    let latest: ReturnType<typeof useTrackedMetrics> | undefined
    function Probe() {
      latest = useTrackedMetrics(refs)
      return <output>{latest.totals.repositories}</output>
    }

    renderWithProviders(<Probe />, { store })

    expect(screen.getByRole('status')).toHaveTextContent('1')
    expect(latest?.totals.stars).toBe(228_000)
    expect(latest?.totals.openIssues).toBe(900)
  })

  it('ignores repositories that have not resolved', () => {
    let latest: ReturnType<typeof useTrackedMetrics> | undefined
    function Probe() {
      latest = useTrackedMetrics(refs)
      return null
    }

    renderWithProviders(<Probe />, { store: makeStore() })

    expect(latest?.hasData).toBe(false)
    expect(latest?.stars).toEqual([])
  })

  /**
   * The review found `shallowEqual` here did nothing: the selector returned a
   * fresh tuple per repository, so it never compared equal and every store
   * dispatch rebuilt all the chart data. An unrelated cache change must not
   * re-render the consumer at all.
   *
   * RTK batches RTKQ notifications onto the next animation frame. Without the
   * wait below, subscribers have not been told anything changed yet and the
   * assertion passes vacuously, which is exactly what this test did until traced.
   */
  it('does not re-render when unrelated store state changes', async () => {
    const store = makeStore()
    await store.dispatch(githubApi.endpoints.getRepoStats.initiate(react))

    let renders = 0
    function Probe() {
      renders += 1
      useTrackedMetrics(refs)
      return null
    }

    renderWithProviders(<Probe />, { store })
    const before = renders

    await act(async () => {
      await store.dispatch(githubApi.endpoints.getRepoStats.initiate(vue))
      await new Promise((resolve) => setTimeout(resolve, 120))
    })

    expect(renders).toBe(before)
  })
})
