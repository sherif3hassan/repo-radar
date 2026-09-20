import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Icon } from '@repo-radar/ui'
import { visuallyHidden } from '@repo-radar/util'
import { lazy, Suspense } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router'

import { RouteErrorBoundary } from './app/RouteErrorBoundary'
import { SearchPage } from './features/search/SearchPage'
import { SettingsBar } from './features/settings/SettingsBar'

/**
 * Split out because the charting library is ~470 kB and is only needed here.
 * Search is the landing route, so it stays eager.
 */
const TrackedPage = lazy(() =>
  import('./features/tracked/TrackedPage').then((module) => ({
    default: module.TrackedPage,
  })),
)

const ROUTES = [
  { path: '/search', label: 'Search' },
  { path: '/tracked', label: 'Tracked' },
] as const

/**
 * A `nav` landmark of links rather than a tablist: tabs switch panels within one
 * page, these go to other pages. `NavLink` sets `aria-current="page"` itself.
 *
 * There is one instance, reflowed onto its own row by the caller below `md`.
 * Rendering a second copy for narrow viewports would put the navigation in the
 * accessibility tree twice.
 */
function Navigation() {
  return (
    <Box component="nav" aria-label="Primary" sx={{ display: 'flex', gap: 0.5 }}>
      {ROUTES.map((route) => (
        <Button
          key={route.path}
          component={NavLink}
          to={route.path}
          color="inherit"
          sx={{
            px: 2,
            borderRadius: 0,
            fontWeight: 500,
            color: 'text.secondary',
            borderBottom: 2,
            borderColor: 'transparent',
            '&[aria-current="page"]': {
              color: 'text.primary',
              borderColor: 'primary.main',
              fontWeight: 600,
            },
          }}
        >
          {route.label}
        </Button>
      ))}
    </Box>
  )
}

/**
 * The page shell.
 *
 * The skip link is hidden until focused. Without it keyboard users tab through
 * the brand, both tabs and three settings controls on every navigation.
 *
 * The brand is a `span` rather than an `h1`: it repeats on every route, so the
 * heading outline should describe where you are, not what the product is called.
 */
export function App() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Box
        component="a"
        href="#main"
        sx={{
          ...visuallyHidden,
          '&:focus': {
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: 'tooltip',
            width: 'auto',
            height: 'auto',
            clip: 'auto',
            px: 2,
            py: 1,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: 2,
            borderColor: 'primary.main',
            color: 'text.primary',
          },
        }}
      >
        Skip to main content
      </Box>

      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar
          sx={{
            gap: { xs: 1, md: 3 },
            flexWrap: 'wrap',
            px: { xs: 2, md: 3 },
            pt: { xs: 1, md: 0 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
              color: 'primary.main',
            }}
          >
            <Icon name="radar" size={20} />
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: '-0.2px',
                color: 'text.primary',
              }}
            >
              Repo Radar
            </Typography>
          </Box>

          <Box
            sx={{
              order: { xs: 3, md: 1 },
              width: { xs: '100%', md: 'auto' },
              mx: { xs: -2, md: 0 },
              px: { xs: 2, md: 0 },
            }}
          >
            <Navigation />
          </Box>

          <Box sx={{ flexGrow: 1, order: 2 }} />

          <Box sx={{ order: 2, flexShrink: 0 }}>
            <SettingsBar />
          </Box>
        </Toolbar>
      </AppBar>

      <Container id="main" component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <Suspense fallback={<LinearProgress aria-label="Loading" />}>
          <RouteErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/search" replace />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/tracked" element={<TrackedPage />} />
              <Route path="*" element={<Typography>Not found.</Typography>} />
            </Routes>
          </RouteErrorBoundary>
        </Suspense>
      </Container>
    </Box>
  )
}
