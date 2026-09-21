# Repo Radar

Search GitHub repos, track favourites, monitor stars/open issues/last commit.

**Live:** [repo-radar-lilac.vercel.app](https://repo-radar-lilac.vercel.app/)

---

## Quick start

Requires Node ≥ 20 and pnpm (`corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

```bash
pnpm lint         # eslint + boundary rules
pnpm typecheck    # tsc across all packages
pnpm test         # vitest — 277 tests
pnpm build        # production build → apps/web/dist
```

```bash
pnpm --filter @repo-radar/storybook dev     # http://localhost:6006
```

Storybook is a second consumer of `ui`/`plots` — catches breakage `apps/web` alone wouldn't.

### Token (optional)

Unauthenticated: 60 req/hour, 3 req per tracked repo. Add a token via **Settings** in the header — stored in browser only, never in the bundle, no `.env` needed.

---

## Features

| Feature                         | Notes                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Debounced search                | 400ms trailing, min 2 chars, `?q=` synced                                     |
| Track / untrack                 | From search results and tracked rows                                          |
| `/tracked` view                 | Summary tiles, 2 charts, card grid                                            |
| Stars, open issues, last commit | Commit date from commits endpoint, not `pushed_at`; issues exclude PRs        |
| Refresh one / refresh all       | Per-row + concurrency-limited refresh-all                                     |
| Per-repo loading/error          | One RTK Query cache entry per repo, no global `isLoading`                     |
| localStorage persistence        | Versioned, schema-validated                                                   |
| Charts                          | Stars bar chart + days-since-commit chart, each with an accessible data table |
| Theme                           | Light/dark, text size, line spacing, motion, typeface                         |

---

## Architecture

```
apps/web            composition — wires data to pixels
  ├── data-access   all I/O: RTK Query, fetch, rate limits
  ├── ui            presentational MUI components
  ├── plots         charts, domain-agnostic
  ├── types         zod schemas, domain types, error union
  └── util          pure helpers
```

Six packages, pnpm + Turborepo, dependencies point strictly downward. Full detail: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

Key decisions:

- **One RTK Query cache entry per repo** → per-repo loading/error and refresh-one/all come free.
- **3 requests per repo, 1 cache entry** — repo details, commits (real last-commit date), open-PR count (subtracted from issues). Run concurrently; only the repo-details call can fail the entry.
- **Refresh-all uses a concurrency pool (3), not `invalidateTags`** — avoids bursting the 60/hour budget. A global limiter in `data-access` also caps cold loads.
- **Boundaries enforced by package.json first, ESLint second** — pnpm doesn't hoist, so undeclared imports fail to resolve.
- **zod only at two boundaries** — GitHub API responses and localStorage hydration.
- **`GithubError` union lives in `types`**, not `data-access`, so `ui` can render error states without importing the data layer.

---

## Accessibility

WCAG 2.2 AA throughout; AAA for contrast, target size, and visual presentation.

- Every colour pair measured (7:1 text, 3:1 non-text), both schemes — asserted in `theme.test.ts`.
- Charts ship a data table as their accessible equivalent.
- Colour never the only signal (commit freshness pairs dot + word).
- Real `<table>` with `th[scope]`.
- Skip link, labelled `<nav>`, single `h1`, live region for search results, focus rings, 44px targets.
- Preferences: text size, line spacing, reduced motion, Atkinson Hyperlegible.

---

## Testing

277 tests — Vitest, Testing Library, MSW (mocked at network layer, real store/cache/schemas).

Notable coverage:

- Per-repo isolation — one repo 404s, neighbour still resolves.
- Debounce — 5 keystrokes → 1 request.
- Hydration fallback — malformed/outdated/unreadable payloads fall back to defaults, never throw.
- Contrast — every text/graphic pair, both schemes.
- Rate limiting — 403-with-budget vs. secondary-limit 403 vs. 401 each map correctly.
- Render counts — resolving one repo doesn't rebuild others' chart data.
- Concurrency (`limiter`, `pool`) — deterministic, deferred-promise based.
- `ui`/`plots`/`types` tested directly, not just through `apps/web`.

---

## Deployment

Vercel, via `vercel.json`: `pnpm turbo run build --filter=@repo-radar/web`, output `apps/web/dist`, SPA rewrite for deep links.

`/tracked` is lazy-loaded (charts off the landing bundle): 235 kB gzip initial, 95 kB chart chunk on demand.

CI runs lint, typecheck, test, build, format-check on every push/PR.

---

## Known limitations

- 60 req/hour unauthenticated, 3 per repo. No token ships in the bundle.
- Token in localStorage is readable by any script on the origin — accepted trade-off for a backend-less app.
- Concurrency cap (6) bounds bursts, not hourly total.
- No conditional requests (ETags) — every refresh refetches in full.
- Only `core` rate-limit budget shown in header (not `search`).
- Search: top 20 by stars, no pagination.
- Search qualifiers not validated client-side — GitHub's 422 message is surfaced verbatim.
- No backend — no cross-device sync.
- Features are folders, not packages (fine at 3 features).
- No E2E tests, no automated axe/Lighthouse run.
- TypeScript pinned below 7 — typescript-eslint has no TS7 support yet.
