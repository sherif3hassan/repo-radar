export interface Limiter {
  /** Runs `task` once a slot is free. Rejects without running it if `signal` aborts first. */
  run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T>
}

interface Waiting {
  start: () => void
  cancel: (reason: unknown) => void
}

/**
 * Caps how many tasks run at once, first in first out.
 *
 * Cold-loading ten tracked repositories fires thirty requests in the same
 * tick. GitHub throttles bursts of concurrent requests separately from the
 * hourly quota, and every one of those requests is committed before the first
 * response can tell us the budget is gone.
 *
 * A queued task that is aborted never starts, which is the point: a request
 * superseded while it waited costs nothing.
 */
export function createLimiter(max: number): Limiter {
  if (max < 1) throw new RangeError(`limiter max must be >= 1, got ${max}`)

  let active = 0
  const queue: Waiting[] = []

  const next = (): void => {
    while (active < max) {
      const waiting = queue.shift()
      if (!waiting) return

      active += 1
      waiting.start()
    }
  }

  return {
    run(task, signal) {
      return new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(signal.reason)
          return
        }

        const waiting: Waiting = {
          start: () => {
            signal?.removeEventListener('abort', onAbort)

            task()
              .then(resolve, reject)
              .finally(() => {
                active -= 1
                next()
              })
          },
          cancel: reject,
        }

        function onAbort(): void {
          const index = queue.indexOf(waiting)
          if (index === -1) return

          queue.splice(index, 1)
          waiting.cancel(signal?.reason)
        }

        signal?.addEventListener('abort', onAbort, { once: true })
        queue.push(waiting)
        next()
      })
    },
  }
}
