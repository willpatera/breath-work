/**
 * Audio engine facade.
 * Manages AudioContext lifecycle and delegates to synth/cue engines.
 * Audio is always on. Cues can be toggled.
 */

import type { RuntimeStep } from '../player/playerTypes'
import { playInhale, playExhale, playCompletionChime, type SynthHandle } from './synth'
import { scheduleCues, type CueHandle } from './cueEngine'

class AudioEngine {
  private ctx: AudioContext | null = null
  private currentSynth: SynthHandle | null = null
  private currentCue: CueHandle | null = null
  private _cuesEnabled = true
  private _binauralEnabled = false

  init(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  get cuesEnabled(): boolean {
    return this._cuesEnabled
  }

  setCuesEnabled(enabled: boolean): void {
    this._cuesEnabled = enabled
    if (!enabled && this.currentCue) {
      this.currentCue.stop()
      this.currentCue = null
    }
  }

  get binauralEnabled(): boolean {
    return this._binauralEnabled
  }

  setBinauralEnabled(enabled: boolean): void {
    this._binauralEnabled = enabled
  }

  playStep(step: RuntimeStep, remainingDuration?: number): void {
    this.stopCurrent()

    const ctx = this.init()
    const duration = step.duration
    const elapsed = remainingDuration !== undefined
      ? duration - remainingDuration
      : 0

    // Play tone for breath steps
    if (step.actionType === 'inhale') {
      this.currentSynth = playInhale(ctx, duration, elapsed, this._binauralEnabled)
    } else if (step.actionType === 'exhale') {
      this.currentSynth = playExhale(ctx, duration, elapsed, this._binauralEnabled)
    }
    // hold_in, hold_out, instruction = silence (no synth)

    // Schedule cues if enabled and step has countdown
    if (
      this._cuesEnabled &&
      step.cues?.countdown &&
      step.cues.countdown.length > 0
    ) {
      this.currentCue = scheduleCues(
        ctx,
        step.cues.countdown,
        duration,
        elapsed,
      )
    }
  }

  stop(): void {
    this.stopCurrent()
  }

  playCompletion(): void {
    this.stopCurrent()
    const ctx = this.init()
    this.currentSynth = playCompletionChime(ctx)
  }

  dispose(): void {
    this.stopCurrent()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }

  private stopCurrent(): void {
    if (this.currentSynth) {
      this.currentSynth.stop()
      this.currentSynth = null
    }
    if (this.currentCue) {
      this.currentCue.stop()
      this.currentCue = null
    }
  }
}

export const audioEngine = new AudioEngine()
