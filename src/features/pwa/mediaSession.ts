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

export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = null
}
