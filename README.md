# Repo Radar

Search GitHub repositories, track your favourites, and monitor their stars, open
issues and last commit date.

**Live:** [repo-radar-lilac.vercel.app](https://repo-radar-lilac.vercel.app/)

---

## Quick start

Requires Node ≥ 20 and pnpm (the version is pinned in `packageManager`, so
`corepack enable` is enough).

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

```bash
pnpm lint         # eslint, including the architectural boundary rules
pnpm typecheck    # tsc across every package
pnpm test         # vitest — 277 tests
pnpm build        # production build into apps/web/dist
```

Storybook runs every `ui` and `plots` component in isolation:

```bash
pnpm --filter @repo-radar/storybook dev     # http://localhost:6006
```

It is a **second consumer** of those packages, importing them exactly as
`apps/web` does — so a component that reaches for the store or fails to export
something breaks the build rather than passing unnoticed. It is also the only
practical way to see states like an exhausted rate limit or a repository with
no attributable commit without provoking them for real.

### A token for local development

The app works unauthenticated, but GitHub allows only **60 requests/hour** that
way, and each tracked repository costs three. Add a token through **Settings**
in the app header; it is stored in your browser only. There is no `.env` to
configure and no token in the bundle.

---

## What it does

| Requirement                            | Where                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Debounced repository search            | `features/search/useDebouncedValue.ts` — 400 ms trailing edge, minimum two characters, `?q=` kept in sync |
| Track / untrack                        | From search results and from each tracked row                                                             |
| Tracked repos view                     | `/tracked` — summary tiles, two charts, then a card grid (1 / 2 / 3 columns)                              |
| Stars, open issues, last commit date   | The commit date comes from the commits endpoint, not `pushed_at`; open issues excludes pull requests      |
| Refresh one / refresh all              | Per-row refresh, plus a concurrency-limited refresh-all                                                   |
| Independent loading and error per repo | One RTK Query cache entry per repository                                                                  |
| localStorage persistence               | Versioned and schema-validated on read                                                                    |
| Bar chart of stars                     | `packages/plots`, with a data table as its accessible equivalent                                          |
| Theme switching                        | Light / dark, plus text size, line spacing, motion and typeface                                           |
| Additional chart                       | Days since last commit, banded by activity — a second chart, never a second axis                          |
| Storybook                              | `apps/storybook`, a second consumer of `ui` and `plots`                                                   |

---

## Architecture

Six packages in a pnpm + Turborepo monorepo, split by layer. Every dependency
points strictly downwards.

```
apps/web            composition — the only place that wires data to pixels
  ├── data-access   all I/O: RTK Query, fetch, rate limits
  ├── ui            presentational MUI components
  ├── plots         charts, domain-agnostic
  ├── types         zod schemas, domain types, error union
  └── util          pure helpers
```

**[ARCHITECTURE.md](./ARCHITECTURE.md)** has the full treatment — package graph,
a data-flow diagram, why `types` exists, smart/dumb components, and the
deliberate deviations from Nx convention.

### The decisions that mattered

**RTK Query, and one cache entry per repository.** The brief's two hardest
requirements — independent loading/error per repo, and refreshing one or all —
are properties of a per-key cache rather than code to write. Each row calls
`useGetRepoStatsQuery(ref)` and owns its own entry, so **there is no global
`isLoading` anywhere in this app**. The alternative, a hand-rolled
`Record<id, {data, status, error}>` with manual deduplication, staleness and
cancellation, is the code this design exists to avoid.

**Three requests, one cache entry.** `GET /repos/{owner}/{repo}` carries
`pushed_at`, but that is _push_ time and fires for any branch or tag, so the
real last-commit date needs the commits endpoint. And `open_issues_count` counts
pull requests as issues, so the open PR count is fetched and subtracted. All
three run concurrently inside one `queryFn`; only the first can fail the entry,
and the other two degrade rather than hiding the stats that did arrive.

**Refresh-all uses a concurrency pool, not `invalidateTags`.** The one-liner
fires every refetch simultaneously: twenty tracked repositories would be sixty
instant requests against a 60/hour budget. A pool of three keeps per-row
independence, and every request also passes through one limiter in `data-access`
so a cold load cannot burst either. A request cancelled while still queued never
starts.

**Boundaries are enforced by dependency lists first.** pnpm does not hoist, so a
package can only import what its own `package.json` declares — an undeclared
import fails to resolve and breaks the build before lint runs. ESLint
(`eslint-plugin-boundaries`) restates the same architecture in one readable place
and default-denies anything new.

**zod at exactly two boundaries.** The GitHub response edge and localStorage
hydration — nowhere else. Persisted data is genuinely untrusted: it was written
by a _previous version of this app_, so a version stamp and a validated read are
the difference between a stale deploy and a white screen.

**The error union is a domain type.** `GithubError` lives in `types`, not
`data-access`, because `ui` renders those states and must not import the data
layer to learn their shape. Rate limiting, a rejected token and rejected search
queries each get their own branch — the last carries GitHub's own message, which
names the offending qualifier rather than showing a bare 422. Primary quota
exhaustion and GitHub's separate secondary limit are told apart, because the
advice differs: one says wait for the reset, the other says slow down.

---

## Accessibility

Meets **WCAG 2.2 AA throughout**, and **AAA for contrast (1.4.6), target size
(2.5.5) and visual presentation (1.4.8)**. Those are specific criteria rather
than a blanket claim — WCAG itself advises against requiring full AAA
conformance across a whole site.

- **Every colour pair was measured, not chosen by eye.** Text clears 7:1 and
  meaningful non-text clears 3:1, in both schemes. `packages/ui/src/theme.test.ts`
  asserts the ratios so they cannot silently regress.
- **The chart ships a data table** as its accessible equivalent, carrying the
  real numbers. An SVG of rectangles conveys nothing to a screen reader — or to
  an agent reading the DOM.
- **Colour is never the only signal.** Commit freshness pairs its dot with a
  word (Active / Quiet / Stale) that assistive technology reads.
- **A real `<table>`** with `th[scope]`, so columns are announced rather than
  implied by position.
- **Chart and text colours follow the colour scheme.** MUI freezes
  `theme.palette` to the light scheme once CSS variables are on, which had
  chart labels at about 1.9:1 in dark mode; tests now render dark and assert the
  dark values arrive.
- Skip link, a labelled `<nav>` landmark (links, not a tablist), single `h1` per
  page, live region announcing search results, keyboard focus rings, 44px
  targets. Hints on stat chips and tiles are keyboard-focusable.
- **Preferences**: text size, line spacing, reduced motion and Atkinson
  Hyperlegible. Applied by rebuilding the theme, so no component knows they
  exist.

On the typeface: Atkinson Hyperlegible was chosen over OpenDyslexic
deliberately. Studies have generally not found reliable reading gains from
dyslexia-specific faces, while disambiguated letterforms, larger text and wider
spacing have better support — which is why the size and spacing controls carry
the real weight.

---

## Testing

277 tests with Vitest, Testing Library and MSW. Mocking at the network layer
means the real store, the real RTK Query cache and the real zod schemas all run.

The tests worth reading:

- **Per-repo isolation** (`TrackedPage.test.tsx`) — one repository 404s and
  reports its own error while its neighbour resolves normally. This is the test
  for the requirement the whole design is built around.
- **Debounce** — five keystrokes produce exactly one request.
- **Hydration fallback** (`persistence.test.ts`) — malformed, outdated and
  unreadable payloads all fall back to defaults instead of throwing, including
  when storage itself throws, and a payload written before preferences existed
  still loads.
- **Contrast** (`theme.test.ts`) — every text and graphic pair, both schemes,
  including a guard against merging the chart token back into `primary`.
- **Rate limiting** — a 403 with budget remaining is _not_ treated as rate
  limiting, because 403 is overloaded. A 403 that carries a secondary-limit
  message, and a 401 from a bad token, each map to their own error.
- **Render counts** (`useTrackedMetrics.test.tsx`) — resolving one repository
  must not rebuild chart data for the others. Verified by mutation: removing the
  `shallowEqual` guard fails the test.
- **Concurrency** (`limiter.test.ts`, `pool.test.ts`) — deterministic, using
  deferred promises rather than timers. After a task fails, `pool` starts
  nothing new and waits for in-flight work before rejecting.
- **`ui` and `plots` are tested directly**, not only through `apps/web` and
  Storybook — every chart, `ErrorState`'s eight error kinds (including that
  `dense` keeps the same guidance, only tighter), `RepoCard`'s per-card error
  isolation, and that a hinted `StatChip`/`StatTile` is keyboard-focusable.
  `--passWithNoTests` is gone from every package: an emptied test file now
  fails the build instead of passing silently.
