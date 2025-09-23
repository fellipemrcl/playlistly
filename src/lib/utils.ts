import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function openSpotifyLink(spotifyUrl: string): void {
  try {
    // Extract the Spotify URI from the web URL
    // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh -> spotify:track:4iV5W9uYEdYUVa79Axb7Rh
    const spotifyId = spotifyUrl.split('/').pop()?.split('?')[0]

    if (!spotifyId) {
      window.open(spotifyUrl, '_blank')
      return
    }

    // Determine the type (track, album, playlist, etc.)
    let spotifyType = 'track' // default
    if (spotifyUrl.includes('/album/')) spotifyType = 'album'
    else if (spotifyUrl.includes('/playlist/')) spotifyType = 'playlist'
    else if (spotifyUrl.includes('/artist/')) spotifyType = 'artist'

    const spotifyUri = `spotify:${spotifyType}:${spotifyId}`

    // Try to open in Spotify app first
    const appLink = document.createElement('a')
    appLink.href = spotifyUri
    appLink.style.display = 'none'
    document.body.appendChild(appLink)
    appLink.click()
    document.body.removeChild(appLink)

    // Fallback to web version after a short delay if app doesn't open
    setTimeout(() => {
      const isStillOnPage = !document.hidden
      if (isStillOnPage) {
        window.open(spotifyUrl, '_blank')
      }
    }, 1500)

  } catch (error) {
    console.error('Error opening Spotify link:', error)
    // Fallback to original web URL
    window.open(spotifyUrl, '_blank')
  }
}
