export const API_ROOT = 'https://api.github.com'

export const ACCEPT = 'application/vnd.github+json'

export const API_VERSION = '2022-11-28'

/**
 * Seconds an unused cache entry survives.
 *
 * Tracked repositories are revisited constantly, so holding results for five
 * minutes keeps navigation free against a 60/hour budget.
 */
export const CACHE_TTL_SECONDS = 300

export const SEARCH_PAGE_SIZE = 20

export const COUNT_PROBE_PAGE_SIZE = 1

/**
 * Requests in flight at once, across the whole app.
 *
 * Every tracked repository mounts its own query, so a cold load fires all of
 * them in the same tick. GitHub throttles bursts of concurrent requests
 * separately from the hourly quota, and each one is committed before the first
 * response can report that the budget is gone.
 *
 * This bounds the burst, not the total: a token or fewer tracked repositories
 * is the only way to spend less.
 */
export const MAX_CONCURRENT_REQUESTS = 6

/**
 * GitHub's guidance when a secondary limit trips with no `Retry-After`: wait at
 * least a minute.
 */
export const SECONDARY_LIMIT_BACKOFF_SECONDS = 60
