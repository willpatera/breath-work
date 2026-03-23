/**
 * Stereo sine-wave synthesizer for breath sounds.
 *
 * Creates left/right oscillators routed through StereoPannerNodes.
 * Binaural mode: R channel fundamental offset by BINAURAL_OFFSET Hz
 * to create a perceived binaural beat (requires headphones).
 *
 * Inhale: linear frequency sweep 35 Hz → 225 Hz
 * Exhale: linear frequency sweep 225 Hz → 35 Hz
 *
 * Warm timbre: fundamental + 2nd harmonic (octave above at 12% volume)
 * routed through a lowpass filter (~800 Hz) to round off harshness.
 * 0.5s fade-in from subtle volume, 0.5s fade-out to silence.
 */

const FREQ_LOW = 35
const FREQ_HIGH = 225
const ATTACK_TIME = 0.5
const RELEASE_TIME = 0.5
const VOLUME = 0.22
const HARMONIC_VOLUME = 0.12
const FILTER_FREQ = 800
const FILTER_Q = 1
const BINAURAL_OFFSET = 8 // Hz offset on R channel

export interface SynthHandle {
  stop: () => void
}

export function playInhale(
  ctx: AudioContext,
  duration: number,
  startOffset = 0,
  binaural = false,
): SynthHandle {
  return playSweep(ctx, FREQ_LOW, FREQ_HIGH, duration, startOffset, binaural)
}

export function playExhale(
  ctx: AudioContext,
  duration: number,
  startOffset = 0,
  binaural = false,
): SynthHandle {
  return playSweep(ctx, FREQ_HIGH, FREQ_LOW, duration, startOffset, binaural)
}

/**
 * Play a completion chime — a pleasant bell/ding.
 * Sine at 523 Hz (C5) + partial at 1046 Hz (C6) at 30%.
 * Quick 5ms attack, ~1.5s exponential decay.
 */
export function playCompletionChime(ctx: AudioContext): SynthHandle {
  const now = ctx.currentTime
  const chimeDuration = 2.0

  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(523.25, now) // C5

  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(1046.5, now) // C6

  const gain1 = ctx.createGain()
  gain1.gain.setValueAtTime(0, now)
  gain1.gain.linearRampToValueAtTime(0.3, now + 0.005)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + chimeDuration)

  const gain2 = ctx.createGain()
  gain2.gain.setValueAtTime(0, now)
  gain2.gain.linearRampToValueAtTime(0.09, now + 0.005)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + chimeDuration)

  osc1.connect(gain1).connect(ctx.destination)
  osc2.connect(gain2).connect(ctx.destination)

  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + chimeDuration)
  osc2.stop(now + chimeDuration)

  let stopped = false
  return {
    stop: () => {
      if (stopped) return
      stopped = true
      try {
        gain1.gain.setValueAtTime(0, ctx.currentTime)
        gain2.gain.setValueAtTime(0, ctx.currentTime)
        osc1.stop()
        osc2.stop()
      } catch { /* already stopped */ }
      try {
        osc1.disconnect()
        osc2.disconnect()
        gain1.disconnect()
        gain2.disconnect()
      } catch { /* already disconnected */ }
    },
  }
}

