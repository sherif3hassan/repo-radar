import Box from '@mui/material/Box'
import { parseFullName } from '@repo-radar/types'
import { visuallyHidden } from '@repo-radar/util'

const truncate = {
  display: 'block',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const

export interface RepoNameProps {
  fullName: string
}

/**
 * `owner/name` as a demoted owner caption above the repository name.
 *
 * `owner/name` is one unbroken token, so rendered plainly a long one overflows
 * its column and runs under whatever sits beside it. Splitting gives the
 * repository name — the half you actually scan for — the full width, and each
 * line truncates on its own so neither can push the row wide or change its
 * height.
 *
 * Assistive technology gets the canonical `owner/name` from a visually hidden
 * copy, and the two visible lines are `aria-hidden`. Splitting the string
 * across two elements would otherwise drop the slash from the accessible name
 * — a link announcing "facebook react", and a heading announcing just "react",
 * which does not say which one. A string that is not `owner/name` leaves
 * `parseFullName` null and is rendered as-is rather than guessed at.
 */
export function RepoName({ fullName }: RepoNameProps) {
  const parts = parseFullName(fullName)

  if (!parts) {
    return (
      <Box component="span" sx={truncate}>
        {fullName}
      </Box>
    )
  }

  return (
    <>
      <Box component="span" sx={visuallyHidden}>
        {fullName}
      </Box>
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          ...truncate,
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 1.3,
          color: 'text.secondary',
        }}
      >
        {parts.owner}
      </Box>
      <Box component="span" aria-hidden="true" sx={{ ...truncate, lineHeight: 1.35 }}>
        {parts.name}
      </Box>
    </>
  )
}
