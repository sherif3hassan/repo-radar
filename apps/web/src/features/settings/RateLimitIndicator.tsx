import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { getRateLimit, subscribeToRateLimit } from '@repo-radar/data-access'
import { formatRelativeDate } from '@repo-radar/util'
import { useSyncExternalStore } from 'react'

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
      <Box
        component="span"
        aria-label={`${remaining} of ${limit} GitHub requests remaining`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          height: 32,
          px: 1.25,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.75,
          fontFamily: (t) => t.typography.fontFamilyMono,
          fontSize: 11,
          color: low ? 'warning.main' : 'text.secondary',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: low ? 'warning.main' : 'success.main',
          }}
        />
        {remaining}/{limit}
      </Box>
    </Tooltip>
  )
}
