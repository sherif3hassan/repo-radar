import { describe, expect, it } from 'vitest'

import { parseFullName, toFullName } from './repo'

describe('parseFullName', () => {
  it('round-trips through toFullName', () => {
    const ref = { owner: 'facebook', name: 'react' }

    expect(parseFullName(toFullName(ref))).toEqual(ref)
  })

  it('rejects an empty string', () => {
    expect(parseFullName('')).toBeNull()
  })

  it('rejects a single-part value with no slash', () => {
    expect(parseFullName('facebook')).toBeNull()
  })

  it('rejects a three-part value', () => {
    expect(parseFullName('facebook/react/extra')).toBeNull()
  })

  it('rejects a value with an empty owner or name', () => {
    expect(parseFullName('/react')).toBeNull()
    expect(parseFullName('facebook/')).toBeNull()
  })
})
