import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generatePlaylistRecommendations } from "@/lib/openai"
import { createSpotifyService } from "@/lib/spotify"
import { PlaylistGenerationRequest, PlaylistGenerationResponse } from "@/types"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in with Spotify" },
        { status: 401 }
      )
    }

    // Parse request body
    const body: PlaylistGenerationRequest = await request.json()
    const { prompt, numberOfSongs = 20, includePopularSongs = true, excludeExplicit = false, nameStyle = 'casual' } = body

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Generate AI recommendations
    const aiResult = await generatePlaylistRecommendations({
      prompt,
      numberOfSongs,
      includePopularSongs,
      excludeExplicit,
      nameStyle
    })

    // Create Spotify service
    const spotifyService = createSpotifyService(session.accessToken)

    // Find tracks on Spotify
    const { foundTracks, notFoundSongs, alternativeSuggestions } = await spotifyService.findTracksFromAIRecommendations(
      aiResult.songs
    )

    // Prepare response
    const response: PlaylistGenerationResponse = {
      id: `gen_${Date.now()}`,
      songs: aiResult.songs,
      spotifyTracks: foundTracks,
      notFoundSongs,
      alternativeSuggestions,
      playlistName: aiResult.playlistName,
      playlistDescription: aiResult.playlistDescription,
      status: "completed"
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Error generating playlist:", error)

    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        error: "Failed to generate playlist",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}