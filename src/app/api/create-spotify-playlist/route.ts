import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createSpotifyService } from "@/lib/spotify"
import { SpotifyTrack } from "@/types"

interface CreatePlaylistRequest {
  name: string
  description: string
  tracks: SpotifyTrack[]
  isPublic?: boolean
}

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
    const body: CreatePlaylistRequest = await request.json()
    const { name, description, tracks, isPublic = false } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Playlist name is required" },
        { status: 400 }
      )
    }

    if (!tracks?.length) {
      return NextResponse.json(
        { error: "At least one track is required" },
        { status: 400 }
      )
    }

    // Create Spotify service
    const spotifyService = createSpotifyService(session.accessToken)

    // Create the playlist on Spotify
    const playlist = await spotifyService.createPlaylist(
      name,
      description || `Created with Playlistly AI - ${new Date().toLocaleDateString()}`,
      tracks,
      isPublic
    )

    return NextResponse.json(playlist)

  } catch (error) {
    console.error("Error creating Spotify playlist:", error)

    // Handle specific Spotify API errors
    if (error instanceof Error) {
      if (error.message.includes("access token")) {
        return NextResponse.json(
          { error: "Spotify access token expired. Please sign in again." },
          { status: 401 }
        )
      }

      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment." },
          { status: 429 }
        )
      }

      if (error.message.includes("permission")) {
        return NextResponse.json(
          { error: "Insufficient permissions. Please re-authorize with Spotify." },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    )
  }
}