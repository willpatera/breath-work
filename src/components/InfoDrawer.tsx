import { useState } from 'react'
import type { Practice, AuthoredStep, BreathStep } from '../features/library/practiceTypes'
import { IconInfo, IconClose } from './Icons'

interface InfoDrawerProps {
  practice: Practice
}

const ACTION_LABELS: Record<string, string> = {
  instruction: '',
  inhale: 'Inhale',
  exhale: 'Exhale',
  hold_in: 'Hold in',
  hold_out: 'Hold out',
}

function formatStepLabel(step: BreathStep): string {
  if (step.type === 'instruction') {
    return `${step.label}: ${step.duration}s`
  }
  const label = ACTION_LABELS[step.type] ?? step.type
  const cueNote =
    'cues' in step && step.cues?.countdown
      ? ` (cues: ${step.cues.countdown.join(', ')})`
      : ''
  return `${label}: ${step.duration}s${cueNote}`
}

function renderStep(step: AuthoredStep, index: number) {
  if (step.type === 'repeat') {
    return (
      <div key={index} className="info-drawer__block">
        <div className="info-drawer__repeat-header">
          Repeat × {step.rounds}
        </div>
        <div className="info-drawer__sequence">
          {step.sequence.map((inner, i) => (
            <div key={i} className="info-drawer__step">
              {formatStepLabel(inner)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div key={index} className="info-drawer__block">
      <div className="info-drawer__step">{formatStepLabel(step)}</div>
    </div>
  )
}

export function InfoDrawer({ practice }: InfoDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="info-drawer__trigger"
        onClick={() => setOpen(!open)}
        aria-label="Practice info"
      >
        <IconInfo size={22} />
      </button>

      {open && (
        <div className="info-drawer__overlay" onClick={() => setOpen(false)}>
          <div
            className="info-drawer__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="info-drawer__header">
              <h2>{practice.title}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <IconClose size={20} />
              </button>
            </div>
            <p className="info-drawer__body">{practice.description}</p>
            <div className="info-drawer__steps">
              {practice.steps.map((step, i) => renderStep(step, i))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