- **`types` is covered on its own** — `parseFullName` round-trips through
  `toFullName` and rejects malformed input, and `parseWith` truncates a long
  list of schema issues rather than dumping them into an error state. It owns
  every schema in the app, so it is the wrong package to reach only indirectly.
- **Tracking from search, and persistence end to end** (`store.test.ts`,
  `SearchPage.test.tsx`) — clicking Track updates the button, the store and
  localStorage; a fresh `makeStore()` reads back exactly what a previous
  session wrote, including a payload with only its preferences corrupted.

Coverage is not a target; these are chosen for the risk they carry.

---

## Deployment

Vercel, configured in `vercel.json`: `pnpm turbo run build --filter=@repo-radar/web`,
output `apps/web/dist`, with an SPA rewrite so client routes deep-link.

The tracked route is lazy-loaded, keeping the charting library off the landing
bundle — 235 kB gzipped initial, with a 95 kB chart chunk fetched on demand.

CI runs lint, typecheck, test, build and a formatting check on every push and
pull request, with `GITHUB_TOKEN` pinned to `contents: read`.

---

## Assumptions and limitations

- **Rate limits.** 60 requests/hour unauthenticated, and each repository costs
  three. The app surfaces the remaining budget in the header and accepts a
  user-supplied token (5,000/hour), but **no token ships in the deployed
  bundle** — Vite inlines `VITE_*` at build time, so one there would be public.
