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
import { clampLines, freshness, Icon, StatChip } from '@repo-radar/ui'
import { formatCompactNumber, formatRelativeDate, visuallyHidden } from '@repo-radar/util'

import { entranceSx } from '../../app/motion'
import { useReducedMotion } from '../../app/preferences'
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
      variant={tracked ? 'outlined' : 'contained'}
      startIcon={tracked ? <Icon name="check" size={13} /> : undefined}
      onClick={() => (tracked ? untrack(ref) : track(ref))}
      aria-label={`${tracked ? 'Stop tracking' : 'Track'} ${repo.fullName}`}
    >
      {tracked ? 'Tracked' : 'Track'}
    </Button>
  )
}

export function SearchResultSkeleton({ count = 5 }: { count?: number }) {
  return (
    <List
      aria-busy="true"
      aria-label="Loading results"
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {Array.from({ length: count }, (_, index) => (
        <ListItem
          key={index}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
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
  const reducedMotion = useReducedMotion()

  return (
    <List aria-label="Search results" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {repos.map((repo, index) => (
        <ListItem
          key={repo.id}
          alignItems="flex-start"
          sx={{
            gap: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            transition: (t) => t.transitions.create('border-color', { duration: 150 }),
            '&:hover': { borderColor: 'primary.main' },
            ...entranceSx(index, !reducedMotion),
          }}
        >
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

                  <Box
                    component="span"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
                  >
                    <Box
                      component="span"
                      aria-hidden="true"
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: `${freshness(repo.pushedAt).tone}.main`,
                      }}
                    />
                    <Typography
                      variant="caption"
                      component="span"
                      sx={{ fontSize: 11, color: 'text.secondary' }}
                    >
                      {formatRelativeDate(repo.pushedAt) ?? 'Unknown'}
                    </Typography>
                    <Box component="span" sx={visuallyHidden}>
                      {freshness(repo.pushedAt).label}
                    </Box>
                  </Box>
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
