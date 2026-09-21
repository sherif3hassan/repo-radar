import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseWith } from './parse'

const schema = z.object({ name: z.string(), age: z.number() })

describe('parseWith', () => {
  it('returns the parsed value on success', () => {
    const result = parseWith(schema, { name: 'Ada', age: 30 })

    expect(result).toEqual({ ok: true, value: { name: 'Ada', age: 30 } })
  })

  it('returns a parse error with a readable issue on failure', () => {
    const result = parseWith(schema, { name: 'Ada', age: 'thirty' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        kind: 'parse',
        issues: expect.stringContaining('age'),
      })
    }
  })

  /**
   * Keeps a malformed response readable in an error state without dumping a
   * wall of text — only the first `MAX_ISSUES` (3) are listed, the rest are
   * summarised with a count.
   */
  it('truncates beyond the first three issues', () => {
    const manyFields = z.object({
      a: z.string(),
      b: z.string(),
      c: z.string(),
      d: z.string(),
      e: z.string(),
    })

    const result = parseWith(manyFields, {})

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe('parse')
      expect(result.error).toMatchObject({
        issues: expect.stringMatching(/\(\+2 more\)$/),
      })
    }
  })
})
