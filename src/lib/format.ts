/** Format seconds as m:ss */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(s / 60)
  const remainder = s % 60
  return `${m}:${remainder.toString().padStart(2, '0')}`
}

/**
 * Format a countdown value.
 * Shows one decimal place when the step has sub-second precision
 * (e.g. 1.5s steps), otherwise shows whole seconds.
 */
export function formatSeconds(
  seconds: number,
  stepDuration?: number,
): string {
  const val = Math.max(0, seconds)
  const useDecimal = stepDuration !== undefined && stepDuration % 1 !== 0
  if (useDecimal) {
    // Ceil to nearest 0.1
    const rounded = Math.ceil(val * 10) / 10
    return rounded.toFixed(1)
  }
  return Math.ceil(val).toString()
}
