export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images?: { url: string }[]
  country: string
  followers: { total: number }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string; id: string }[]
  album: {
    name: string
    images: { url: string; height: number; width: number }[]
  }
  duration_ms: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images?: { url: string }[]
  tracks: {
    total: number
    items: { track: SpotifyTrack }[]
  }
  external_urls: {
    spotify: string
  }
  coverImage?: UnsplashImage
}

export interface AIGeneratedSong {
  title: string
  artist: string
  album: string
  genre: string
  year: number
  reason: string
}

export type PlaylistNameStyle =
  | 'aesthetic'
  | 'casual'
  | 'poetic'
  | 'minimalist'
  | 'vintage'
  | 'edgy'
  | 'classic'

export interface PlaylistGenerationRequest {
  prompt: string
  numberOfSongs?: number
  includePopularSongs?: boolean
  excludeExplicit?: boolean
  nameStyle?: PlaylistNameStyle
}

export interface SongWithAlternatives {
  originalSong: AIGeneratedSong
  suggestions: SpotifyTrack[]
}

export interface PlaylistGenerationResponse {
  id: string
  songs: AIGeneratedSong[]
  spotifyTracks: SpotifyTrack[]
  notFoundSongs: AIGeneratedSong[]
  alternativeSuggestions: SongWithAlternatives[]
  playlistName?: string
  playlistDescription?: string
  createdPlaylist?: SpotifyPlaylist
  status: 'pending' | 'generating' | 'searching' | 'creating' | 'completed' | 'error'
  error?: string
}

export interface GenerationHistory {
  id: string
  userId: string
  prompt: string
  createdAt: Date
  updatedAt: Date
  playlist?: SpotifyPlaylist
  status: PlaylistGenerationResponse['status']
}

export type AppState = {
  user: User | null
  isLoading: boolean
  currentGeneration: PlaylistGenerationResponse | null
  generationHistory: GenerationHistory[]
}

export interface UnsplashImage {
  id: string
  description: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  links: {
    html: string
    download: string
  }
  user: {
    name: string
    username: string
    portfolio_url: string
  }
  width: number
  height: number
}