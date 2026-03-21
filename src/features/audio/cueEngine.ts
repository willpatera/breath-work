/**
 * Countdown cue engine.
 * All sounds are synthesized via Web Audio API (no imported files).
 *
 * Sound selection based on the countdown array:
 * - "ping" (ascending C5→E5): only when the highest cue value equals
 *   the step duration, i.e. the countdown starts at the very beginning.
 * - "ding" (descending G5→C5): only on the 0 value (step end).
 * - Standard 800 Hz pip: everything else.
 *
 * Examples:
 *   [5,4,3,2,1,0] on a 5s step → ping, tick, tick, tick, tick, ding
 *   [3,2,1]        on a 12s step → tick, tick, tick
 *   [3,2,1,0]      on a 12s step → tick, tick, tick, ding
 */

const PIP_FREQ = 800
const PIP_DURATION = 0.06
const PIP_VOLUME = 0.3

// Ping: ascending two-tone for "begin"
const PING_FREQ_1 = 523.25 // C5
const PING_FREQ_2 = 659.25 // E5
const PING_DURATION = 0.08

// Ding: descending bell for "end"
const DING_FREQ_1 = 784.0 // G5
const DING_FREQ_2 = 523.25 // C5
const DING_DURATION = 0.22

export interface CueHandle {
  stop: () => void
}

/**
 * Schedule countdown cues for a step.
 *
 * @param ctx AudioContext
 * @param countdown Array of seconds-before-end to cue (e.g. [5, 4, 3, 2, 1, 0])
 * @param stepDuration Total step duration in seconds
 * @param stepElapsed How far into the step we already are
 */
export function scheduleCues(
  ctx: AudioContext,
  countdown: number[],
  stepDuration: number,
  stepElapsed: number,
): CueHandle {
  const now = ctx.currentTime
  const remaining = stepDuration - stepElapsed
  const maxCue = Math.max(...countdown)
  // Ping only when the first cue fires at the very start of the step
  const hasStartPing = maxCue > 0 && Math.abs(maxCue - stepDuration) < 0.01
  const hasEndDing = countdown.includes(0)
  const nodes: { oscs: OscillatorNode[]; gains: GainNode[] }[] = []

  for (const secondsBefore of countdown) {
    const timeUntilPip = remaining - secondsBefore
    if (timeUntilPip < 0) continue // Not enough time remaining
    if (timeUntilPip > remaining) continue

    const pipStart = now + timeUntilPip

    if (hasStartPing && secondsBefore === maxCue) {
      // "Ping" — ascending two-tone for begin
      nodes.push(schedulePing(ctx, pipStart))
    } else if (hasEndDing && secondsBefore === 0) {
      // "Ding" — descending bell for end
      nodes.push(scheduleDing(ctx, pipStart))
    } else {
      // Standard pip
      nodes.push(schedulePip(ctx, pipStart))
    }
  }

  return {
    stop: () => {
      for (const { oscs, gains } of nodes) {
        for (const g of gains) {
          try {
            g.gain.setValueAtTime(0, ctx.currentTime)
          } catch { /* already stopped */ }
        }
        for (const o of oscs) {
          try { o.stop() } catch { /* already stopped */ }
          try { o.disconnect() } catch { /* already disconnected */ }
        }
        for (const g of gains) {
          try { g.disconnect() } catch { /* already disconnected */ }
        }
      }
      nodes.length = 0
    },
  }
}

function schedulePip(
  ctx: AudioContext,
  start: number,
): { oscs: OscillatorNode[]; gains: GainNode[] } {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(PIP_FREQ, start)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(PIP_VOLUME, start + 0.005)
  gain.gain.setValueAtTime(PIP_VOLUME, start + PIP_DURATION - 0.01)
  gain.gain.linearRampToValueAtTime(0, start + PIP_DURATION)

  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + PIP_DURATION + 0.01)

  return { oscs: [osc], gains: [gain] }
}

function schedulePing(
  ctx: AudioContext,
  start: number,
): { oscs: OscillatorNode[]; gains: GainNode[] } {
  // First tone: C5
  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(PING_FREQ_1, start)

  const gain1 = ctx.createGain()
  gain1.gain.setValueAtTime(0, start)
  gain1.gain.linearRampToValueAtTime(PIP_VOLUME, start + 0.005)
  gain1.gain.linearRampToValueAtTime(0, start + PING_DURATION)

  osc1.connect(gain1).connect(ctx.destination)
  osc1.start(start)
  osc1.stop(start + PING_DURATION + 0.01)

  // Second tone: E5 (starts after first)
  const t2 = start + PING_DURATION * 0.6
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(PING_FREQ_2, t2)

  const gain2 = ctx.createGain()
  gain2.gain.setValueAtTime(0, t2)
  gain2.gain.linearRampToValueAtTime(PIP_VOLUME, t2 + 0.005)
  gain2.gain.linearRampToValueAtTime(0, t2 + PING_DURATION)

  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(t2)
  osc2.stop(t2 + PING_DURATION + 0.01)

  return { oscs: [osc1, osc2], gains: [gain1, gain2] }
}

function scheduleDing(
  ctx: AudioContext,
  start: number,
): { oscs: OscillatorNode[]; gains: GainNode[] } {
  // Descending bell: G5 → C5
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(DING_FREQ_1, start)
  osc.frequency.linearRampToValueAtTime(DING_FREQ_2, start + DING_DURATION)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(PIP_VOLUME * 1.2, start + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.001, start + DING_DURATION)

  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + DING_DURATION + 0.01)

  return { oscs: [osc], gains: [gain] }
}
