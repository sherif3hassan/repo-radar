import { describe, expect, it } from 'vitest'

import { createLimiter } from './limiter'

/** A task that stays in flight until the test releases it. */
const gate = () => {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

const flush = async (): Promise<void> => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}

describe('createLimiter', () => {
  it('never runs more than `max` tasks at once', async () => {
    const limiter = createLimiter(2)
    const gates = Array.from({ length: 5 }, gate)

    let running = 0
    let peak = 0

    const done = gates.map((g) =>
      limiter.run(async () => {
        running += 1
        peak = Math.max(peak, running)
        await g.promise
        running -= 1
      }),
    )

    await flush()
    expect(running).toBe(2)

    for (const g of gates) g.release()
    await Promise.all(done)

    expect(peak).toBe(2)
  })

  it('starts queued tasks in the order they were submitted', async () => {
    const limiter = createLimiter(1)
    const gates = [gate(), gate(), gate()]
    const started: number[] = []

    const done = gates.map((g, index) =>
      limiter.run(async () => {
        started.push(index)
        await g.promise
      }),
    )

    await flush()
    gates[0]?.release()
    await flush()
    gates[1]?.release()
    await flush()
    gates[2]?.release()
    await Promise.all(done)

    expect(started).toEqual([0, 1, 2])
  })

  it('frees the slot when a task rejects', async () => {
    const limiter = createLimiter(1)

    const failing = limiter.run(async () => {
      throw new Error('boom')
    })
    const after = limiter.run(async () => 'ran')

    await expect(failing).rejects.toThrow('boom')
    await expect(after).resolves.toBe('ran')
  })

  /**
   * The reason it takes a signal at all: a request superseded while it waits
   * should cost nothing, not spend budget on a response nobody will read.
   */
  it('never starts a queued task whose signal aborts', async () => {
    const limiter = createLimiter(1)
    const blocker = gate()
    const controller = new AbortController()

    let ran = false
    const first = limiter.run(() => blocker.promise)
    const queued = limiter.run(async () => {
      ran = true
    }, controller.signal)

    await flush()
    controller.abort()
    blocker.release()

    await first
    await expect(queued).rejects.toBeDefined()
    expect(ran).toBe(false)
  })

  it('rejects immediately for a signal that is already aborted', async () => {
    const limiter = createLimiter(3)
    const controller = new AbortController()
    controller.abort()

    let ran = false
    await expect(
      limiter.run(async () => {
        ran = true
      }, controller.signal),
    ).rejects.toBeDefined()

    expect(ran).toBe(false)
  })

  it('lets an already-running task carry on when its signal aborts', async () => {
    const limiter = createLimiter(1)
    const controller = new AbortController()
    const inFlight = gate()

    const result = limiter.run(async () => {
      await inFlight.promise
      return 'finished'
    }, controller.signal)

    await flush()
    controller.abort()
    inFlight.release()

    await expect(result).resolves.toBe('finished')
  })

  it('rejects a max below 1', () => {
    expect(() => createLimiter(0)).toThrow(RangeError)
  })

  /**
   * A synchronous throw from `task()` used to escape before `.finally()`
   * ever attached, leaking the slot `active` was given for it. After
   * `max` such throws the limiter would deadlock permanently.
   */
  it('frees the slot when a task throws synchronously', async () => {
    const limiter = createLimiter(6)

    const failing = Array.from({ length: 6 }, () =>
      limiter.run(() => {
        throw new Error('sync')
      }),
    )
    await Promise.allSettled(failing)

    let ran = false
    await limiter.run(async () => {
      ran = true
    })

    expect(ran).toBe(true)
  })
})
