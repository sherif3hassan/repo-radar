import Box from '@mui/material/Box'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSearchReposQuery } from '@repo-radar/data-access'
import { asGithubError } from '@repo-radar/types'
import { EmptyState, ErrorState, Icon } from '@repo-radar/ui'
import { formatCompactNumber, visuallyHidden } from '@repo-radar/util'

import { SearchResultList, SearchResultSkeleton } from './SearchResultList'
import { useSearchTerm } from './useSearchQuery'

export function SearchPage() {
  const { input, setInput, clear, term, isSearchable, isPending } = useSearchTerm()

  const { data, error, isFetching, isError, refetch } = useSearchReposQuery(
    { q: term },
    { skip: !isSearchable },
  )

  const showSkeleton = isFetching && !data
  const showProgress = (isFetching && Boolean(data)) || isPending

  const announcement = !isSearchable
    ? ''
    : isFetching
      ? 'Searching'
      : isError
        ? 'Search failed'
        : data
          ? data.items.length === 0
            ? `No repositories matched ${term}`
            : `${data.totalCount.toLocaleString()} results for ${term}`
          : ''

  return (
    <Stack spacing={3}>
      <Typography variant="h1" component="h1" sx={visuallyHidden}>
        Search repositories
      </Typography>

      <Box role="status" aria-live="polite" sx={visuallyHidden}>
        {announcement}
      </Box>

      <Box sx={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <TextField
          fullWidth
          autoFocus
          placeholder="Search repositories on GitHub…"
          helperText="Repository search qualifiers work: language:, topic:, user:, org:, stars:, license:"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Search GitHub repositories' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" />
                </InputAdornment>
              ),
              endAdornment: input ? (
                <InputAdornment position="end">
                  {/*
                   * The global `MuiIconButton` override gives every icon button a
                   * border, which is right for a standalone control but reads as a
                   * box inside a box within a field that already has one. The
                   * border goes; the 44px target stays, because the README claims
                   * AAA for target size (WCAG 2.5.5) and this control is on the
                   * landing route.
                   *
                   * The hover fill is drawn by `::before` inset 4px, so the target
                   * measures 44px while the visible affordance stays 36px and does
                   * not crowd the 48px field. 2.5.5 measures the target, not the
                   * paint.
                   */}
                  <IconButton
                    aria-label="Clear search"
                    onClick={clear}
                    sx={{
                      border: 0,
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: 1.5,
                      color: 'text.secondary',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 4,
                        borderRadius: 'inherit',
                        transition: (t) =>
                          t.transitions.create('background-color', { duration: 150 }),
                      },
                      '&:hover': { border: 0, color: 'text.primary' },
                      '&:hover::before': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Icon name="close" size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
            formHelperText: { sx: { textAlign: 'center' } },
          }}
          sx={(t) => {
            const border = t.vars
              ? t.vars.palette.control.border
              : t.palette.control.border
            return {
              '& .MuiOutlinedInput-root': {
                height: 48,
                borderRadius: 1.25,
                bgcolor: 'background.paper',
                '& fieldset': { borderColor: border },
                '&:hover fieldset': { borderColor: border },
              },
            }
          }}
        />

        <Box sx={{ height: 4, mt: 0.5 }}>
          <Fade in={showProgress} unmountOnExit>
            <LinearProgress aria-label="Searching" />
          </Fade>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 920, width: '100%', alignSelf: 'center' }}>
        {!isSearchable ? (
          <EmptyState
            title="Search for a repository"
            description="Type at least two characters. GitHub's search qualifiers work here too, such as language:rust or stars:>1000."
          />
        ) : isError && error ? (
          <ErrorState error={asGithubError(error)} onRetry={() => void refetch()} />
        ) : showSkeleton ? (
          <SearchResultSkeleton />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="No repositories matched"
            description={`Nothing found for “${term}”. Try a broader term.`}
          />
        ) : data ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {formatCompactNumber(data.totalCount)} results
              {data.incomplete ? ' (partial — GitHub timed out)' : ''}
            </Typography>
            <SearchResultList repos={data.items} />
          </Box>
        ) : null}
      </Box>
    </Stack>
  )
}
