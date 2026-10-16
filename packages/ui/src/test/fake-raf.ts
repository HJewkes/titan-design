import { vi } from 'vitest'

/**
 * Replaces requestAnimationFrame with a queue the test drains by hand, so frame timestamps are
 * exact. Pair with `vi.unstubAllGlobals()` in `afterEach`.
 */
export function fakeRaf() {
  const queue = new Map<number, FrameRequestCallback>()
  let id = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.set(++id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => queue.delete(handle))
  return {
    /** Runs every callback queued before this call with timestamp `ms`. */
    frame(ms: number) {
      const due = [...queue.values()]
      queue.clear()
      for (const cb of due) cb(ms)
    },
    pending: () => queue.size,
  }
}
