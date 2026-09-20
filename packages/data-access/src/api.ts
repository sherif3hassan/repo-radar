import { createApi } from '@reduxjs/toolkit/query/react'
import {
  latestCommitSchema,
  parseWith,
  repoSchema,
  searchResponseSchema,
  toFullName,
  type RepoRef,
  type RepoStats,
  type SearchResult,
} from '@repo-radar/types'

import { countFromLink, githubBaseQuery } from './client'
import { CACHE_TTL_SECONDS, COUNT_PROBE_PAGE_SIZE, SEARCH_PAGE_SIZE } from './constants'

export interface SearchArgs {
  q: string
  perPage?: number
}

export const githubApi = createApi({
  reducerPath: 'github',
  baseQuery: githubBaseQuery,
  tagTypes: ['Repo'],
  keepUnusedDataFor: CACHE_TTL_SECONDS,
  endpoints: (build) => ({
    searchRepos: build.query<SearchResult, SearchArgs>({
      async queryFn({ q, perPage = SEARCH_PAGE_SIZE }, _api, _extra, baseQuery) {
        const response = await baseQuery({
          path: '/search/repositories',
          params: { q, per_page: perPage, sort: 'stars', order: 'desc' },
        })

        if (response.error) return { error: response.error }

        const parsed = parseWith(searchResponseSchema, response.data)
        return parsed.ok ? { data: parsed.value } : { error: parsed.error }
      },
    }),

    getRepoStats: build.query<RepoStats, RepoRef>({
      async queryFn(ref, _api, _extra, baseQuery) {
        const [repoResponse, commitResponse, pullsResponse] = await Promise.all([
          baseQuery({ path: `/repos/${ref.owner}/${ref.name}` }),
          baseQuery({
            path: `/repos/${ref.owner}/${ref.name}/commits`,
            params: { per_page: COUNT_PROBE_PAGE_SIZE },
          }),
          baseQuery({
            path: `/repos/${ref.owner}/${ref.name}/pulls`,
            params: { state: 'open', per_page: COUNT_PROBE_PAGE_SIZE },
          }),
        ])

        if (repoResponse.error) return { error: repoResponse.error }

        const repo = parseWith(repoSchema, repoResponse.data)
        if (!repo.ok) return { error: repo.error }

        let lastCommitAt: string | null = null
        if (!commitResponse.error) {
          const commit = parseWith(latestCommitSchema, commitResponse.data)
          if (commit.ok) lastCommitAt = commit.value
        }

        let openPullRequests: number | null = null
        if (!pullsResponse.error && Array.isArray(pullsResponse.data)) {
          openPullRequests = countFromLink(
            pullsResponse.meta?.link ?? null,
            pullsResponse.data.length,
          )
        }

        return {
          data: {
            ...repo.value,
            openIssues:
              openPullRequests === null
                ? repo.value.openIssues
                : Math.max(0, repo.value.openIssues - openPullRequests),
            openPullRequests,
            lastCommitAt,
          },
        }
      },
      providesTags: (_result, _error, ref) => [{ type: 'Repo', id: toFullName(ref) }],
    }),
  }),
})

export const { useSearchReposQuery, useGetRepoStatsQuery } = githubApi
