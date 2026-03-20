import { usePlayerStore } from '../features/player/playerController'
import { audioEngine } from '../features/audio/audioEngine'
import { loadBool, saveBool } from '../lib/storage'
import { useState } from 'react'
import { IconRestart, IconPlay, IconPause, IconSettings, IconClose } from './Icons'

interface PlayerControlsProps {
  onReturn: () => void
}

export function PlayerControls({ onReturn }: PlayerControlsProps) {
  const status = usePlayerStore((s) => s.status)
  const play = usePlayerStore((s) => s.play)
  const pause = usePlayerStore((s) => s.pause)
  const reset = usePlayerStore((s) => s.reset)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cuesOn, setCuesOn] = useState(() => loadBool('cues', true))
  const [binauralOn, setBinauralOn] = useState(() => {
    const v = loadBool('binaural', false)
    audioEngine.setBinauralEnabled(v)
    return v
  })

  const handleCueToggle = () => {
    const next = !cuesOn
    setCuesOn(next)
    saveBool('cues', next)
    audioEngine.setCuesEnabled(next)
  }

  const handleBinauralToggle = () => {
    const next = !binauralOn
    setBinauralOn(next)
    saveBool('binaural', next)
    audioEngine.setBinauralEnabled(next)
  }

  const handlePlayPause = () => {
    // Ensure AudioContext is unlocked on user gesture
    audioEngine.init()
    if (status === 'playing') {
      pause()
    } else {
      play()
    }
  }

  if (status === 'finished') {
    return null // Completion screen handles this
  }

  return (
    <>
      <div className="player-controls">
        <button
          className="player-controls__btn player-controls__btn--secondary"
          onClick={reset}
          aria-label="Reset"
        >
          <IconRestart size={22} />
        </button>

        <button
          className="player-controls__btn player-controls__btn--primary"
          onClick={handlePlayPause}
          aria-label={status === 'playing' ? 'Pause' : 'Play'}
        >
          {status === 'playing' ? <IconPause size={32} /> : <IconPlay size={32} />}
        </button>

        <button
          className="player-controls__btn player-controls__btn--secondary"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
        >
          <IconSettings size={22} />
        </button>

        <button
          className="player-controls__btn player-controls__btn--secondary player-controls__btn--back"
          onClick={() => {
            reset()
            onReturn()
          }}
          aria-label="Back to library"
        >
          <IconClose size={22} />
        </button>
      </div>

      {settingsOpen && (
        <div
          className="settings-sheet__overlay"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="settings-sheet__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-sheet__header">
              <h2>Settings</h2>
              <button onClick={() => setSettingsOpen(false)} aria-label="Close">
                <IconClose size={20} />
              </button>
            </div>

            <div className="settings-sheet__row">
              <span className="settings-sheet__label">Cues</span>
              <button
                className={`settings-sheet__toggle ${
                  cuesOn ? 'settings-sheet__toggle--on' : ''
                }`}
                onClick={handleCueToggle}
                role="switch"
                aria-checked={cuesOn}
              >
                <span className="settings-sheet__toggle-thumb" />
              </button>
            </div>

            <div className="settings-sheet__row">
              <span className="settings-sheet__label">Binaural</span>
              <button
                className={`settings-sheet__toggle ${
                  binauralOn ? 'settings-sheet__toggle--on' : ''
                }`}
                onClick={handleBinauralToggle}
                role="switch"
                aria-checked={binauralOn}
              >
                <span className="settings-sheet__toggle-thumb" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
