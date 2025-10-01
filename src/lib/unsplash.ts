import { UnsplashImage } from '@/types'

export class UnsplashService {
  private accessKey: string
  private baseUrl = 'https://api.unsplash.com'

  constructor(accessKey: string) {
    this.accessKey = accessKey
  }

  /**
   * Search for images on Unsplash
   * @param query Search query
   * @param perPage Number of results (default: 10, max: 30)
   * @returns Array of Unsplash images
   */
  async searchPhotos(query: string, perPage: number = 10): Promise<UnsplashImage[]> {
    try {
      console.log(`🖼️ Searching Unsplash for: "${query}"`)

      const url = new URL(`${this.baseUrl}/search/photos`)
      url.searchParams.append('query', query)
      url.searchParams.append('per_page', Math.min(perPage, 30).toString())
      url.searchParams.append('orientation', 'landscape')

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`,
          'Accept-Version': 'v1'
        }
      })

      if (!response.ok) {
        console.log(`❌ Unsplash search failed: ${response.status}`)
        return []
      }

      const data = await response.json()
      const images: UnsplashImage[] = []

      if (data.results && Array.isArray(data.results)) {
        for (const result of data.results) {
          images.push({
            id: result.id,
            description: result.description || result.alt_description || '',
            urls: {
              raw: result.urls?.raw || '',
              full: result.urls?.full || '',
              regular: result.urls?.regular || '',
              small: result.urls?.small || '',
              thumb: result.urls?.thumb || ''
            },
            links: {
              html: result.links?.html || '',
              download: result.links?.download || ''
            },
            user: {
              name: result.user?.name || '',
              username: result.user?.username || '',
              portfolio_url: result.user?.portfolio_url || result.user?.links?.html || ''
            },
            width: result.width || 0,
            height: result.height || 0
          })
        }
      }

      console.log(`✅ Found ${images.length} Unsplash images`)
      return images
    } catch (error) {
      console.error('Error searching Unsplash:', error)
      return []
    }
  }

  /**
   * Find the best image for a playlist
   * @param playlistTitle Playlist title
   * @param playlistDescription Playlist description
   * @returns Best matching Unsplash image
   */
  async findImageForPlaylist(
    playlistTitle: string,
    playlistDescription: string
  ): Promise<UnsplashImage | null> {
    try {
      console.log(`🎨 Finding Unsplash image for playlist: "${playlistTitle}"`)

      // Construct search query
      const searchQuery = this.constructSearchQuery(playlistTitle, playlistDescription)

      // Search for images
      const images = await this.searchPhotos(searchQuery, 20)

      if (images.length === 0) {
        console.log('❌ No Unsplash images found for this playlist')
        return null
      }

      // Find the best match
      const bestMatch = this.findBestImageMatch(images, playlistTitle, playlistDescription)

      if (bestMatch) {
        console.log(`✅ Found Unsplash image: "${bestMatch.description || 'Untitled'}"`)
      }

      return bestMatch
    } catch (error) {
      console.error('Error finding image for playlist:', error)
      return null
    }
  }

  /**
   * Construct search query from playlist metadata
   * @param title Playlist title
   * @param description Playlist description
   * @returns Search query string
   */
  private constructSearchQuery(title: string, description: string): string {
    // Extract keywords from title and description
    const titleWords = this.extractKeywords(title)
    const descriptionWords = this.extractKeywords(description)

    // Combine and prioritize title words
    const keywords = [
      ...titleWords.slice(0, 3), // Top 3 from title
      ...descriptionWords.slice(0, 2) // Top 2 from description
    ]

    // Add music context
    keywords.push('music', 'aesthetic')

    return keywords.join(' ')
  }

  /**
   * Extract meaningful keywords from text
   * @param text Input text
   * @returns Array of keywords
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10)
  }

  /**
   * Find best matching image from search results
   * @param images Array of Unsplash images
   * @param title Playlist title
   * @param description Playlist description
   * @returns Best matching image
   */
  private findBestImageMatch(
    images: UnsplashImage[],
    title: string,
    description: string
  ): UnsplashImage | null {
    if (images.length === 0) return null

    // Score each image based on relevance
    const scoredImages = images.map(image => ({
      image,
      score: this.calculateImageRelevanceScore(image, title, description)
    }))

    // Sort by score (highest first)
    scoredImages.sort((a, b) => b.score - a.score)

    // Return the best match
    return scoredImages[0].image
  }

  /**
   * Calculate relevance score for an image
   * @param image Unsplash image
   * @param title Playlist title
   * @param description Playlist description
   * @returns Relevance score (0-1)
   */
  private calculateImageRelevanceScore(
    image: UnsplashImage,
    title: string,
    description: string
  ): number {
    let score = 0

    // Description similarity (50% weight)
    if (image.description) {
      const descSimilarity = this.calculateTextSimilarity(
        image.description,
        `${title} ${description}`
      )
      score += descSimilarity * 0.5
    }

    // Landscape orientation bonus (30% weight)
    if (image.width > image.height) {
      score += 0.3
    }

    // High resolution bonus (20% weight)
    if (image.width >= 1920 && image.height >= 1080) {
      score += 0.2
    }

    return Math.min(score, 1)
  }

  /**
   * Calculate text similarity using Jaccard similarity
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score (0-1)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(
      text1.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    )
    const words2 = new Set(
      text2.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    )

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }
}

/**
 * Create Unsplash service instance
 * @param accessKey Unsplash API access key
 * @returns UnsplashService instance
 */
export function createUnsplashService(accessKey: string): UnsplashService {
  return new UnsplashService(accessKey)
}
