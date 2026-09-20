import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import { Component, type ReactNode } from 'react'

export interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render errors from the routed pages — chiefly a stale, hashed lazy
 * chunk failing to load after a redeploy invalidates it for every tab left
 * open. Without this, `Suspense` re-throws the rejected `import()` past
 * itself with nothing to catch it, React unmounts the whole tree, and the
 * failure mode is a blank white page with no signal to the user at all.
 *
 * A class component because `componentDidCatch` / `getDerivedStateFromError`
 * have no hook equivalent. It sits inside `Suspense` (wrapping `Routes`
 * rather than wrapping `Suspense` itself) so the loading fallback still shows
 * while a chunk is genuinely pending, and only this fallback replaces it if
 * the load — or anything a route renders — actually throws.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  override state: RouteErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  override render() {
    const { error } = this.state

    if (error) {
      return (
        <Alert
          severity="error"
          variant="outlined"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        >
          <AlertTitle>Something went wrong</AlertTitle>
          This page failed to load. That can happen after an update ships while this tab
          was open — reloading usually fixes it.
        </Alert>
      )
    }

    return this.props.children
  }
}
