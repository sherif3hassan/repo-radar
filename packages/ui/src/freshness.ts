export interface Freshness {
  label: 'Active' | 'Quiet' | 'Stale' | 'Unknown'
  tone: 'success' | 'warning' | 'error'
}

/**
 * Days-since-last-commit, banded into a label and a status tone.
 *
 * Shared by `RepoCard` and `SearchResultList`'s freshness dot, so the
 * threshold logic lives in one place.
 */
export const freshness = (iso: string | null): Freshness => {
  if (!iso) return { label: 'Unknown', tone: 'warning' }

  const days = (Date.now() - Date.parse(iso)) / 86_400_000
  if (Number.isNaN(days)) return { label: 'Unknown', tone: 'warning' }
  if (days <= 30) return { label: 'Active', tone: 'success' }
  if (days <= 365) return { label: 'Quiet', tone: 'warning' }
  return { label: 'Stale', tone: 'error' }
}
