import { useState } from 'react'
import {
  synthConfig,
  setSynthParam,
  resetSynthDefaults,
  SYNTH_DEFAULTS,
} from '../features/audio/synthConfig'
import { audioEngine } from '../features/audio/audioEngine'
import { playInhale } from '../features/audio/synth'
import { IconClose } from './Icons'

export function DevPanel() {
  const [open, setOpen] = useState(false)
  const [freqLow, setFreqLow] = useState(synthConfig.freqLow)
  const [freqHigh, setFreqHigh] = useState(synthConfig.freqHigh)

  const handleFreqLow = (v: number) => {
    setFreqLow(v)
    setSynthParam('freqLow', v)
  }

  const handleFreqHigh = (v: number) => {
    setFreqHigh(v)
    setSynthParam('freqHigh', v)
  }

  const handleReset = () => {
    resetSynthDefaults()
    setFreqLow(SYNTH_DEFAULTS.freqLow)
    setFreqHigh(SYNTH_DEFAULTS.freqHigh)
  }

  const handleTestTone = () => {
    const ctx = audioEngine.init()
    const handle = playInhale(ctx, 2, 0, false)
    setTimeout(() => handle.stop(), 2100)
  }

  if (!open) {
    return (
      <button
        className="dev-panel__trigger"
        onClick={() => setOpen(true)}
        aria-label="Dev panel"
      >
        🛠️
      </button>
    )
  }

  return (
    <div
      className="settings-sheet__overlay"
      onClick={() => setOpen(false)}
    >
      <div
        className="settings-sheet__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-sheet__header">
          <h2>Synth Tuning</h2>
          <button onClick={() => setOpen(false)} aria-label="Close">
            <IconClose size={20} />
          </button>
        </div>

        <div className="settings-sheet__row settings-sheet__row--slider">
          <span className="settings-sheet__label">Freq Low</span>
          <input
            type="range"
            className="settings-sheet__slider"
            min={10}
            max={100}
            step={5}
            value={freqLow}
            onChange={(e) => handleFreqLow(Number(e.target.value))}
          />
          <span className="settings-sheet__value">{freqLow} Hz</span>
        </div>

        <div className="settings-sheet__row settings-sheet__row--slider">
          <span className="settings-sheet__label">Freq High</span>
          <input
            type="range"
            className="settings-sheet__slider"
            min={100}
            max={500}
            step={5}
            value={freqHigh}
            onChange={(e) => handleFreqHigh(Number(e.target.value))}
          />
          <span className="settings-sheet__value">{freqHigh} Hz</span>
        </div>

        <div className="settings-sheet__actions">
          <button className="settings-sheet__btn" onClick={handleTestTone}>
            ▶ Test tone
          </button>
          <button
            className="settings-sheet__btn settings-sheet__btn--muted"
            onClick={handleReset}
          >
            Reset defaults
          </button>
        </div>
      </div>
    </div>
  )
}
