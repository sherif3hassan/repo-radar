import type { z } from 'zod'

import type { GithubError } from './errors'

export type ParseOutcome<T> = { ok: true; value: T } | { ok: false; error: GithubError }

/** Keeps a malformed response readable in an error state without dumping a wall of text. */
const MAX_ISSUES = 3

/**
 * Validate a response against a schema, returning a `GithubError` rather than
 * throwing.
 *
 * This lives in `types` so zod stays contained in the package that owns the
 * schemas — `data-access` applies them without depending on zod itself.
 */
export function parseWith<S extends z.ZodType>(
  schema: S,
  value: unknown,
): ParseOutcome<z.output<S>> {
  const result = schema.safeParse(value)

  if (result.success) {
    return { ok: true, value: result.data }
  }

  const issues = result.error.issues
    .slice(0, MAX_ISSUES)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ')

  const extra = result.error.issues.length - MAX_ISSUES

  return {
    ok: false,
    error: {
      kind: 'parse',
      issues: extra > 0 ? `${issues} (+${extra} more)` : issues,
    },
  }
}
