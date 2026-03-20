import { useState, useEffect } from 'react'
import type { Practice } from './features/library/practiceTypes'
import { loadPractices } from './features/library/practiceLoader'
import { usePlayerStore } from './features/player/playerController'
import { audioEngine } from './features/audio/audioEngine'
import { loadBool } from './lib/storage'
import { PracticeCard } from './components/PracticeCard'
import { PlayerOrb } from './components/PlayerOrb'
import { PlayerControls } from './components/PlayerControls'
import { SessionHeader } from './components/SessionHeader'
import { InfoDrawer } from './components/InfoDrawer'
import './App.css'

type Screen = 'library' | 'player'

export default function App() {
  const [screen, setScreen] = useState<Screen>('library')
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null)
  const [practices] = useState(() => loadPractices())

  const status = usePlayerStore((s) => s.status)
  const load = usePlayerStore((s) => s.load)
  const reset = usePlayerStore((s) => s.reset)

  // Initialize cues preference from localStorage
  useEffect(() => {
    audioEngine.setCuesEnabled(loadBool('cues', true))
  }, [])

  const handleSelect = (practice: Practice) => {
    setSelectedPractice(practice)
    load(practice)
    setScreen('player')
  }

  const handleReturn = () => {
    reset()
    setSelectedPractice(null)
    setScreen('library')
  }

  if (screen === 'library') {
    return (
      <div className="screen screen--library">
        <header className="library-header">
          <h1 className="library-header__title">Breath Work</h1>
          <p className="library-header__subtitle">Choose a practice</p>
        </header>
        <div className="practice-list">
          {practices.map((p) => (
            <PracticeCard key={p.id} practice={p} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    )
  }

  // Player screen
  if (status === 'finished') {
    return (
      <div className="screen screen--complete">
        <div className="complete">
          <div className="complete__icon">✓</div>
          <h1 className="complete__title">Practice Complete!</h1>
          <button className="complete__btn" onClick={handleReturn}>
            Return to practice library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen screen--player">
      {selectedPractice && (
        <InfoDrawer practice={selectedPractice} />
      )}
      <SessionHeader />
      <PlayerOrb />
      <PlayerControls onReturn={handleReturn} />
    </div>
  )
}
