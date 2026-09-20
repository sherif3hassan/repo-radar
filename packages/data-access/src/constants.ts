export const API_ROOT = 'https://api.github.com'

export const ACCEPT = 'application/vnd.github+json'

/** Pinning the API version keeps a GitHub change from arriving unannounced. */
export const API_VERSION = '2022-11-28'

/**
 * Seconds an unused cache entry survives.
 *
 * Tracked repositories are revisited constantly, so holding results for five
 * minutes keeps navigation free against a 60/hour budget.
 */
export const CACHE_TTL_SECONDS = 300

export const SEARCH_PAGE_SIZE = 20

/**
 * Asking for a single item turns the `Link` header's last-page number into the
 * total count, which is one request instead of paging through every result.
 */
export const COUNT_PROBE_PAGE_SIZE = 1
