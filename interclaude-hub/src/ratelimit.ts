/**
 * Best-effort fixed-window limiter, per isolate. Good enough to stop a loop or a noisy client;
 * signature checks and token checks are the real gate.
 */
export class RateLimiter {
  private hits = new Map<string, { windowStart: number; count: number }>()
  constructor(
    private limit: number,
    private windowMs: number,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    if (this.hits.size > 10_000) this.hits.clear()
    const h = this.hits.get(key)
    if (!h || now - h.windowStart >= this.windowMs) {
      this.hits.set(key, { windowStart: now, count: 1 })
      return true
    }
    h.count++
    return h.count <= this.limit
  }
}
