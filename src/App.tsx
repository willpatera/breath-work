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
import { IconClose } from './components/Icons'
import { formatTime } from './lib/format'
import './App.css'

type Screen = 'library' | 'player'

export default function App() {
  const [screen, setScreen] = useState<Screen>('library')
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null)
  const [practices] = useState(() =>
    loadPractices().sort((a, b) => a.title.localeCompare(b.title)),
  )
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPractices = practices.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    )
  })

  const status = usePlayerStore((s) => s.status)
  const totalDuration = usePlayerStore((s) => s.totalDuration)
  const load = usePlayerStore((s) => s.load)
  const reset = usePlayerStore((s) => s.reset)

  // Initialize audio preferences from localStorage
  useEffect(() => {
    audioEngine.setCuesEnabled(loadBool('cues', true))
    audioEngine.setSynthEnabled(loadBool('synth', true))
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
        <div className="library-search">
          <input
            className="library-search__input"
            type="text"
            placeholder="Find your pattern"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="practice-list">
          {filteredPractices.map((p) => (
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
          <h1 className="complete__title">Practice Complete</h1>

          <div className="complete__stats">
            <div className="complete__stat">
              <span className="complete__stat-label">Practice</span>
              <span className="complete__stat-value">{selectedPractice?.title}</span>
            </div>
            <div className="complete__stat">
              <span className="complete__stat-label">Duration</span>
              <span className="complete__stat-value">{formatTime(totalDuration)}</span>
            </div>
          </div>

          <button className="complete__btn" onClick={handleReturn}>
            Return to practice library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen screen--player">
      <div className="player-top-bar">
        {selectedPractice && (
          <InfoDrawer practice={selectedPractice} />
        )}
        <span className="player-top-bar__title">
          {selectedPractice?.title}
        </span>
        <button
          className="player-top-bar__close"
          onClick={handleReturn}
          aria-label="Back to library"
        >
          <IconClose size={20} />
        </button>
      </div>
      <SessionHeader />
      <PlayerOrb />
      <PlayerControls />
    </div>
  )
}
