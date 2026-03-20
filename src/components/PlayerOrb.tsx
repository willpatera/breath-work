import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../features/player/playerController'
import { lerp, fraction } from '../features/player/time'

export function PlayerOrb() {
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Subscribe to store for transient high-frequency updates
    // This avoids React re-renders on every animation frame
    const unsub = usePlayerStore.subscribe((state) => {
      const orb = orbRef.current
      if (!orb) return

      const { timeline, currentStepIndex, stepElapsed, status } = state

      if (timeline.length === 0) {
        orb.style.transform = 'scale(0.35)'
        return
      }

      const step = timeline[Math.min(currentStepIndex, timeline.length - 1)]
      if (!step) return

      let scale: number
      if (status === 'finished') {
        scale = step.orbScaleEnd
      } else {
        const t = fraction(stepElapsed, step.duration)
        scale = lerp(step.orbScaleStart, step.orbScaleEnd, t)
      }

      orb.style.transform = `scale(${scale})`
    })

    return unsub
  }, [])

  return (
    <div className="orb-container">
      <div className="orb" ref={orbRef}>
        <div className="orb__glow" />
        <div className="orb__core" />
      </div>
    </div>
  )
}