function playSweep(
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number,
  duration: number,
  startOffset: number,
  binaural: boolean,
): SynthHandle {
  const now = ctx.currentTime
  const remaining = Math.max(0, duration - startOffset)
  if (remaining <= 0) return { stop: () => {} }

  // Compute where in the sweep we are if resuming mid-step
  const progress = duration > 0 ? startOffset / duration : 0
  const currentFreq = freqStart + (freqEnd - freqStart) * progress
  const currentFreq2 = currentFreq * 2 // octave harmonic
  const freqEnd2 = freqEnd * 2

  // Binaural offset for R channel (only fundamental, not harmonic)
  const binauralHz = binaural ? BINAURAL_OFFSET : 0
  const currentFreqR = currentFreq + binauralHz
  const freqEndR = freqEnd + binauralHz

  // Lowpass filter for warmth
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(FILTER_FREQ, now)
  filter.Q.setValueAtTime(FILTER_Q, now)

  // ── Left channel ──

  // Fundamental
  const oscL = ctx.createOscillator()
  oscL.type = 'sine'
  oscL.frequency.cancelScheduledValues(now)
  oscL.frequency.setValueAtTime(currentFreq, now)
  oscL.frequency.linearRampToValueAtTime(freqEnd, now + remaining)

  // 2nd harmonic (octave above, lower volume)
  const oscL2 = ctx.createOscillator()
  oscL2.type = 'sine'
  oscL2.frequency.cancelScheduledValues(now)
  oscL2.frequency.setValueAtTime(currentFreq2, now)
  oscL2.frequency.linearRampToValueAtTime(freqEnd2, now + remaining)

  const gainL2 = ctx.createGain()
  gainL2.gain.setValueAtTime(HARMONIC_VOLUME, now)

  const panL = ctx.createStereoPanner()
  panL.pan.setValueAtTime(-1, now)

  // ── Right channel ──

  const oscR = ctx.createOscillator()
  oscR.type = 'sine'
  oscR.frequency.cancelScheduledValues(now)
  oscR.frequency.setValueAtTime(currentFreqR, now)
  oscR.frequency.linearRampToValueAtTime(freqEndR, now + remaining)

  const oscR2 = ctx.createOscillator()
  oscR2.type = 'sine'
  oscR2.frequency.cancelScheduledValues(now)
  oscR2.frequency.setValueAtTime(currentFreq2, now)
  oscR2.frequency.linearRampToValueAtTime(freqEnd2, now + remaining)

  const gainR2 = ctx.createGain()
  gainR2.gain.setValueAtTime(HARMONIC_VOLUME, now)

  const panR = ctx.createStereoPanner()
  panR.pan.setValueAtTime(1, now)

  // ── Master gain envelope ──
  // Fade in from subtle volume (30%) over ATTACK_TIME,
  // sustain at full, fade out over RELEASE_TIME to silence.
  const gain = ctx.createGain()
  const subtleVolume = VOLUME * 0.6
  const attackEnd = now + Math.min(ATTACK_TIME, remaining * 0.5)
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(subtleVolume, now)
  gain.gain.linearRampToValueAtTime(VOLUME, attackEnd)
  if (remaining > ATTACK_TIME + RELEASE_TIME) {
    gain.gain.setValueAtTime(VOLUME, now + remaining - RELEASE_TIME)
  }
  gain.gain.linearRampToValueAtTime(0, now + remaining)

  // ── Connect graph ──
  // L fundamental → panL → filter → gain → destination
  oscL.connect(panL)
  // L harmonic → gainL2 → panL
  oscL2.connect(gainL2).connect(panL)
  panL.connect(filter)

  // R fundamental → panR → filter
  oscR.connect(panR)
  // R harmonic → gainR2 → panR
  oscR2.connect(gainR2).connect(panR)
  panR.connect(filter)

  filter.connect(gain).connect(ctx.destination)

  // Start all oscillators
  oscL.start(now)
  oscL2.start(now)
  oscR.start(now)
  oscR2.start(now)

  oscL.stop(now + remaining)
  oscL2.stop(now + remaining)
  oscR.stop(now + remaining)
  oscR2.stop(now + remaining)

  let stopped = false

  return {
    stop: () => {
      if (stopped) return
      stopped = true
      try {
        gain.gain.setValueAtTime(0, ctx.currentTime)
        oscL.stop()
        oscL2.stop()
        oscR.stop()
        oscR2.stop()
      } catch {
        // Already stopped
      }
      try {
        oscL.disconnect()
        oscL2.disconnect()
        oscR.disconnect()
        oscR2.disconnect()
        panL.disconnect()
        panR.disconnect()
        gainL2.disconnect()
        gainR2.disconnect()
        filter.disconnect()
        gain.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }
}
