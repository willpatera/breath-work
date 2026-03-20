/** Clock-math helpers using exact timestamp subtraction. */

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

/** Compute fraction of elapsed within a duration (0–1). */
export function fraction(elapsed: number, duration: number): number {
  if (duration <= 0) return 1
  return clamp(elapsed / duration, 0, 1)
}
