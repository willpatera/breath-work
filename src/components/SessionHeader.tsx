import { usePlayerStore } from '../features/player/playerController'
import { formatTime, formatSeconds } from '../lib/format'

export function SessionHeader() {
  const status = usePlayerStore((s) => s.status)
  const timeline = usePlayerStore((s) => s.timeline)
  const currentStepIndex = usePlayerStore((s) => s.currentStepIndex)
  const stepRemaining = usePlayerStore((s) => s.stepRemaining)
  const totalRemaining = usePlayerStore((s) => s.totalRemaining)

  if (status === 'finished' || timeline.length === 0) {
    return null
  }

  const step = timeline[Math.min(currentStepIndex, timeline.length - 1)]
  if (!step) return null

  const roundInfo =
    step.roundIndex !== null && step.roundTotal !== null
      ? `Round ${step.roundIndex + 1} / ${step.roundTotal}`
      : null

  const nextInfo =
    step.nextActionType
      ? `Next: ${formatLabel(step.nextActionType)}`
      : null

  return (
    <div className="session-header">
      <div className="session-header__phase">{step.phase}</div>

      {step.text && (
        <div className="session-header__text">{step.text}</div>
      )}

      <div className="session-header__timer">
        {formatSeconds(stepRemaining, step.duration)}
      </div>

      <div className="session-header__meta">
        {roundInfo && <span>{roundInfo}</span>}
        {nextInfo && <span className="session-header__next">{nextInfo}</span>}
      </div>

      <div className="session-header__total">
        {formatTime(totalRemaining)} remaining
      </div>
    </div>
  )
}

function formatLabel(actionType: string): string {
  switch (actionType) {
    case 'inhale': return 'Inhale'
    case 'exhale': return 'Exhale'
    case 'hold_in': return 'Hold in'
    case 'hold_out': return 'Hold out'
    case 'instruction': return 'Instruction'
    default: return actionType
  }
}
