export async function pool<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (limit < 1) throw new RangeError(`pool limit must be >= 1, got ${limit}`)
  if (items.length === 0) return []

  const results = new Array<R>(items.length)
  const queue = items.entries()

  const worker = async (): Promise<void> => {
    for (const [index, item] of queue) {
      results[index] = await task(item, index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))

  return results
}
