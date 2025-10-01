"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/layout/header"
import { PlaylistGenerator } from "@/components/features/playlist-generator"
import { PlaylistResult } from "@/components/features/playlist-result"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Users, AlertCircle } from "lucide-react"
import { PlaylistGenerationRequest, PlaylistGenerationResponse } from "@/types"
import { toast } from "sonner"
import { redirect } from "next/navigation"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [currentGeneration, setCurrentGeneration] = useState<PlaylistGenerationResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentStatus, setCurrentStatus] = useState("")

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    redirect("/")
  }

  const handleGenerate = async (request: PlaylistGenerationRequest) => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setCurrentStatus("Getting AI recommendations...")
    setCurrentGeneration(null)

    try {
      // Step 1: Generate AI recommendations
      setGenerationProgress(25)
      const response = await fetch("/api/generate-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error("Failed to generate playlist")
      }

      const result: PlaylistGenerationResponse = await response.json()
      setCurrentGeneration(result)
      setGenerationProgress(100)
      setCurrentStatus("Playlist generated successfully!")

      if (result.spotifyTracks.length > 0) {
        toast.success(`Found ${result.spotifyTracks.length} tracks for your playlist!`)
      } else {
        toast.error("No tracks were found on Spotify for this request.")
      }
    } catch (error) {
      console.error("Error generating playlist:", error)
      toast.error("Failed to generate playlist. Please try again.")
    } finally {
      setIsGenerating(false)
      setCurrentStatus("")
      setGenerationProgress(0)
    }
  }

  const handleCreatePlaylist = async (customName?: string, customDescription?: string, selectedAlternatives?: { [key: string]: string }) => {
    if (!currentGeneration || !currentGeneration.spotifyTracks.length) return

    setIsCreatingPlaylist(true)
    try {
      // Prepare tracks including selected alternatives
      let tracksToAdd = currentGeneration.spotifyTracks

      if (selectedAlternatives) {
        // Find selected alternative tracks and add them
        const alternativeTracks = []
        for (const [songTitle, trackId] of Object.entries(selectedAlternatives)) {
          if (trackId) {
            const alternative = currentGeneration.alternativeSuggestions?.find(
              alt => alt.originalSong.title === songTitle
            )
            const selectedTrack = alternative?.suggestions.find(s => s.id === trackId)
            if (selectedTrack) {
              alternativeTracks.push(selectedTrack)
            }
          }
        }
        tracksToAdd = [...tracksToAdd, ...alternativeTracks]
      }

      const response = await fetch("/api/create-spotify-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName || currentGeneration.playlistName || `AI Generated Playlist`,
          description: customDescription || currentGeneration.playlistDescription || `Created with Playlistly AI`,
          tracks: tracksToAdd,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create playlist")
      }

      const playlist = await response.json()

      // Update current generation with the created playlist (includes cover image)
      setCurrentGeneration(prev => prev ? {
        ...prev,
        createdPlaylist: playlist
      } : null)

      toast.success("Playlist created successfully!")

      // Open Spotify playlist
      if (playlist.external_urls?.spotify) {
        window.open(playlist.external_urls.spotify, "_blank")
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast.error("Failed to create playlist. Please try again.")
    } finally {
      setIsCreatingPlaylist(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {session.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            Ready to discover your next favorite playlist? Describe the perfect vibe and let AI do the magic.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Account</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Spotify</div>
              <p className="text-xs text-muted-foreground">
                {session.user?.email}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Models</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GPT-4</div>
              <p className="text-xs text-muted-foreground">
                Latest AI for music curation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Music Database</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100M+</div>
              <p className="text-xs text-muted-foreground">
                Songs on Spotify
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {currentGeneration ? (
            <PlaylistResult
              result={currentGeneration}
              onCreatePlaylist={handleCreatePlaylist}
              onRetry={() => setCurrentGeneration(null)}
              isCreating={isCreatingPlaylist}
            />
          ) : (
            <PlaylistGenerator
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              progress={generationProgress}
              currentStatus={currentStatus}
            />
          )}
        </div>
      </main>
    </div>
  )
}