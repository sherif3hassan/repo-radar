# Repo Radar

A dashboard to search GitHub repositories, track favourites, and monitor their
stars, open issues and last commit date.

## Stack

React 19 · TypeScript 6 (strict) · Redux Toolkit + RTK Query · MUI v7 ·
`@mui/x-charts` · zod · Vite · Vitest + Testing Library + MSW ·
pnpm workspaces + Turborepo · deployed on Vercel.

**TypeScript is pinned to `~6.0` deliberately. Do not upgrade to 7.**
TypeScript 7 (the native compiler) ships no importable compiler API, so
typescript-eslint cannot run against it — its peer range is `>=4.8.4 <6.1.0`.
Since every boundary rule in this repo is an ESLint rule, TS 7 would disable the
architecture's enforcement. Revisit when typescript-eslint supports 7.1.

## Commands

```bash
pnpm dev          # turbo run dev
pnpm build        # turbo run build  (builds apps/web and apps/storybook)
pnpm typecheck    # tsc -b across the graph
pnpm lint         # eslint, including boundary rules
pnpm test         # vitest
pnpm format       # prettier --write .
```

## Architecture

Packages are split by **layer**. Every dependency points strictly downwards; the
graph is acyclic by construction.

```
apps/web            composition — the only place that wires data to pixels
  ├── data-access   all I/O: RTK Query, fetch, rate limits
  ├── ui            presentational, domain-aware, I/O-free
  ├── plots         presentational, domain-agnostic
  ├── types         zod schemas, types, error union — no I/O, no React, no MUI
  └── util          pure helpers — no dependencies at all
```

`plots` is a separate package but the same **type** as `ui` — types are rows in
the policy matrix, not per-package labels.

| Type          | Packages      | May import                      | Must never import       |
| ------------- | ------------- | ------------------------------- | ----------------------- |
| `app`         | `apps/web`    | everything                      | —                       |
| `data-access` | `data-access` | `types`, `util`                 | `ui`, `plots`, `@mui/*` |
| `ui`          | `ui`, `plots` | `ui`, `types`, `util`, `@mui/*` | `data-access`, redux    |
| `types`       | `types`       | zod only                        | everything else         |
| `util`        | `util`        | `types`                         | everything else         |

**The primary enforcement is each package's own dependency list** — pnpm does not
hoist, so an undeclared import fails to resolve and breaks the build before lint
runs. `exports` (not `main`) seals each package so deep imports do not resolve
either. The ESLint matrix in `packages/config/eslint/boundaries.js` is secondary:
it restates the architecture in one readable place, default-denies anything new,
and covers what dependency lists cannot express (feature isolation, no-cycle,
the redux ban).

So: **adding a cross-package import means adding it to that package's
`package.json` first.** If that feels wrong, it is wrong.

**When a boundary rule fires, move the composition up into `apps/web`. Do not
relax the rule.** The canonical case: `RepoCard` lives in `ui` as a
props-only component; `TrackedRepoCard` in `apps/web` owns the query hook and
maps `RepoStats` to props.

## Hard rules

**State**

- RTK Query owns everything fetched. Never copy server data into a slice.
- Never `createAsyncThunk` for server state — it is the pattern this design
  replaces. Thunks are for orchestration only (e.g. refresh-all).
- Tracked repos are stored as identifiers (`owner/name`), never snapshots.
- One cache entry per repo. There is no global `isLoading` anywhere in this app;
  if you are about to add one, the design has gone wrong.

**Packages**

- Every package exports `./src/index.ts`. No build steps, no `dist`.
- Import package roots, never `@repo-radar/*/src/*`.
- A helper used by exactly one package belongs in that package, not in `util`.
- Features under `apps/web/src/features` never import each other. Share via
  `app/` or promote to a package.

**Validation**

- zod is used at exactly two boundaries: the GitHub API response edge, and
  localStorage hydration. Nowhere else — not in props, not in the store.
- Persisted state is versioned; a failed parse falls back to defaults and clears
  the key. It must never throw.

**Secrets**

- No GitHub token is ever committed, logged, or built into the bundle. Vite
  inlines `VITE_*` at build time, so a token there would be public.
- Local development uses a gitignored `.env.local`. The deployed app is
  unauthenticated unless the user supplies their own token at runtime, which
  stays in their browser.

**Styling**

- MUI's system only: `sx` for one-offs, `styled()` for reusable components,
  `CssBaseline` for the reset. No Tailwind, no hand-written stylesheets.
- Colours, spacing and typography come from the theme, never hard-coded. The
  chart palette reads the same tokens.

**Charts**

- Never a dual-axis chart. Two measures of different magnitude means two charts.
- Single series means no legend; the title names the measure.
- Validate palettes with the dataviz skill's script for light _and_ dark.

## Conventions

- Conventional Commits with the package or feature as scope:
  `feat(data-access): add RTK Query api with searchRepos and getRepoStats`.
- Components in `PascalCase.tsx`, hooks in `useCamelCase.ts`, everything else
  `camelCase.ts`.
- `type` imports use `import type`.
- Tests sit beside the code as `*.test.ts(x)`.
