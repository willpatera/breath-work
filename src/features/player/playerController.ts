import { create } from 'zustand'
import type { Practice } from '../library/practiceTypes'
import type { PlayerState } from './playerTypes'
import { buildTimeline, totalDuration } from './timelineBuilder'
import { audioEngine } from '../audio/audioEngine'

interface PlayerActions {
  load: (practice: Practice) => void
  play: () => void
  pause: () => void
  reset: () => void
  tick: (now: number) => void
}

export type PlayerStore = PlayerState & PlayerActions

const initialState: PlayerState = {
  status: 'idle',
  timeline: [],
  currentStepIndex: 0,
  stepElapsed: 0,
  stepRemaining: 0,
  totalElapsed: 0,
  totalDuration: 0,
  totalRemaining: 0,
  practiceId: null,
  practiceTitle: null,
}

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  ...initialState,

  load: (practice: Practice) => {
    const timeline = buildTimeline(practice)
    const total = totalDuration(timeline)
    set({
      ...initialState,
      status: 'idle',
      timeline,
      totalDuration: total,
      totalRemaining: total,
      stepRemaining: timeline.length > 0 ? timeline[0].duration : 0,
      practiceId: practice.id,
      practiceTitle: practice.title,
    })
  },

  play: () => {
    const state = get()
    if (state.status === 'playing') return
    if (state.status === 'finished') return
    if (state.timeline.length === 0) return

    set({ status: 'playing' })

    // Start audio for current step
    const step = state.timeline[state.currentStepIndex]
    if (step) {
      audioEngine.playStep(step, step.duration - state.stepElapsed)
    }

    startLoop()
  },

  pause: () => {
    const state = get()
    if (state.status !== 'playing') return
    set({ status: 'paused' })
    audioEngine.stop()
    stopLoop()
  },

  reset: () => {
    const state = get()
    audioEngine.stop()
    stopLoop()
    const total = totalDuration(state.timeline)
    set({
      status: 'idle',
      currentStepIndex: 0,
      stepElapsed: 0,
      stepRemaining: state.timeline.length > 0 ? state.timeline[0].duration : 0,
      totalElapsed: 0,
      totalRemaining: total,
    })
  },

  tick: (now: number) => {
    const state = get()
    if (state.status !== 'playing') return

    const delta = now - lastTickTime
    lastTickTime = now

    if (delta <= 0 || delta > 1000) return // skip huge gaps

    const deltaSeconds = delta / 1000
    let { currentStepIndex, stepElapsed, totalElapsed } = state
    const { timeline, totalDuration: total } = state

    stepElapsed += deltaSeconds
    totalElapsed += deltaSeconds

    // Advance through steps
    while (
      currentStepIndex < timeline.length &&
      stepElapsed >= timeline[currentStepIndex].duration
    ) {
      stepElapsed -= timeline[currentStepIndex].duration
      currentStepIndex++

      // Start audio for the new step (account for overshoot)
      if (currentStepIndex < timeline.length) {
        const nextStep = timeline[currentStepIndex]
        audioEngine.playStep(nextStep, nextStep.duration - stepElapsed)
      }
    }

    // Check if finished
    if (currentStepIndex >= timeline.length) {
      audioEngine.playCompletion()
      stopLoop()
      set({
        status: 'finished',
        currentStepIndex: timeline.length - 1,
        stepElapsed: 0,
        stepRemaining: 0,
        totalElapsed: total,
        totalRemaining: 0,
      })
      return
    }

    const step = timeline[currentStepIndex]
    const stepRem = Math.max(0, step.duration - stepElapsed)
    const totalRem = Math.max(0, total - totalElapsed)

    set({
      currentStepIndex,
      stepElapsed,
      stepRemaining: stepRem,
      totalElapsed,
      totalRemaining: totalRem,
    })
  },
}))

// ─── rAF loop ───

let animFrameId: number | null = null
let lastTickTime = 0

function onFrame(now: number): void {
  usePlayerStore.getState().tick(now)
  if (usePlayerStore.getState().status === 'playing') {
    animFrameId = requestAnimationFrame(onFrame)
  }
}

function startLoop(): void {
  stopLoop()
  lastTickTime = performance.now()
  animFrameId = requestAnimationFrame(onFrame)
}

function stopLoop(): void {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
}
