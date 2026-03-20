import type { Practice } from '../features/library/practiceTypes'
import { formatTime } from '../lib/format'
import { totalDuration } from '../features/player/timelineBuilder'
import { buildTimeline } from '../features/player/timelineBuilder'

interface PracticeCardProps {
  practice: Practice
  onSelect: (practice: Practice) => void
}

export function PracticeCard({ practice, onSelect }: PracticeCardProps) {
  const timeline = buildTimeline(practice)
  const duration = totalDuration(timeline)

  return (
    <button
      className="practice-card"
      onClick={() => onSelect(practice)}
    >
      <div className="practice-card__title">{practice.title}</div>
      <div className="practice-card__meta">
        <span>{formatTime(duration)}</span>
        <span className="practice-card__dot">·</span>
        <span>{practice.author}</span>
      </div>
      <div className="practice-card__desc">{practice.description}</div>
    </button>
  )
}
