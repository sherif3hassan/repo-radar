import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { rawCommits, rawRepo, rawSearchResponse } from './fixtures'

const OK_RATE_LIMIT = {
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': '59',
  'x-ratelimit-reset': '1789000000',
}

/**
 * Mocking at the network layer rather than stubbing the store means the real
 * store, the real RTK Query cache and the real zod schemas all run in tests.
 */
export const handlers = [
  http.get('https://api.github.com/search/repositories', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') ?? ''

    if (q === 'nothing') {
      return HttpResponse.json(rawSearchResponse([], 0), { headers: OK_RATE_LIMIT })
    }

    return HttpResponse.json(rawSearchResponse(), { headers: OK_RATE_LIMIT })
  }),

  http.get('https://api.github.com/repos/:owner/:name', ({ params }) =>
    HttpResponse.json(
      rawRepo({
        name: params.name,
        full_name: `${String(params.owner)}/${String(params.name)}`,
      }),
      { headers: OK_RATE_LIMIT },
    ),
  ),

  http.get('https://api.github.com/repos/:owner/:name/commits', () =>
    HttpResponse.json(rawCommits(), { headers: OK_RATE_LIMIT }),
  ),

  http.get('https://api.github.com/repos/:owner/:name/pulls', ({ params }) =>
    HttpResponse.json([{ id: 1 }], {
      headers: {
        ...OK_RATE_LIMIT,
        Link: `<https://api.github.com/repos/${String(params.owner)}/${String(params.name)}/pulls?state=open&per_page=1&page=50>; rel="last"`,
      },
    }),
  ),
]

export const server = setupServer(...handlers)
