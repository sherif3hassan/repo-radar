/**
 * Runs `task` over `items` with at most `limit` in flight, resolving with the
 * results in input order.
 *
 * After the first failure no further items are started, in-flight tasks are
 * allowed to finish, and the first error is then thrown. `Promise.all` alone
 * would reject immediately and leave the surviving workers pulling from the
 * queue with nothing left to observe them.
 */
export async function pool<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (limit < 1) throw new RangeError(`pool limit must be >= 1, got ${limit}`)
  if (items.length === 0) return []

  const results = new Array<R>(items.length)
  const queue = items.entries()
  let failed = false
  let failure: unknown

  const worker = async (): Promise<void> => {
    for (const [index, item] of queue) {
      if (failed) return
      try {
        results[index] = await task(item, index)
      } catch (error) {
        if (!failed) {
          failed = true
          failure = error
        }
        return
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))

  if (failed) throw failure

  return results
}
