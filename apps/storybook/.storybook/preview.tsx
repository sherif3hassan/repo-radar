import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@repo-radar/ui'
import type { Preview } from '@storybook/react-vite'

/**
 * Only the theme — no store and no router.
 *
 * Everything in `ui` and `plots` takes its data as props, so nothing here needs
 * one. A story that suddenly requires a Provider is a sign a component has
 * reached for the store and broken the boundary.
 */
const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: { expanded: true },
  },
}

export default preview
