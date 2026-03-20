/**
 * Web Worker that emits 'tick' messages at a steady interval.
 * Unlike requestAnimationFrame, worker timers are NOT throttled
 * when the page is backgrounded or the screen is off.
 */

let interval: ReturnType<typeof setInterval> | null = null

self.onmessage = (e: MessageEvent<'start' | 'stop'>) => {
  if (e.data === 'start') {
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      self.postMessage('tick')
    }, 50) // 20 ticks/sec — plenty for step transitions
  } else if (e.data === 'stop') {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }
}
