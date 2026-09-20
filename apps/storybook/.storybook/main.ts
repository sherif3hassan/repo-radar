import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Stories live here rather than beside the components on purpose.
 *
 * This app is a *second consumer* of `ui` and `plots`, importing them exactly
 * as `apps/web` does. If a component needs something the package does not
 * export, the story fails to compile — which is the point: it demonstrates the
 * package split rather than asserting it. It also keeps Storybook's dependency
 * out of the libraries themselves.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}

export default config
