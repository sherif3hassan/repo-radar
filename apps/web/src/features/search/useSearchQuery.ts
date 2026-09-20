import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { useDebouncedValue } from './useDebouncedValue'

/** Below this, a search is too broad to be worth a request. */
const MIN_QUERY_LENGTH = 2

/**
 * Owns the search term and keeps `?q=` in sync with it.
 *
 * The text field stays responsive because `input` updates on every keystroke,
 * while the URL and the query argument only move on the debounced value. The
 * URL is written with `replace` so typing does not fill the history stack with
 * one entry per pause.
 */
export function useSearchTerm(delay = 400) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState(() => searchParams.get('q') ?? '')

  const debounced = useDebouncedValue(input, delay)
  const term = debounced.trim()

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (current === term) return

    const next = new URLSearchParams(searchParams)
    if (term) {
      next.set('q', term)
    } else {
      next.delete('q')
    }
    setSearchParams(next, { replace: true })
  }, [term, searchParams, setSearchParams])

  const clear = useCallback(() => setInput(''), [])

  return {
    input,
    setInput,
    clear,
    term,
    /** True once the term is long enough to issue a request. */
    isSearchable: term.length >= MIN_QUERY_LENGTH,
    /** True while the user has typed something the debounce has not caught up to. */
    isPending: input.trim() !== term,
  }
}
