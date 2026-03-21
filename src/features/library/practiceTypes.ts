// ─── Authored step types (what practice JSON contains) ───

export type ActionType =
  | 'instruction'
  | 'inhale'
  | 'exhale'
  | 'hold_in'
  | 'hold_out'

export interface Cues {
  countdown?: number[]
}

export interface InstructionStep {
  type: 'instruction'
  label: string
  text?: string
  duration: number
}

export interface InhaleStep {
  type: 'inhale'
  label?: string
  text?: string
  duration: number
  cues?: Cues
}

export interface ExhaleStep {
  type: 'exhale'
  label?: string
  text?: string
  duration: number
  cues?: Cues
}

export interface HoldInStep {
  type: 'hold_in'
  label?: string
  text?: string
  duration: number
  cues?: Cues
}

export interface HoldOutStep {
  type: 'hold_out'
  label?: string
  text?: string
  duration: number
  cues?: Cues
}

export interface RepeatStep {
  type: 'repeat'
  label?: string
  rounds: number
  sequence: BreathStep[]
}

export type BreathStep =
  | InstructionStep
  | InhaleStep
  | ExhaleStep
  | HoldInStep
  | HoldOutStep

export type AuthoredStep = BreathStep | RepeatStep

export interface Practice {
  id: string
  title: string
  author: string
  description: string
  steps: AuthoredStep[]
}
