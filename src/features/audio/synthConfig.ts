/**
 * Mutable synth configuration.
 * Values are read at call-time by synth.ts, so changes
 * take effect on the next breath step.
 * Persisted to localStorage when changed via the dev panel.
 */

import { loadNumber, saveNumber } from '../../lib/storage'

const DEFAULTS = {
  freqLow: 45,
  freqHigh: 290,
} as const

export const synthConfig = {
  freqLow: loadNumber('synth_freqLow', DEFAULTS.freqLow),
  freqHigh: loadNumber('synth_freqHigh', DEFAULTS.freqHigh),
}

export function setSynthParam(key: keyof typeof synthConfig, value: number): void {
  synthConfig[key] = value
  saveNumber(`synth_${key}`, value)
}

export function resetSynthDefaults(): void {
  for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
    synthConfig[key] = DEFAULTS[key]
    saveNumber(`synth_${key}`, DEFAULTS[key])
  }
}

export { DEFAULTS as SYNTH_DEFAULTS }
