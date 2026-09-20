import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Icon } from '@repo-radar/ui'
import { visuallyHidden } from '@repo-radar/util'
import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'

import { SearchPage } from './features/search/SearchPage'
import { SettingsBar } from './features/settings/SettingsBar'

/**
 * Split out because the charting library is ~470 kB and is only needed here.
 * Search is the landing route, so it stays eager.
 */
const TrackedPage = lazy(() =>
  import('./features/tracked/TrackedPage').then((module) => ({ default: module.TrackedPage })),
)

const ROUTES = [
  { path: '/search', label: 'Search' },
  { path: '/tracked', label: 'Tracked' },
] as const

function Navigation() {
  const { pathname } = useLocation()
  const active = ROUTES.find((route) => pathname.startsWith(route.path))?.path ?? false

  return (
    <Tabs value={active} textColor="inherit" indicatorColor="primary" variant="standard">
      {ROUTES.map((route) => (
        <Tab
          key={route.path}
          value={route.path}
          label={route.label}
          to={route.path}
          component={Link}
        />
      ))}
    </Tabs>
  )
}

export function App() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      {/*
        Keyboard users otherwise tab through the brand, both tabs and three
        settings controls before reaching content, on every navigation.
        Hidden until focused.
      */}
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
        {/*
          One Navigation instance, not two. It wraps onto its own full-width
          row below `md` via `order` + `flexWrap`, so there is no duplicated
          tablist in the accessibility tree.
        */}
        <Toolbar
          sx={{
            gap: { xs: 1, md: 3 },
            flexWrap: 'wrap',
            px: { xs: 2, md: 3 },
            pt: { xs: 1, md: 0 },
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, color: 'primary.main' }}
          >
            <Icon name="radar" size={20} />
            {/*
              A span, not an h1. The brand is site furniture that repeats on
              every route; the page's own heading is its h1, so the heading
              outline describes where you are rather than what the product is
              called.
            */}
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.2px', color: 'text.primary' }}
            >
              Repo Radar
            </Typography>
          </Box>

          <Box
            sx={{
              order: { xs: 3, md: 1 },
              width: { xs: '100%', md: 'auto' },
              // The tab row sits flush with the app bar's bottom edge.
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
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tracked" element={<TrackedPage />} />
            <Route path="*" element={<Typography>Not found.</Typography>} />
          </Routes>
        </Suspense>
      </Container>
    </Box>
  )
}
