# AGENTS.md

Repo Radar: a dashboard that searches GitHub repositories and tracks their
stars, open issues and last commit date. React 19 · RTK Query · MUI v7 · zod ·
Vite, in a pnpm workspaces + Turborepo monorepo, deployed on Vercel. No backend.

Read before changing architecture: `CLAUDE.md` (the rules, short form),
`ARCHITECTURE.md` (package wiring).
`COMMITS.md` / `STATUS.md` / `TODO.md` / `PLAN.md` are gitignored local notes —
not project docs.

## Setup

- Node ≥ 20; pnpm is pinned via `packageManager` (pnpm@12.4.2), so
  `corepack enable` is enough. CI uses Node 22.
- The app reads **no environment variables** — `import.meta.env` appears
  nowhere, so don't add `VITE_*` plumbing (and never a token there: Vite
  inlines `VITE_*` into the public bundle at build time). The GitHub token is
  entered in the app's **Settings** UI, reaches `data-access` through a store
  accessor, and persists only in localStorage. `.env*` is gitignored but
  nothing consumes it.
- Never install with `--ignore-scripts`. The `unrs-resolver` postinstall
  (approved via `allowBuilds` in `pnpm-workspace.yaml`) is what lets
  `eslint-plugin-import-x` follow `.ts` imports; without it the boundary rules
  **silently pass everything** while lint still exits 0.

## Commands

```bash
pnpm dev          # turbo starts BOTH dev servers: web (:5173) + storybook (:6006, --no-open)
pnpm lint         # eslint incl. architectural boundary rules
pnpm typecheck    # tsc per package, ordered by turbo
pnpm test         # vitest per package
pnpm build        # builds apps/web (vite) AND apps/storybook (storybook build)
pnpm format       # prettier --write .
```

- `pnpm format:check` runs `prettier --check .` (format is the write form).
- One app only: `pnpm --filter @repo-radar/web dev` (or `@repo-radar/storybook`).
- One test file: `pnpm --filter @repo-radar/web exec vitest run src/features/tracked/TrackedPage.test.tsx`.
  Package `test` scripts run vitest in `run` mode (no watch) — use
  `pnpm --filter <pkg> exec vitest <pattern>` for watch mode.
- Single package: `pnpm --filter @repo-radar/data-access typecheck` etc.
- CI runs `pnpm turbo run lint typecheck test build` — mirror that before pushing.
- Vercel (`vercel.json`) deploys **web only**: `--filter=@repo-radar/web`, output
  `apps/web/dist`, SPA rewrite to `/index.html`.

## Architecture (the load-bearing part)

Packages are split by layer and every dependency points strictly downwards. The
**primary boundary enforcement is pnpm's strict, non-hoisted `node_modules`**:

- A package can only import what its own `package.json` declares. Adding a
  cross-package import means adding the `workspace:*` dependency to that
  package's `package.json` **first** — otherwise resolution fails at build time,
  before lint runs. If that feels wrong, it is wrong. Then run `pnpm install` to
  update the lockfile: CI and Vercel both install with `--frozen-lockfile`, so a
  stale `pnpm-lock.yaml` fails them.
- Every package's `exports` (`{ ".": "./src/index.ts" }`) seals it: deep imports
  like `@repo-radar/types/src/schemas` do not resolve. Import package roots only.
- Packages are consumed as TS source — no build steps, no `dist`.

| Package                                                    | May import                             | Must never import       |
| ---------------------------------------------------------- | -------------------------------------- | ----------------------- |
| `apps/web`, `apps/storybook`                               | everything in the graph                | —                       |
| `data-access` — all I/O: RTK Query API, fetch, rate limits | `types`, `util`, redux                 | `ui`, `plots`, `@mui/*` |
| `ui`, `plots` — presentational, props in / callbacks out   | `ui`-family, `types`, `util`, `@mui/*` | `data-access`, redux    |
| `types` — zod schemas, domain types, `GithubError`         | zod only                               | everything else         |
| `util` — pure helpers                                      | `types`                                | everything else         |

- `apps/storybook` is a **second consumer** of `ui` + `plots`, importing them
  exactly as `apps/web` does — a component that reaches for the store or fails to
  export breaks the storybook build.
- Features are folders in `apps/web/src/features/{search,tracked,settings}` and
  must never import each other — share via `apps/web/src/app/` or promote to a
  package.
- When a boundary lint fires, move the composition **up into `apps/web`** — do
  not relax the rule.

## State rules (easy to violate)

- RTK Query owns all server state: never copy fetched data into a slice, never
  `createAsyncThunk` for server state (thunks are for orchestration only, e.g.
  refresh-all — which uses `util`'s concurrency `pool` of 3, not
  `invalidateTags`).
- One RTK Query cache entry per repository — there is **no global `isLoading`**
  anywhere. Tracked repos are stored as identifiers, never snapshots.
- zod at exactly two boundaries: the GitHub API response edge (`data-access`)
  and localStorage hydration (`apps/web`). Nowhere else. Persisted state is
  versioned; a failed parse falls back to defaults, never throws.

## Toolchain quirks

- **Shared configs live in `packages/config`, consumed as source:** every package
  has it as a devDependency, and its `exports` map exposes
  `@repo-radar/config/eslint/{base,react,boundaries}`,
  `.../tsconfig/{base,browser,react}` and `.../prettier`. The root
  `eslint.config.js` and `prettier.config.js` only re-export them — change a
  rule or compiler flag in `packages/config`, not in per-package configs.
- **TypeScript is pinned `~6.0`; do not upgrade to 7.** TS7 ships no importable
  compiler API, so typescript-eslint cannot parse `.ts` — ESLint would stop
  reading the codebase and the boundary enforcement would silently die.
- Strict + `verbatimModuleSyntax` + `noUncheckedIndexedAccess`: type-only imports
  must use `import type`. `exactOptionalPropertyTypes` is deliberately off
  (React/MUI prop spreading).
- Vitest config lives in `apps/web/vite.config.ts` (imported from
  `vitest/config`, **not** `vite`). Tests use MSW at the network layer so the
  real store, RTK cache and zod schemas run; handlers/fixtures are in
  `apps/web/src/test/msw/`, helpers (`renderWithProviders`) in
  `apps/web/src/test/`.
- MUI system only: `sx` for one-offs, `styled()` for reusable components,
  `CssBaseline` reset. No Tailwind, no handwritten stylesheets; colours come
  from the theme — changing theme colours runs `packages/ui/src/theme.test.ts`,
  which asserts contrast ratios.
- Charts never use a dual axis (two measures → two charts); single series → no
  legend.

## Conventions

- Conventional Commits with the package/feature as scope: `feat(data-access): …`.
- Components `PascalCase.tsx`, hooks `useCamelCase.ts`, other files
  `camelCase.ts`; tests colocated as `*.test.ts(x)`.
