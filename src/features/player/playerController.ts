import { create } from 'zustand'
import type { Practice } from '../library/practiceTypes'
import type { PlayerState } from './playerTypes'
import { buildTimeline, totalDuration } from './timelineBuilder'
import { audioEngine } from '../audio/audioEngine'
import {
  setMediaSession,
  setMediaSessionHandlers,
  setPlaybackState,
  setPositionState,
  clearMediaSession,
} from '../pwa/mediaSession'

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

    // Audio keep-alive (prevents iOS from suspending AudioContext)
    audioEngine.startKeepAlive()

    // Start audio for current step
    const step = state.timeline[state.currentStepIndex]
    if (step) {
      audioEngine.playStep(step, step.duration - state.stepElapsed)
    }

    // Media Session
    if (state.practiceTitle) {
      setMediaSession(state.practiceTitle)
    }
    setMediaSessionHandlers({
      onPlay: () => get().play(),
      onPause: () => get().pause(),
      onStop: () => get().reset(),
    })
    setPlaybackState('playing')
    setPositionState(state.totalDuration, state.totalElapsed)

    // Wake Lock
    acquireWakeLock()

    startWorkerLoop()
  },

  pause: () => {
    const state = get()
    if (state.status !== 'playing') return
    set({ status: 'paused' })
    audioEngine.stop()
    audioEngine.stopKeepAlive()
    setPlaybackState('paused')
    releaseWakeLock()
    stopWorkerLoop()
  },

  reset: () => {
    const state = get()
    audioEngine.stop()
    audioEngine.stopKeepAlive()
    clearMediaSession()
    releaseWakeLock()
    stopWorkerLoop()
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

    // Skip negative or zero deltas, but ALLOW large gaps for catch-up
    if (delta <= 0) return

    // Clamp to 30s max to avoid unbounded jumps (e.g. after sleep)
    const deltaSeconds = Math.min(delta / 1000, 30)
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
      audioEngine.stopKeepAlive()
      clearMediaSession()
      releaseWakeLock()
      stopWorkerLoop()
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

    // Update Media Session position periodically
    setPositionState(total, totalElapsed)

    set({
      currentStepIndex,
      stepElapsed,
      stepRemaining: stepRem,
      totalElapsed,
      totalRemaining: totalRem,
    })
  },
}))

// ─── Web Worker tick loop (survives backgrounding) ───

let worker: Worker | null = null
let lastTickTime = 0

function onWorkerTick(): void {
  usePlayerStore.getState().tick(performance.now())
}

function startWorkerLoop(): void {
  stopWorkerLoop()
  lastTickTime = performance.now()

  worker = new Worker(new URL('./tickWorker.ts', import.meta.url), {
    type: 'module',
  })
  worker.onmessage = onWorkerTick
  worker.postMessage('start')
}

function stopWorkerLoop(): void {
  if (worker) {
    worker.postMessage('stop')
    worker.terminate()
    worker = null
  }
}

// ─── Screen Wake Lock ───

let wakeLock: WakeLockSentinel | null = null

async function acquireWakeLock(): Promise<void> {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen')
      wakeLock.addEventListener('release', () => {
        wakeLock = null
      })
    }
  } catch {
    // Wake Lock not supported or denied — non-fatal
  }
}

function releaseWakeLock(): void {
  if (wakeLock) {
    wakeLock.release()
    wakeLock = null
  }
}

// ─── Visibility change recovery ───

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    const state = usePlayerStore.getState()
    if (state.status !== 'playing') return

    // Re-acquire wake lock (released by OS when backgrounded)
    acquireWakeLock()

    // Resume AudioContext if suspended
    audioEngine.resumeContext()
  })
}
