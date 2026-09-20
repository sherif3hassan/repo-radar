/**
 * How a repository is identified everywhere in the app.
 *
 * Tracked repositories are stored as these identifiers, never as snapshots of
 * fetched data — RTK Query owns everything fetched.
 */
export interface RepoRef {
  owner: string
  name: string
}

/** The canonical string form, used as cache key and localStorage entry. */
export const toFullName = (ref: RepoRef): string => `${ref.owner}/${ref.name}`

export const parseFullName = (value: string): RepoRef | null => {
  const parts = value.split('/')
  if (parts.length !== 2) return null

  const [owner, name] = parts
  if (!owner || !name) return null

  return { owner, name }
}
