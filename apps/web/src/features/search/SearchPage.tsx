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
import { EmptyState, ErrorState } from '@repo-radar/ui'
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

      <Box>
        <TextField
          fullWidth
          autoFocus
          label="Search GitHub repositories"
          placeholder="react · language:rust · topic:cli · stars:>1000"
          helperText="Repository search qualifiers work: language:, topic:, user:, org:, stars:, license:"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          slotProps={{
            input: {
              endAdornment: input ? (
                <InputAdornment position="end">
                  <IconButton aria-label="Clear search" size="small" onClick={clear}>
                    ×
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />

        <Box sx={{ height: 4, mt: 0.5 }}>
          <Fade in={showProgress} unmountOnExit>
            <LinearProgress aria-label="Searching" />
          </Fade>
        </Box>
      </Box>

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
    </Stack>
  )
}