- **A token in localStorage is readable by any script on the origin.** An
  accepted trade for a client-only app with no backend; the dialog says so, and
  a no-scope token reading public data is the recommendation.
- **Three requests per repository.** Accuracy was chosen over request count, so
  refreshing ten repositories costs 30 of an unauthenticated 60. The PR count is
  read from the `Link` header with `per_page=1`, so it is one request rather
  than paging.
- **The concurrency cap bounds bursts, not the total.** Six requests at a time
  keeps a cold load from tripping GitHub's secondary limit, but it does not
  reduce the hourly cost: ten tracked repositories are still thirty requests.
  Making the open-pull-request count optional would cut that by a third; it is
  left as a known trade-off rather than silently dropped.
- **Conditional requests are not used.** A `304` response to an `If-None-Match`
  request does not count against the quota, but nothing here sends one: a manual
  refresh always refetches in full.
- **The header shows the `core` budget only.** GitHub meters `core` (60/hour) and
  `search` (10/minute) separately. Both are recorded, each under its own key, so
  they cannot overwrite one another, but only `core` is displayed. A search-limit
  error still reaches the user through the search page's own error state.
- **Search is not paginated.** Top 20 by stars. The brief describes a tracking
  dashboard, not a repository browser.
- **Search qualifiers are not validated client-side.** A whitelist would reject
  valid qualifiers as GitHub adds them, and a denylist is fiddly (`is:` is valid
  for repository search, `is:open` is not). GitHub's own 422 message names the
  problem precisely, so it is surfaced verbatim. The cost is one wasted request.
- **No backend.** Tracked repositories live in one browser's localStorage — no
  cross-device sync, and no server-side cache to soften rate limits.
- **Features are folders, not packages.** Nx convention would make
  `feature-search` and `feature-tracked` libraries. At three features that trades
  real configuration for a constraint lint already provides — the seam is real,
  and promoting one later is a directory move.
- **No E2E tests, and no automated axe/Lighthouse run.** Cut for time in favour
  of targeted integration tests at the network boundary.
- **TypeScript is pinned below 7.** TS 7's native compiler exposes no importable
  compiler API until 7.1, so typescript-eslint cannot load it — and without its
  parser, ESLint cannot read `.ts` at all. Since every boundary rule here is an
  ESLint rule, upgrading would silently disable the architecture's enforcement
  while typecheck stayed green.
