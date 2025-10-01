"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Music, Settings, Loader2 } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { PlaylistGenerationRequest, PlaylistNameStyle } from "@/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PlaylistGeneratorProps {
  onGenerate: (request: PlaylistGenerationRequest) => void
  isGenerating: boolean
  progress?: number
  currentStatus?: string
}

export function PlaylistGenerator({
  onGenerate,
  isGenerating,
  progress = 0,
  currentStatus
}: PlaylistGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [numberOfSongs, setNumberOfSongs] = useState(20)
  const [includePopularSongs, setIncludePopularSongs] = useState(true)
  const [excludeExplicit, setExcludeExplicit] = useState(false)
  const [nameStyle, setNameStyle] = useState<PlaylistNameStyle>('casual')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return

    onGenerate({
      prompt: prompt.trim(),
      numberOfSongs,
      includePopularSongs,
      excludeExplicit,
      nameStyle
    })
  }

  const examplePrompts = [
    "Upbeat songs for morning workout",
    "Chill indie rock for studying",
    "Road trip classics from the 80s and 90s",
    "Romantic dinner jazz and soul",
    "High-energy dance music for party",
    "Melancholy indie songs for rainy days"
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Playlist Generator
        </CardTitle>
        <CardDescription>
          Describe the vibe, mood, or theme for your perfect playlist and let AI do the magic
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your playlist</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., upbeat songs for morning workout, chill indie rock for studying..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Try these examples:</Label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example) => (
                <Badge
                  key={example}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => !isGenerating && setPrompt(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameStyle">Playlist name style</Label>
                  <Select
                    value={nameStyle}
                    onValueChange={(value) => setNameStyle(value as PlaylistNameStyle)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aesthetic">✨ Aesthetic (soft girl era, golden hour ✧)</SelectItem>
                      <SelectItem value="casual">😎 Casual (songs that hit different, vibes for today)</SelectItem>
                      <SelectItem value="poetic">📖 Poetic (whispers of autumn rain, dancing with shadows)</SelectItem>
                      <SelectItem value="minimalist">⚪ Minimalist (focus, chill, morning)</SelectItem>
                      <SelectItem value="vintage">🎞️ Vintage (summer of &apos;85, retro dreams)</SelectItem>
                      <SelectItem value="edgy">🔥 Edgy (main character energy, midnight rebellion)</SelectItem>
                      <SelectItem value="classic">🎩 Classic (Evening Jazz Collection, Road Trip Classics)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfSongs">Number of songs</Label>
                  <Input
                    id="numberOfSongs"
                    type="number"
                    min={5}
                    max={50}
                    value={numberOfSongs}
                    onChange={(e) => setNumberOfSongs(parseInt(e.target.value) || 20)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePopularSongs"
                    checked={includePopularSongs}
                    onCheckedChange={(checked) => setIncludePopularSongs(checked as boolean)}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="includePopularSongs" className="text-sm">
                    Include popular songs (mix of hits and deep cuts)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludeExplicit"
                    checked={excludeExplicit}
                    onCheckedChange={(checked) => setExcludeExplicit(checked as boolean)}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="excludeExplicit" className="text-sm">
                    Exclude explicit content
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">
                  {currentStatus || "Generating your playlist..."}
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Playlist...
              </>
            ) : (
              <>
                <Music className="mr-2 h-4 w-4" />
                Generate Playlist
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}