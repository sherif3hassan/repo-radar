import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { parseFullName, type Repo, type RepoRef } from '@repo-radar/types'
import { clampLines, StatChip } from '@repo-radar/ui'
import { formatCompactNumber } from '@repo-radar/util'

import { useIsTracked, useTracking } from '../../app/tracking'

function TrackButton({ repo }: { repo: Repo }) {
  const { track, untrack } = useTracking()
  const ref: RepoRef = parseFullName(repo.fullName) ?? {
    owner: repo.owner,
    name: repo.name,
  }
  const tracked = useIsTracked(ref)

  return (
    <Button
      size="small"
      variant={tracked ? 'text' : 'outlined'}
      onClick={() => (tracked ? untrack(ref) : track(ref))}
      aria-label={`${tracked ? 'Stop tracking' : 'Track'} ${repo.fullName}`}
    >
      {tracked ? 'Tracked' : 'Track'}
    </Button>
  )
}

export function SearchResultSkeleton({ count = 5 }: { count?: number }) {
  return (
    <List aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }, (_, index) => (
        <ListItem key={index} divider>
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText
            primary={<Skeleton width="30%" />}
            secondary={<Skeleton width="70%" />}
          />
        </ListItem>
      ))}
    </List>
  )
}

export interface SearchResultListProps {
  repos: readonly Repo[]
}

/**
 * The Track button sits in the flex flow rather than in `secondaryAction`, which
 * is absolutely positioned and reserves no width, so long descriptions used to
 * run underneath it. Descriptions are clamped: unclamped, twenty results become
 * several screens and the figures end up too far apart to compare.
 */
export function SearchResultList({ repos }: SearchResultListProps) {
  return (
    <List aria-label="Search results">
      {repos.map((repo) => (
        <ListItem key={repo.id} divider alignItems="flex-start" sx={{ gap: 2 }}>
          <ListItemAvatar>
            <Avatar src={repo.avatarUrl} alt="" variant="rounded" />
          </ListItemAvatar>

          <ListItemText
            primary={
              <Link
                href={repo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                underline="hover"
              >
                {repo.fullName}
              </Link>
            }
            secondary={
              <>
                {repo.description ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={clampLines(2)}
                  >
                    {repo.description}
                  </Typography>
                ) : null}

                <Box
                  component="span"
                  sx={{
                    display: 'flex',
                    gap: 0.75,
                    mt: 1,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <StatChip
                    icon="star"
                    label={formatCompactNumber(repo.stars)}
                    hint="Stars"
                  />
                  <StatChip
                    icon="issue"
                    label={formatCompactNumber(repo.openIssues)}
                    hint="Open issues and pull requests, as GitHub counts them"
                  />
                  {repo.language ? <StatChip icon="code" label={repo.language} /> : null}
                </Box>
              </>
            }
            slotProps={{ secondary: { component: 'div' } }}
            sx={{ minWidth: 0, my: 0 }}
          />

          <Box sx={{ flexShrink: 0, pt: 0.5 }}>
            <TrackButton repo={repo} />
          </Box>
        </ListItem>
      ))}
    </List>
  )
}
