import { keyframes } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`

const MAX_STAGGER_STEPS = 8
const STEP_MS = 40

/**
 * A one-time fade-and-rise for a list item's first paint, staggered by its
 * index so a grid or list arrives as a cascade rather than all at once.
 *
 * A plain function, not a hook — called from inside `.map()`, where the
 * number of items (and so the number of calls) changes between renders.
 * `useReducedMotion` is read once by the caller and passed in here instead.
 * The stagger is capped so tracking fifty repositories does not queue fifty
 * steps of delay behind the fold.
 */
export function entranceSx(index: number, enabled: boolean): SxProps<Theme> | undefined {
  if (!enabled) return undefined

  return {
    animation: `${fadeUp} 360ms ease-out both`,
    animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * STEP_MS}ms`,
  }
}
