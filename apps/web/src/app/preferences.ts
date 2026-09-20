import useMediaQuery from '@mui/material/useMediaQuery'

import { useAppSelector } from './hooks'

/**
 * Shared surface for preferences, so features reach them through `app/` rather
 * than importing each other — the same rule `useTracking` follows.
 */
export function useReducedMotion(): boolean {
  const preference = useAppSelector((state) => state.preferences.motion)
  const system = useMediaQuery('(prefers-reduced-motion: reduce)')

  // An explicit choice wins; otherwise the OS setting is honoured.
  return preference === 'reduced' || system
}
