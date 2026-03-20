/** Format seconds as m:ss */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(s / 60)
  const remainder = s % 60
  return `${m}:${remainder.toString().padStart(2, '0')}`
}

/** Format seconds as just the integer second count */
export function formatSeconds(seconds: number): string {
  return Math.ceil(Math.max(0, seconds)).toString()
}
