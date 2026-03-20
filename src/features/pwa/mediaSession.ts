/**
 * Media Session API integration for lock-screen controls.
 */

export function setMediaSession(title: string): void {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: 'Breath Work',
  })
}

export function setMediaSessionHandlers(handlers: {
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
}): void {
  if (!('mediaSession' in navigator)) return

  if (handlers.onPlay) {
    navigator.mediaSession.setActionHandler('play', handlers.onPlay)
  }
  if (handlers.onPause) {
    navigator.mediaSession.setActionHandler('pause', handlers.onPause)
  }
  if (handlers.onStop) {
    navigator.mediaSession.setActionHandler('stop', handlers.onStop)
  }
}

export function setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.playbackState = state
}

export function setPositionState(
  duration: number,
  position: number,
): void {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      playbackRate: 1,
      position: Math.max(0, Math.min(position, duration)),
    })
  } catch {
    // Some browsers throw on invalid values
  }
}

export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = null
  navigator.mediaSession.playbackState = 'none'
}
