import { describe, expect, it } from 'vitest'

import { pool } from './pool'

/**
 * These tests use deferred promises rather than timers. `util` compiles without
 * DOM or Node libs (it is environment-agnostic), so `setTimeout` is not in
 * scope — and manual gates make concurrency assertions deterministic instead of
 * timing-dependent.
 */
const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

/** Drain pending microtasks so queued workers can advance. */
const flush = async (): Promise<void> => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}

describe('pool', () => {
  it('returns results in input order regardless of completion order', async () => {
    const gates = [deferred(), deferred(), deferred()]

    const running = pool([0, 1, 2], 3, async (index) => {
      await gates[index]!.promise
      return index
    })

    // Finish out of order.
    gates[2]!.resolve()
    gates[0]!.resolve()
    gates[1]!.resolve()

    expect(await running).toEqual([0, 1, 2])
  })

  it('never exceeds the concurrency limit', async () => {
    const items = [0, 1, 2, 3, 4, 5]
    const gates = items.map(() => deferred())

    let inFlight = 0
    let peak = 0

    const running = pool(items, 2, async (index) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await gates[index]!.promise
      inFlight -= 1
    })

    await flush()
    expect(inFlight).toBe(2)

    for (const gate of gates) gate.resolve()
    await running

    expect(peak).toBe(2)
  })

  it('starts a queued item only once a slot frees up', async () => {
    const gates = [deferred(), deferred(), deferred()]
    const started: number[] = []

    const running = pool([0, 1, 2], 2, async (index) => {
      started.push(index)
      await gates[index]!.promise
    })

    await flush()
    expect(started).toEqual([0, 1])

    gates[0]!.resolve()
    await flush()
    expect(started).toEqual([0, 1, 2])

    for (const gate of gates) gate.resolve()
    await running
  })

  it('handles an empty list without starting work', async () => {
    let calls = 0
    const results = await pool([], 3, async () => {
      calls += 1
    })

    expect(results).toEqual([])
    expect(calls).toBe(0)
  })

  it('does not start more workers than there are items', async () => {
    const results = await pool([1, 2], 10, async (n) => n * 2)
    expect(results).toEqual([2, 4])
  })

  it('rejects a limit below 1', async () => {
    await expect(pool([1], 0, async (n) => n)).rejects.toThrow(RangeError)
  })

  it('propagates a task failure', async () => {
    await expect(
      pool([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('boom')
        return n
      }),
    ).rejects.toThrow('boom')
  })
})
