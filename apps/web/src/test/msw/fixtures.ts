/** Shapes mirror GitHub's wire format — snake_case — because that is what the schemas parse. */
export const rawRepo = (overrides: Record<string, unknown> = {}) => ({
  id: 10_270_250,
  name: 'react',
  full_name: 'facebook/react',
  description: 'The library for web and native user interfaces.',
  html_url: 'https://github.com/facebook/react',
  language: 'JavaScript',
  stargazers_count: 228_000,
  open_issues_count: 950,
  default_branch: 'main',
  pushed_at: '2026-09-18T09:30:00Z',
  owner: {
    login: 'facebook',
    avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4',
  },
  ...overrides,
})

export const rawSearchResponse = (items = [rawRepo()], totalCount = items.length) => ({
  total_count: totalCount,
  incomplete_results: false,
  items,
})

export const rawCommits = (date = '2026-09-17T14:02:11Z') => [
  { commit: { committer: { date } } },
]

export const RATE_LIMIT_HEADERS = {
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': '0',
  'x-ratelimit-reset': '1789000000',
}
