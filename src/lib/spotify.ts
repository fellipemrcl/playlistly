import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk'
import { SpotifyTrack, SpotifyPlaylist, AIGeneratedSong, SongWithAlternatives } from '@/types'

export class SpotifyService {
  private client: SpotifyApi

  constructor(accessToken: string) {
    // Create an AccessToken object
    const token: AccessToken = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // Default expiration
      refresh_token: '', // Will be handled by NextAuth
      scope: ''
    }

    this.client = SpotifyApi.withAccessToken(
      process.env.AUTH_SPOTIFY_ID!,
      token
    )
  }

  static createClientCredentialsClient(): SpotifyApi {
    return SpotifyApi.withClientCredentials(
      process.env.AUTH_SPOTIFY_ID!,
      process.env.AUTH_SPOTIFY_SECRET!,
      []
    )
  }

  async getCurrentUserProfile() {
    try {
      return await this.client.currentUser.profile()
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw new Error('Failed to fetch user profile')
    }
  }

  async searchTrack(query: string, limit: number = 1): Promise<SpotifyTrack[]> {
    try {
      const results = await this.client.search(query, ['track'], 'US', limit)

      return results.tracks.items.map((track): SpotifyTrack => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({
          name: artist.name,
          id: artist.id
        })),
        album: {
          name: track.album.name,
          images: track.album.images
        },
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls
      }))
    } catch (error) {
      console.error('Error searching for track:', error)
      return []
    }
  }

  async findTracksFromAIRecommendations(aiSongs: AIGeneratedSong[]): Promise<{
    foundTracks: SpotifyTrack[]
    notFoundSongs: AIGeneratedSong[]
    alternativeSuggestions: SongWithAlternatives[]
  }> {
    const foundTracks: SpotifyTrack[] = []
    const notFoundSongs: AIGeneratedSong[] = []
    const alternativeSuggestions: SongWithAlternatives[] = []

    for (const aiSong of aiSongs) {
      try {
        const match = await this.findSingleTrackWithAdvancedSearch(aiSong)

        if (match) {
          foundTracks.push(match)
          console.log(`✅ Found: "${aiSong.title}" by ${aiSong.artist} -> "${match.name}" by ${match.artists[0].name}`)
        } else {
          console.log(`❌ Not found: "${aiSong.title}" by ${aiSong.artist}`)
          notFoundSongs.push(aiSong)

          // Find alternative suggestions for songs not found
          console.log(`🔍 Finding alternatives for: "${aiSong.title}" by ${aiSong.artist}`)
          const suggestions = await this.findAlternativeSuggestions(aiSong)
          if (suggestions.length > 0) {
            alternativeSuggestions.push({
              originalSong: aiSong,
              suggestions
            })
            console.log(`💡 Found ${suggestions.length} alternatives for "${aiSong.title}"`)
          }
        }

        // Add a small delay to avoid rate limiting
        await this.delay(80)
      } catch (error) {
        console.error(`Error finding track for ${aiSong.title} by ${aiSong.artist}:`, error)
        notFoundSongs.push(aiSong)
      }
    }

    return { foundTracks, notFoundSongs, alternativeSuggestions }
  }

  private async findSingleTrackWithAdvancedSearch(aiSong: AIGeneratedSong): Promise<SpotifyTrack | null> {
    // Clean and normalize strings
    const cleanTitle = this.cleanSearchString(aiSong.title)
    const cleanArtist = this.cleanSearchString(aiSong.artist)

    // Handle common variations
    const titleVariations = this.generateTitleVariations(cleanTitle)
    const artistVariations = this.generateArtistVariations(cleanArtist)

    // Build comprehensive search queries
    const searchQueries: string[] = []

    // Strategy 1: Exact matches with quotes
    for (const title of titleVariations) {
      for (const artist of artistVariations) {
        searchQueries.push(`track:"${title}" artist:"${artist}"`)
      }
    }

    // Strategy 2: Quoted title with artist field
    for (const title of titleVariations) {
      for (const artist of artistVariations) {
        searchQueries.push(`"${title}" artist:"${artist}"`)
      }
    }

    // Strategy 3: Simple combinations
    for (const title of titleVariations.slice(0, 2)) { // Only top 2 variations
      for (const artist of artistVariations.slice(0, 2)) {
        searchQueries.push(`${title} ${artist}`)
      }
    }

    // Strategy 4: Year-based search if available
    if (aiSong.year && aiSong.year > 1950 && aiSong.year < 2030) {
      searchQueries.push(`"${cleanTitle}" "${cleanArtist}" year:${aiSong.year}`)
      searchQueries.push(`${cleanTitle} ${cleanArtist} year:${aiSong.year}`)
    }

    // Strategy 5: Genre-based search if available
    if (aiSong.genre) {
      const genreKeyword = aiSong.genre.toLowerCase()
      searchQueries.push(`"${cleanTitle}" "${cleanArtist}" genre:"${genreKeyword}"`)
    }

    // Strategy 6: Album-based search if available
    if (aiSong.album && aiSong.album !== 'Unknown' && aiSong.album.length > 2) {
      const cleanAlbum = this.cleanSearchString(aiSong.album)
      searchQueries.push(`"${cleanTitle}" "${cleanArtist}" album:"${cleanAlbum}"`)
      searchQueries.push(`${cleanTitle} ${cleanArtist} ${cleanAlbum}`)
    }

    // Execute searches with progressive relaxation
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i]
      const limit = i < 6 ? 10 : 20 // More results for later, more relaxed searches

      try {
        const tracks = await this.searchTrack(query, limit)
        if (tracks.length === 0) continue

        // Find best match with confidence scoring
        const match = this.findBestTrackMatchWithConfidence(tracks, aiSong)
        if (match) {
          return match
        }
      } catch (error) {
        console.log(`Search failed for query: ${query}`, error)
        continue
      }
    }

    // Last resort: very relaxed search with individual words
    return await this.lastResortSearch(aiSong)
  }

  private generateTitleVariations(title: string): string[] {
    const variations = [title]

    // Remove common suffixes/prefixes
    const cleaned = title
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .replace(/\[.*?\]/g, '') // Remove bracket content
      .replace(/\s*-\s*(feat|ft|featuring)\.?.*$/i, '') // Remove featuring info
      .replace(/\s*-\s*.*remix.*$/i, '') // Remove remix info
      .replace(/\s*-\s*remastered.*$/i, '') // Remove remastered info
      .trim()

    if (cleaned !== title && cleaned.length > 2) {
      variations.push(cleaned)
    }

    // Add version without special characters
    const alphanumeric = title.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
    if (alphanumeric !== title && alphanumeric.length > 2) {
      variations.push(alphanumeric)
    }

    return variations
  }

  private generateArtistVariations(artist: string): string[] {
    const variations = [artist]

    // Handle featuring artists - try just the main artist
    const mainArtist = artist.split(/\s*(feat\.?|ft\.?|featuring|&|,|\+)\s*/i)[0].trim()
    if (mainArtist !== artist && mainArtist.length > 1) {
      variations.push(mainArtist)
    }

    // Handle "&" symbol variations
    if (artist.includes('&')) {
      variations.push(artist.replace(/\s*&\s*/g, ' and '))
      variations.push(artist.replace(/\s*&\s*/g, ', '))
    }

    // Handle "and" variations
    if (artist.toLowerCase().includes(' and ')) {
      variations.push(artist.replace(/\s+and\s+/gi, ' & '))
    }

    // Handle "feat" variations
    if (artist.toLowerCase().includes('feat')) {
      // Try different feat formats
      variations.push(artist.replace(/\s*feat\.?\s*/gi, ' ft. '))
      variations.push(artist.replace(/\s*feat\.?\s*/gi, ' featuring '))
      variations.push(artist.replace(/\s*ft\.?\s*/gi, ' feat. '))
    }

    // Handle "The" prefix
    if (artist.toLowerCase().startsWith('the ')) {
      variations.push(artist.substring(4))
    } else if (!artist.toLowerCase().startsWith('the ')) {
      variations.push(`The ${artist}`)
    }

    return [...new Set(variations)] // Remove duplicates
  }

  private findBestTrackMatchWithConfidence(tracks: SpotifyTrack[], aiSong: AIGeneratedSong): SpotifyTrack | null {
    let bestMatch: SpotifyTrack | null = null
    let bestScore = 0

    for (const track of tracks) {
      const score = this.calculateMatchScore(track, aiSong)

      if (score > bestScore && score >= 0.6) { // Minimum confidence threshold
        bestScore = score
        bestMatch = track
      }
    }

    return bestMatch
  }

  private calculateMatchScore(track: SpotifyTrack, aiSong: AIGeneratedSong): number {
    let score = 0
    let factors = 0

    // Title similarity (most important - 40% weight)
    const titleSim = this.calculateStringSimilarity(track.name.toLowerCase(), aiSong.title.toLowerCase())
    score += titleSim * 0.4
    factors++

    // Artist similarity (30% weight)
    const artistSim = Math.max(...track.artists.map(artist =>
      this.calculateStringSimilarity(artist.name.toLowerCase(), aiSong.artist.toLowerCase())
    ))
    score += artistSim * 0.3
    factors++

    // Album similarity (15% weight) if available
    if (aiSong.album && aiSong.album !== 'Unknown') {
      const albumSim = this.calculateStringSimilarity(track.album.name.toLowerCase(), aiSong.album.toLowerCase())
      score += albumSim * 0.15
      factors++
    }

    // Year proximity (10% weight) if available
    if (aiSong.year && track.album) {
      // Extract year from album or use a reasonable default
      const trackYear = this.extractYearFromTrack(track)
      if (trackYear) {
        const yearDiff = Math.abs(trackYear - aiSong.year)
        const yearScore = Math.max(0, 1 - yearDiff / 10) // Penalize by decade
        score += yearScore * 0.1
        factors++
      }
    }

    // Exact title match bonus
    if (track.name.toLowerCase() === aiSong.title.toLowerCase()) {
      score += 0.1
    }

    // Exact artist match bonus
    if (track.artists.some(artist => artist.name.toLowerCase() === aiSong.artist.toLowerCase())) {
      score += 0.05
    }

    return score
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Use a combination of Levenshtein distance and Jaccard similarity
    const levenshteinSim = this.getLevenshteinSimilarity(str1, str2)
    const jaccardSim = this.getJaccardSimilarity(str1, str2)

    // Weight Levenshtein more heavily for exact matches, Jaccard for word overlap
    return (levenshteinSim * 0.7) + (jaccardSim * 0.3)
  }

  private getLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength
  }

  private getJaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(/\s+/))
    const set2 = new Set(str2.toLowerCase().split(/\s+/))

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }

  private async lastResortSearch(aiSong: AIGeneratedSong): Promise<SpotifyTrack | null> {
    const titleWords = aiSong.title.split(' ').filter(w => w.length > 2)
    const artistWords = aiSong.artist.split(' ').filter(w => w.length > 2)

    // Try searching with individual important words
    const fallbackQueries = [
      // Search with longest words from title and artist
      `${titleWords[0] || aiSong.title} ${artistWords[0] || aiSong.artist}`,

      // Search just the title if it's distinctive
      ...(titleWords.length >= 2 ? [titleWords.slice(0, 2).join(' ')] : []),

      // Search main artist if it's not too generic
      ...(artistWords.length >= 1 && artistWords[0].length > 3 ? [artistWords[0]] : []),
    ]

    for (const query of fallbackQueries) {
      if (query.length < 3) continue

      try {
        const tracks = await this.searchTrack(query, 50) // Many results for fallback

        // Very relaxed matching for last resort
        for (const track of tracks) {
          const titleSim = this.getJaccardSimilarity(track.name.toLowerCase(), aiSong.title.toLowerCase())
          const artistSim = Math.max(...track.artists.map(artist =>
            this.getJaccardSimilarity(artist.name.toLowerCase(), aiSong.artist.toLowerCase())
          ))

          // Lower threshold for last resort
          if (titleSim >= 0.3 && artistSim >= 0.3) {
            console.log(`🔥 Last resort found: "${aiSong.title}" by ${aiSong.artist} -> "${track.name}" by ${track.artists[0].name} (confidence: ${Math.round((titleSim + artistSim) * 50)}%)`)
            return track
          }
        }
      } catch (error) {
        continue
      }
    }

    return null
  }

  private extractYearFromTrack(track: SpotifyTrack): number | null {
    // This would need more implementation to extract year from Spotify track data
    // For now, return null as we don't have release date in our SpotifyTrack interface
    return null
  }

  private cleanSearchString(str: string): string {
    return str
      .replace(/[^\w\s&-]/g, '') // Remove special chars except &, -, and spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }

  async findAlternativeSuggestions(aiSong: AIGeneratedSong): Promise<SpotifyTrack[]> {
    const suggestions: SpotifyTrack[] = []

    try {
      // Strategy 1: Find other songs by the same artist
      const artistQuery = `artist:"${aiSong.artist}"`
      const artistResults = await this.client.search(artistQuery, ['track'], 'US', 5)

      for (const track of artistResults.tracks.items) {
        const suggestion: SpotifyTrack = {
          id: track.id,
          name: track.name,
          artists: track.artists.map(artist => ({ name: artist.name, id: artist.id })),
          album: {
            name: track.album.name,
            images: track.album.images.map(img => ({ url: img.url, height: img.height, width: img.width }))
          },
          duration_ms: track.duration_ms,
          preview_url: track.preview_url,
          external_urls: { spotify: track.external_urls.spotify }
        }
        suggestions.push(suggestion)
      }

      // Strategy 2: Find songs from the same genre/era (using year and genre info)
      if (aiSong.year && suggestions.length < 3) {
        const yearRange = `${aiSong.year - 2}-${aiSong.year + 2}`
        const genreQuery = `genre:"${aiSong.genre}" year:${yearRange}`
        const genreResults = await this.client.search(genreQuery, ['track'], 'US', 3)

        for (const track of genreResults.tracks.items.slice(0, 3 - suggestions.length)) {
          if (!suggestions.some(s => s.id === track.id)) {
            const suggestion: SpotifyTrack = {
              id: track.id,
              name: track.name,
              artists: track.artists.map(artist => ({ name: artist.name, id: artist.id })),
              album: {
                name: track.album.name,
                images: track.album.images.map(img => ({ url: img.url, height: img.height, width: img.width }))
              },
              duration_ms: track.duration_ms,
              preview_url: track.preview_url,
              external_urls: { spotify: track.external_urls.spotify }
            }
            suggestions.push(suggestion)
          }
        }
      }

      // Strategy 3: Search for covers or similar songs using key words from title
      if (suggestions.length < 3) {
        const titleWords = aiSong.title.split(' ').filter(word => word.length > 3)
        if (titleWords.length > 0) {
          const keywordQuery = titleWords.slice(0, 2).join(' ')
          const keywordResults = await this.client.search(keywordQuery, ['track'], 'US', 5)

          for (const track of keywordResults.tracks.items.slice(0, 3 - suggestions.length)) {
            if (!suggestions.some(s => s.id === track.id)) {
              const suggestion: SpotifyTrack = {
                id: track.id,
                name: track.name,
                artists: track.artists.map(artist => ({ name: artist.name, id: artist.id })),
                album: {
                  name: track.album.name,
                  images: track.album.images.map(img => ({ url: img.url, height: img.height, width: img.width }))
                },
                duration_ms: track.duration_ms,
                preview_url: track.preview_url,
                external_urls: { spotify: track.external_urls.spotify }
              }
              suggestions.push(suggestion)
            }
          }
        }
      }

      return suggestions.slice(0, 3) // Limit to 3 suggestions
    } catch (error) {
      console.error(`Error finding alternatives for ${aiSong.title}:`, error)
      return []
    }
  }

  async createPlaylist(
    name: string,
    description: string,
    tracks: SpotifyTrack[],
    isPublic: boolean = false
  ): Promise<SpotifyPlaylist> {
    try {
      // Get current user ID
      const user = await this.client.currentUser.profile()

      // Create the playlist
      const playlist = await this.client.playlists.createPlaylist(
        user.id,
        {
          name,
          description,
          public: isPublic,
        }
      )

      // Add tracks to playlist in batches (Spotify allows max 100 tracks per request)
      if (tracks.length > 0) {
        const trackUris = tracks.map(track => `spotify:track:${track.id}`)
        const batchSize = 100

        for (let i = 0; i < trackUris.length; i += batchSize) {
          const batch = trackUris.slice(i, i + batchSize)
          await this.client.playlists.addItemsToPlaylist(playlist.id, batch)
        }
      }

      // Fetch the updated playlist with tracks
      const updatedPlaylist = await this.client.playlists.getPlaylist(playlist.id)

      return {
        id: updatedPlaylist.id,
        name: updatedPlaylist.name,
        description: updatedPlaylist.description || '',
        images: updatedPlaylist.images,
        tracks: {
          total: updatedPlaylist.tracks.total,
          items: updatedPlaylist.tracks.items.map(item => ({
            track: {
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map(artist => ({
                name: artist.name,
                id: artist.id
              })),
              album: {
                name: item.track.album.name,
                images: item.track.album.images
              },
              duration_ms: item.track.duration_ms,
              preview_url: item.track.preview_url,
              external_urls: item.track.external_urls
            }
          }))
        },
        external_urls: updatedPlaylist.external_urls
      }
    } catch (error) {
      console.error('Error creating playlist:', error)
      throw new Error('Failed to create playlist')
    }
  }

  async getUserPlaylists(limit: number = 20) {
    try {
      const playlists = await this.client.currentUser.playlists.playlists(limit)
      return playlists.items
    } catch (error) {
      console.error('Error fetching user playlists:', error)
      throw new Error('Failed to fetch playlists')
    }
  }

  private isSimilar(str1: string, str2: string, threshold: number = 0.75): boolean {
    // Simple similarity check using Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    const similarity = (maxLength - distance) / maxLength
    return similarity >= threshold
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Utility function to create service instance with user's access token
export function createSpotifyService(accessToken: string): SpotifyService {
  return new SpotifyService(accessToken)
}