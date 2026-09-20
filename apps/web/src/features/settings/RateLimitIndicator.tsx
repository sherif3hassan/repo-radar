import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { getRateLimit, subscribeToRateLimit } from '@repo-radar/data-access'
import { formatRelativeDate } from '@repo-radar/util'
import { useSyncExternalStore } from 'react'

/** Below this share of the budget, the chip starts warning. */
const LOW_WATER = 0.25

/**
 * Reads the last rate-limit headers seen on any response.
 *
 * This is an observation of the network, not application state, so it lives in
 * an external store rather than Redux — no action is dispatched per request.
 */
export function RateLimitIndicator() {
  const rateLimit = useSyncExternalStore(subscribeToRateLimit, getRateLimit, () => null)

  if (!rateLimit) return null

  const { remaining, limit, resetAt } = rateLimit
  const low = limit > 0 && remaining / limit <= LOW_WATER
  const resets = formatRelativeDate(resetAt) ?? 'shortly'

  return (
    <Tooltip
      title={
        remaining === 0
          ? `Rate limit exhausted. Resets ${resets}.`
          : `${remaining} of ${limit} GitHub requests left. Resets ${resets}.`
      }
    >
      <Chip
        size="small"
        variant="outlined"
        color={low ? 'warning' : 'default'}
        label={`${remaining}/${limit}`}
        aria-label={`${remaining} of ${limit} GitHub requests remaining`}
      />
    </Tooltip>
  )
}
