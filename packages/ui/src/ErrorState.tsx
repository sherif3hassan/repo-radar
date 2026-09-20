import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import type { GithubError } from '@repo-radar/types'
import { formatRelativeDate } from '@repo-radar/util'

export interface ErrorStateProps {
  error: GithubError
  onRetry?: () => void
  action?: React.ReactNode
  dense?: boolean
}

interface Described {
  severity: 'error' | 'warning'
  title: string
  detail: string
}

const describe = (error: GithubError): Described => {
  switch (error.kind) {
    case 'rate-limit': {
      const resets = formatRelativeDate(error.resetAt) ?? 'shortly'
      return {
        severity: 'warning',
        title: 'GitHub rate limit reached',
        detail: error.authenticated
          ? `Your token's quota is spent. It resets ${resets}.`
          : `Unauthenticated requests are capped at 60 per hour. The limit resets ${resets}. Adding a personal access token raises it to 5,000.`,
      }
    }
    case 'not-found':
      return {
        severity: 'error',
        title: 'Repository not found',
        detail: 'It may have been renamed, made private, or deleted.',
      }
    case 'invalid-query':
      return {
        severity: 'warning',
        title: 'GitHub could not run that search',
        detail: error.message,
      }
    case 'network':
      return {
        severity: 'error',
        title: 'Could not reach GitHub',
        detail: 'Check your connection and try again.',
      }
    case 'parse':
      return {
        severity: 'error',
        title: 'Unexpected response from GitHub',
        detail: error.issues,
      }
    case 'unknown':
      return {
        severity: 'error',
        title: 'Something went wrong',
        detail: error.status ? `GitHub responded with ${error.status}.` : 'Please try again.',
      }
  }
}

export function ErrorState({ error, onRetry, action, dense = false }: ErrorStateProps) {
  const { severity, title, detail } = describe(error)

  return (
    <Alert
      severity={severity}
      variant="outlined"
      sx={{ alignItems: 'flex-start' }}
      action={
        onRetry || action ? (
          <>
            {action}
            {onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {dense ? null : <AlertTitle>{title}</AlertTitle>}
      {dense ? title : detail}
    </Alert>
  )
}
