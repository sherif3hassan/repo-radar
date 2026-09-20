import { useEffect, useState } from 'react'

/**
 * Trailing-edge debounce.
 *
 * Search is capped at 10 requests/minute unauthenticated, so the input must not
 * become the query argument directly: typing keeps the text field current while
 * the returned value — and therefore the RTK Query cache key — only settles
 * once typing pauses.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
