import type { ActionType, Cues } from '../library/practiceTypes'

// ─── Runtime step (flattened from authored JSON) ───

export interface RuntimeStep {
  stepIndex: number
  actionType: ActionType
  duration: number
  label: string
  phase: string
  roundIndex: number | null
  roundTotal: number | null
  cues: Cues | null
  nextActionType: ActionType | null
  nextActionDuration: number | null
  orbScaleStart: number
  orbScaleEnd: number
}

// ─── Player state ───

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'finished'

export interface PlayerState {
  status: PlaybackStatus
  timeline: RuntimeStep[]
  currentStepIndex: number
  stepElapsed: number
  stepRemaining: number
  totalElapsed: number
  totalDuration: number
  totalRemaining: number
  practiceId: string | null
  practiceTitle: string | null
}
