import type { Practice, AuthoredStep, BreathStep, ActionType } from '../library/practiceTypes'
import type { RuntimeStep } from './playerTypes'

export const ORB_SCALE_MIN = 0.35
export const ORB_SCALE_MAX = 1.0

const ACTION_LABELS: Record<ActionType, string> = {
  instruction: '',
  inhale: 'Inhale',
  exhale: 'Exhale',
  hold_in: 'Hold in',
  hold_out: 'Hold out',
}

/**
 * Flatten authored practice steps into a linear runtime timeline.
 * Expands repeat blocks, computes orb scale targets for stacked breaths,
 * attaches round metadata and next-action previews.
 */
export function buildTimeline(practice: Practice): RuntimeStep[] {
  const flat = flattenSteps(practice.steps)
  assignOrbScales(flat)
  assignNextActions(flat)
  return flat
}

/** Compute total duration of a built timeline. */
export function totalDuration(timeline: RuntimeStep[]): number {
  return timeline.reduce((sum, s) => sum + s.duration, 0)
}

// ─── Internal helpers ───

interface FlatEntry {
  actionType: ActionType
  duration: number
  label: string
  text?: string
  roundIndex: number | null
  roundTotal: number | null
  cues: RuntimeStep['cues']
}

function flattenSteps(steps: AuthoredStep[]): RuntimeStep[] {
  const entries: FlatEntry[] = []

  for (const step of steps) {
    if (step.type === 'repeat') {
      for (let round = 0; round < step.rounds; round++) {
        for (const inner of step.sequence) {
          entries.push(breathStepToEntry(inner, round, step.rounds))
        }
      }
    } else {
      entries.push(breathStepToEntry(step, null, null))
    }
  }

  return entries.map((e, i) => ({
    stepIndex: i,
    actionType: e.actionType,
    duration: e.duration,
    label: e.label,
    phase: e.text ?? ACTION_LABELS[e.actionType] ?? e.label,
    roundIndex: e.roundIndex,
    roundTotal: e.roundTotal,
    cues: e.cues,
    nextActionType: null,
    nextActionDuration: null,
    orbScaleStart: ORB_SCALE_MIN,
    orbScaleEnd: ORB_SCALE_MIN,
  }))
}

function breathStepToEntry(
  step: BreathStep,
  roundIndex: number | null,
  roundTotal: number | null,
): FlatEntry {
  return {
    actionType: step.type,
    duration: step.duration,
    label:
      step.type === 'instruction'
        ? step.label
        : ACTION_LABELS[step.type],
    text: step.type === 'instruction' ? step.text : undefined,
    roundIndex,
    roundTotal,
    cues: 'cues' in step && step.cues ? step.cues : null,
  }
}

/**
 * Assign orb scale start/end values for each step.
 * 
 * Logic:
 * - inhale moves orb UP toward ORB_SCALE_MAX
 * - exhale moves orb DOWN toward ORB_SCALE_MIN
 * - hold_in stays at ORB_SCALE_MAX
 * - hold_out stays at ORB_SCALE_MIN
 * - instruction stays at ORB_SCALE_MIN
 * 
 * For consecutive same-direction steps (e.g. inhale, inhale),
 * the total range is subdivided proportionally by duration.
 */
function assignOrbScales(steps: RuntimeStep[]): void {
  const range = ORB_SCALE_MAX - ORB_SCALE_MIN

  let i = 0
  while (i < steps.length) {
    const step = steps[i]

    if (step.actionType === 'hold_in') {
      step.orbScaleStart = ORB_SCALE_MAX
      step.orbScaleEnd = ORB_SCALE_MAX
      i++
    } else if (step.actionType === 'hold_out') {
      step.orbScaleStart = ORB_SCALE_MIN
      step.orbScaleEnd = ORB_SCALE_MIN
      i++
    } else if (step.actionType === 'instruction') {
      step.orbScaleStart = ORB_SCALE_MIN
      step.orbScaleEnd = ORB_SCALE_MIN
      i++
    } else if (step.actionType === 'inhale') {
      // Collect consecutive inhales
      const group = collectConsecutive(steps, i, 'inhale')
      const totalGroupDuration = group.reduce((s, g) => s + g.duration, 0)
      let cursor = ORB_SCALE_MIN
      for (const g of group) {
        const fraction = g.duration / totalGroupDuration
        g.orbScaleStart = cursor
        cursor += fraction * range
        g.orbScaleEnd = cursor
      }
      // Snap last to max to avoid floating point drift
      group[group.length - 1].orbScaleEnd = ORB_SCALE_MAX
      i += group.length
    } else if (step.actionType === 'exhale') {
      // Collect consecutive exhales
      const group = collectConsecutive(steps, i, 'exhale')
      const totalGroupDuration = group.reduce((s, g) => s + g.duration, 0)
      let cursor = ORB_SCALE_MAX
      for (const g of group) {
        const fraction = g.duration / totalGroupDuration
        g.orbScaleStart = cursor
        cursor -= fraction * range
        g.orbScaleEnd = cursor
      }
      // Snap last to min
      group[group.length - 1].orbScaleEnd = ORB_SCALE_MIN
      i += group.length
    } else {
      i++
    }
  }
}

function collectConsecutive(
  steps: RuntimeStep[],
  startIndex: number,
  actionType: ActionType,
): RuntimeStep[] {
  const group: RuntimeStep[] = []
  for (let j = startIndex; j < steps.length; j++) {
    if (steps[j].actionType === actionType) {
      group.push(steps[j])
    } else {
      break
    }
  }
  return group
}

function assignNextActions(steps: RuntimeStep[]): void {
  for (let i = 0; i < steps.length - 1; i++) {
    steps[i].nextActionType = steps[i + 1].actionType
    steps[i].nextActionDuration = steps[i + 1].duration
  }
}
