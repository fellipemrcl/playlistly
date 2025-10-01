"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Play,
  ExternalLink,
  Music,
  Clock,
  Users,
  AlertTriangle,
  Sparkles,
  Edit3,
  Check,
  X,
  Lightbulb,
  Image as ImageIcon
} from "lucide-react"
import { PlaylistGenerationResponse } from "@/types"
import { formatDuration, openSpotifyLink } from "@/lib/utils"

interface PlaylistResultProps {
  result: PlaylistGenerationResponse
  onCreatePlaylist?: (customName?: string, customDescription?: string, selectedAlternatives?: { [key: string]: string }) => void
  onRetry?: () => void
  isCreating?: boolean
}

export function PlaylistResult({
  result,
  onCreatePlaylist,
  onRetry,
  isCreating = false
}: PlaylistResultProps) {
  const [showNotFound, setShowNotFound] = useState(false)
  const [customName, setCustomName] = useState(result.playlistName || "")
  const [customDescription, setCustomDescription] = useState(result.playlistDescription || "")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [selectedAlternatives, setSelectedAlternatives] = useState<{ [key: string]: string }>({})

  const totalDuration = result.spotifyTracks.reduce((acc, track) => acc + track.duration_ms, 0)
  const foundCount = result.spotifyTracks.length
  const notFoundCount = result.notFoundSongs.length
  const alternativeCount = result.alternativeSuggestions?.length || 0

  const handleSaveEdit = () => {
    setShowEditDialog(false)
  }

  const handleCreatePlaylist = () => {
    onCreatePlaylist?.(
      customName.trim() || result.playlistName,
      customDescription.trim() || result.playlistDescription,
      selectedAlternatives
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 pr-4">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  {customName || result.playlistName || "Generated Playlist"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="sr-only">Edit playlist details</span>
                </Button>
              </div>
              <CardDescription>
                {customDescription || result.playlistDescription || `Your AI-curated playlist is ready!`} Found {foundCount} tracks
                {notFoundCount > 0 && ` (${notFoundCount} songs couldn't be found on Spotify)`}
              </CardDescription>
            </div>
            <Badge variant={result.status === "completed" ? "default" : "secondary"}>
              {result.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Music className="h-4 w-4" />
              {foundCount} tracks
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(totalDuration)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {new Set(result.spotifyTracks.flatMap(t => t.artists.map(a => a.name))).size} artists
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {result.spotifyTracks.length > 0 && (
              <Button
                onClick={handleCreatePlaylist}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isCreating ? "Creating..." : "Add to Spotify"}
              </Button>
            )}

            {notFoundCount > 0 && (
              <Dialog open={showNotFound} onOpenChange={setShowNotFound}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    View Not Found ({notFoundCount})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Songs Not Found on Spotify</DialogTitle>
                    <DialogDescription>
                      These {notFoundCount} songs couldn&apos;t be found on Spotify. They may not be available
                      or might have different names.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {result.notFoundSongs.map((song, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{song.title}</p>
                            <p className="text-sm text-muted-foreground">{song.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}

            {alternativeCount > 0 && (
              <Dialog open={showAlternatives} onOpenChange={setShowAlternatives}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Alternative Suggestions ({alternativeCount})
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Alternative Song Suggestions</DialogTitle>
                    <DialogDescription>
                      We found some alternative songs that might fit your playlist. You can select them to replace the missing ones.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {result.alternativeSuggestions?.map((alternative, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        {/* Original Song */}
                        <div className="mb-3 pb-3 border-b">
                          <p className="text-sm text-muted-foreground mb-1">Could not find:</p>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <p className="font-medium">{alternative.originalSong.title}</p>
                            <span className="text-muted-foreground">by</span>
                            <p className="text-muted-foreground">{alternative.originalSong.artist}</p>
                          </div>
                        </div>

                        {/* Alternative Suggestions */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">Suggested alternatives:</p>
                          <div className="space-y-2">
                            {alternative.suggestions.map((suggestion) => (
                              <div
                                key={suggestion.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedAlternatives[alternative.originalSong.title] === suggestion.id
                                    ? 'bg-primary/10 border-primary'
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => {
                                  setSelectedAlternatives(prev => ({
                                    ...prev,
                                    [alternative.originalSong.title]: selectedAlternatives[alternative.originalSong.title] === suggestion.id ? '' : suggestion.id
                                  }))
                                }}
                              >
                                <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                                  {suggestion.album.images[0] && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={suggestion.album.images[0].url}
                                      alt={suggestion.album.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{suggestion.name}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {suggestion.artists.map(artist => artist.name).join(", ")}
                                  </p>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                  {formatDuration(suggestion.duration_ms)}
                                </div>

                                {selectedAlternatives[alternative.originalSong.title] === suggestion.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAlternatives({})}
                    >
                      Clear All
                    </Button>
                    <Button onClick={() => setShowAlternatives(false)}>
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button variant="ghost" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image (if found) */}
      {result.createdPlaylist?.coverImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Playlist Cover Inspiration
            </CardTitle>
            <CardDescription>
              A beautiful image that matches your playlist vibe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Cover Image */}
              <div className="relative w-full sm:w-64 h-64 rounded-lg overflow-hidden bg-muted shadow-lg flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.createdPlaylist.coverImage.urls.regular}
                  alt={result.createdPlaylist.coverImage.description || 'Playlist cover'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image Details */}
              <div className="flex-1 space-y-3">
                {result.createdPlaylist.coverImage.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{result.createdPlaylist.coverImage.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Photo by</p>
                  <a
                    href={result.createdPlaylist.coverImage.user.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                  >
                    {result.createdPlaylist.coverImage.user.name}
                  </a>
                  <span className="text-sm text-muted-foreground"> on </span>
                  <a
                    href="https://unsplash.com?utm_source=playlistly&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                  >
                    Unsplash
                  </a>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(result.createdPlaylist?.coverImage?.links.html, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Unsplash
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(result.createdPlaylist?.coverImage?.urls.full, '_blank')}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Track List */}
      {result.spotifyTracks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Track List</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {result.spotifyTracks.length} tracks
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[70vh] max-h-[800px] px-6 pb-6">
              <div className="space-y-0">
                {result.spotifyTracks.map((track, index) => (
                  <div key={track.id} className="group border-b border-border/40 last:border-b-0">
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors duration-200">
                      {/* Track Number */}
                      <div className="flex items-center justify-center w-6 h-6 text-sm font-mono text-muted-foreground/80 flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Album Art */}
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                        {track.album.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={track.album.images[0].url}
                            alt={track.album.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium text-foreground truncate leading-tight">
                          {track.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artists.map(artist => artist.name).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {track.album.name}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="text-sm text-muted-foreground font-mono flex-shrink-0 w-12 text-right">
                        {formatDuration(track.duration_ms)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        {track.preview_url && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                            <Play className="h-3.5 w-3.5" />
                            <span className="sr-only">Play preview</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          onClick={(e) => {
                            e.preventDefault()
                            openSpotifyLink(track.external_urls.spotify)
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">Open in Spotify</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Edit Playlist Details Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Playlist Details</DialogTitle>
            <DialogDescription>
              Edit the name and description for your playlist. Leave empty to use the AI-generated ones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder={result.playlistName || "Generated Playlist"}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                AI suggested: &ldquo;{result.playlistName || "Generated Playlist"}&rdquo;
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playlist-description">Description</Label>
              <Textarea
                id="playlist-description"
                placeholder={result.playlistDescription || "Your AI-curated playlist"}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={3}
                className="w-full resize-none"
              />
              <p className="text-xs text-muted-foreground">
                AI suggested: &ldquo;{result.playlistDescription || "Your AI-curated playlist"}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setCustomName("")
                setCustomDescription("")
              }}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Reset to AI
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}