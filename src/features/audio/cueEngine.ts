/**
 * Countdown cue engine.
 * Plays short 800 Hz pip tones at specified countdown offsets.
 */

const PIP_FREQ = 800
const PIP_DURATION = 0.06
const PIP_VOLUME = 0.3

export interface CueHandle {
  stop: () => void
}

/**
 * Schedule countdown pips for a hold step.
 *
 * @param ctx AudioContext
 * @param countdown Array of seconds-before-end to pip (e.g. [3, 2, 1])
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
  const nodes: { osc: OscillatorNode; gain: GainNode }[] = []

  for (const secondsBefore of countdown) {
    const timeUntilPip = remaining - secondsBefore
    if (timeUntilPip < 0) continue // Not enough time remaining
    if (timeUntilPip > remaining) continue

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(PIP_FREQ, now)

    const gain = ctx.createGain()
    const pipStart = now + timeUntilPip
    gain.gain.setValueAtTime(0, pipStart)
    gain.gain.linearRampToValueAtTime(PIP_VOLUME, pipStart + 0.005)
    gain.gain.setValueAtTime(PIP_VOLUME, pipStart + PIP_DURATION - 0.01)
    gain.gain.linearRampToValueAtTime(0, pipStart + PIP_DURATION)

    osc.connect(gain).connect(ctx.destination)
    osc.start(pipStart)
    osc.stop(pipStart + PIP_DURATION + 0.01)

    nodes.push({ osc, gain })
  }

  return {
    stop: () => {
      for (const { osc, gain } of nodes) {
        try {
          gain.gain.setValueAtTime(0, ctx.currentTime)
          osc.stop()
        } catch {
          // Already stopped
        }
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {
          // Already disconnected
        }
      }
      nodes.length = 0
    },
  }
}
