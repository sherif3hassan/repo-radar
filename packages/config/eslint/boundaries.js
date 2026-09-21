import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import boundaries from 'eslint-plugin-boundaries'

/**
 * Element patterns are matched against paths relative to the working
 * directory by default, so linting inside a package would classify nothing and
 * exit 0 while enforcing nothing. Pinning the root to this file's own location
 * makes the rules behave the same from anywhere.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

/**
 * Folder patterns, never ending in `/**`: that matches files rather than the
 * element folder, after which the plugin classifies nothing and reports
 * nothing.
 *
 * `plots` shares the `ui` type, so `ui` importing `plots` is allowed by the
 * matrix. `NO_UI_TO_PLOTS` closes that separately, because it is the seam that
 * keeps the charting library out of the eager bundle.
 */
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

/**
 * The secondary boundary: the primary one is each package's own dependency
 * list. `default: 'disallow'` means a package added later is denied until
 * someone writes a policy for it.
 */
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

const NO_UI_TO_PLOTS = {
  group: ['@repo-radar/plots', '@repo-radar/plots/*'],
  message:
    'ui is in the eager bundle and plots is the lazy chart chunk. Compose them in apps/web.',
}

/**
 * `boundaries/dependencies` only governs workspace elements, so the `@mui/*`
 * ban CLAUDE.md's matrix puts on `data-access` needs its own rule here — an
 * external package import has no boundary element to check against.
 */
const NO_MUI = {
  group: ['@mui/*', '@mui/*/*'],
  message: 'data-access is I/O only. MUI belongs in ui, plots or apps/web.',
}

/**
 * Bans a feature importing its siblings by any spelling.
 *
 * A glob on `features/<other>` only matches the absolute form. The relative
 * spellings an editor autocompletes (`../settings/x`, `../../settings/x`)
 * contain no `features` segment, so each depth is listed explicitly.
 */
const crossFeature = (self) => ({
  group: FEATURES.filter((other) => other !== self).flatMap((other) => [
    `**/features/${other}/**`,
    `../${other}`,
    `../${other}/**`,
    `../../${other}`,
    `../../${other}/**`,
  ]),
  message: 'Features must not import each other. Share via app/ or promote to a package.',
})

const restrict = (...patterns) => ['error', { patterns: [NO_DEEP_IMPORTS, ...patterns] }]

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
      'boundaries/dependencies': ['error', { default: 'disallow', policies: POLICIES }],
      'no-restricted-imports': restrict(),
    },
  },

  {
    files: ['packages/data-access/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(NO_MUI) },
  },

  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(NO_REDUX, NO_UI_TO_PLOTS) },
  },

  {
    files: ['packages/plots/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(NO_REDUX) },
  },

  ...FEATURES.map((self) => ({
    files: [`apps/web/src/features/${self}/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': restrict(crossFeature(self)) },
  })),
]
