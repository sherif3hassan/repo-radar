export {
  githubApi,
  useSearchReposQuery,
  useGetRepoStatsQuery,
  type SearchArgs,
} from './api'

export { setTokenAccessor, parseRateLimit, toGithubError } from './client'
export type { GithubRequest, GithubMeta } from './client'

export { getRateLimit, subscribeToRateLimit, resetRateLimit } from './rateLimitStore'
