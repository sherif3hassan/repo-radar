import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import boundaries from 'eslint-plugin-boundaries'


const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')


const ELEMENT_TYPES = [
  { type: 'app', pattern: 'apps/web' },
  { type: 'app', pattern: 'apps/storybook' },
  { type: 'data-access', pattern: 'packages/data-access' },
  { type: 'ui', pattern: 'packages/ui' },
  { type: 'ui', pattern: 'packages/plots' },
  { type: 'types', pattern: 'packages/types' },
  { type: 'util', pattern: 'packages/util' },
]

const may = (from, ...to) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: { anyOf: to } } } },
})

const POLICIES = [
  may('app', 'data-access', 'ui', 'types', 'util'),
  may('data-access', 'types', 'util'),
  may('ui', 'ui', 'types', 'util'),
  may('util', 'types'),
]

const FEATURES = ['search', 'tracked', 'settings']

const NO_DEEP_IMPORTS = {
  group: ['@repo-radar/*/src/*'],
  message: 'Import the package root, not its internals.',
}

const NO_REDUX = {
  group: ['@reduxjs/toolkit', '@reduxjs/toolkit/*', 'react-redux'],
  message: 'Presentational packages take data as props. Connect in apps/web.',
}

const crossFeature = (self) => ({
  group: FEATURES.filter((other) => other !== self).map(
    (other) => `**/features/${other}/**`,
  ),
  message: 'Features must not import each other. Share via app/ or promote to a package.',
})

const restrict = (...patterns) => [
  'error',
  { patterns: [NO_DEEP_IMPORTS, ...patterns] },
]

export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/root-path': REPO_ROOT,
      'boundaries/elements': ELEMENT_TYPES,
      'boundaries/include': ['apps/**', 'packages/**'],
      'import/resolver': { typescript: true },
    },
    rules: {
      // default: 'disallow' means a package added later is denied until someone
      // writes a policy for it, rather than silently permitted.
      'boundaries/dependencies': ['error', { default: 'disallow', policies: POLICIES }],
      'no-restricted-imports': restrict(),
    },
  },

  {
    files: ['packages/ui/**/*.{ts,tsx}', 'packages/plots/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(NO_REDUX) },
  },

  ...FEATURES.map((self) => ({
    files: [`apps/web/src/features/${self}/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': restrict(crossFeature(self)) },
  })),
]
