import { z } from 'zod'

/**
 * GitHub's wire format stops here.
 *
 * Each schema validates only the fields we consume — about ten of the hundred
 * GitHub returns — then renames them, so nothing downstream sees snake_case or
 * needs to know which API the data came from.
 */
const repoResponse = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.url(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  open_issues_count: z.number(),
  default_branch: z.string(),
  pushed_at: z.string(),
  owner: z.object({
    login: z.string(),
    avatar_url: z.url(),
  }),
})

export const repoSchema = repoResponse.transform((r) => ({
  id: r.id,
  name: r.name,
  fullName: r.full_name,
  owner: r.owner.login,
  avatarUrl: r.owner.avatar_url,
  description: r.description,
  htmlUrl: r.html_url,
  language: r.language,
  stars: r.stargazers_count,
  openIssues: r.open_issues_count,
  defaultBranch: r.default_branch,
  /** Push time, not commit time — see `lastCommitAt` on {@link RepoStats}. */
  pushedAt: r.pushed_at,
}))

export type Repo = z.infer<typeof repoSchema>

export const searchResponseSchema = z
  .object({
    total_count: z.number(),
    incomplete_results: z.boolean(),
    items: z.array(repoSchema),
  })
  .transform((r) => ({
    totalCount: r.total_count,
    incomplete: r.incomplete_results,
    items: r.items,
  }))

export type SearchResult = z.infer<typeof searchResponseSchema>

/**
 * `GET /repos/{owner}/{repo}/commits?per_page=1`, reduced to a date.
 *
 * `committer` is nullable on commits GitHub cannot attribute, so the result is
 * `string | null` rather than a throw.
 */
export const latestCommitSchema = z
  .array(
    z.object({
      commit: z.object({
        committer: z.object({ date: z.string() }).nullish(),
      }),
    }),
  )
  .transform((commits) => commits[0]?.commit.committer?.date ?? null)

/**
 * One repository's full picture, composed from three requests into a single
 * cache entry by `data-access`.
 *
 * `openIssues` is the *corrected* count: GitHub's `open_issues_count` counts
 * pull requests as issues — facebook/react reports 1,381 where its Issues tab
 * shows 855 — so open PRs are fetched and subtracted. When that request fails,
 * `openPullRequests` is null and `openIssues` falls back to GitHub's figure.
 */
export type RepoStats = Repo & {
  lastCommitAt: string | null
  openPullRequests: number | null
}
