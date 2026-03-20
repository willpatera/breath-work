/**
 * Audio engine facade.
 * Manages AudioContext lifecycle and delegates to synth/cue engines.
 * Audio is always on. Cues can be toggled.
 *
 * Includes a silent <audio> keep-alive to prevent iOS Safari
 * from suspending the AudioContext when backgrounded/screen-off.
 */

import type { RuntimeStep } from '../player/playerTypes'
import { playInhale, playExhale, playCompletionChime, type SynthHandle } from './synth'
import { scheduleCues, type CueHandle } from './cueEngine'

// Tiny 1-second silent MP3, base64-encoded (~200 bytes).
// Looped via <audio> to keep the OS audio session alive.
const SILENT_MP3 =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAD/+1DEAAAHAALX9AAAAQAAK/8xIAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxBsAAADSAAAAAAAAANIAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=='

class AudioEngine {
  private ctx: AudioContext | null = null
  private currentSynth: SynthHandle | null = null
  private currentCue: CueHandle | null = null
  private _cuesEnabled = true
  private _binauralEnabled = false
  private keepAliveAudio: HTMLAudioElement | null = null

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

  /** Start looping a silent MP3 to keep the OS audio session alive. */
  startKeepAlive(): void {
    if (this.keepAliveAudio) return
    const audio = new Audio(SILENT_MP3)
    audio.loop = true
    audio.volume = 0 // inaudible
    audio.play().catch(() => {})
    this.keepAliveAudio = audio
  }

  /** Stop the silent keep-alive audio. */
  stopKeepAlive(): void {
    if (this.keepAliveAudio) {
      this.keepAliveAudio.pause()
      this.keepAliveAudio.src = ''
      this.keepAliveAudio = null
    }
  }

  /** Resume AudioContext (useful after visibility change). */
  async resumeContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  dispose(): void {
    this.stopCurrent()
    this.stopKeepAlive()
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
