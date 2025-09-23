import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { AIGeneratedSong, PlaylistGenerationRequest, PlaylistNameStyle } from '@/types'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SongSchema = z.object({
  title: z.string().describe("The exact song title"),
  artist: z.string().describe("The primary artist or band name"),
  album: z.string().describe("The album name"),
  genre: z.string().describe("The music genre"),
  year: z.number().describe("The year the song was released"),
  reason: z.string().describe("Why this song fits the request")
})

const PlaylistSchema = z.object({
  songs: z.array(SongSchema).describe("Array of song recommendations"),
  playlistName: z.string().describe("A catchy name for this playlist"),
  playlistDescription: z.string().describe("A brief description of the playlist theme")
})

function getPlaylistNameStylePrompt(style: PlaylistNameStyle): string {
  const stylePrompts = {
    aesthetic: 'Create an aesthetic, visually-inspired playlist name using symbols, lowercase letters, or trendy formatting (e.g., "late night drives ✧", "soft girl era", "golden hour thoughts")',
    casual: 'Create a casual, relatable playlist name that sounds like something friends would say (e.g., "songs that hit different", "my current obsession", "vibes for today")',
    poetic: 'Create a poetic, literary playlist name with beautiful imagery and metaphors (e.g., "whispers of autumn rain", "echoes in empty rooms", "dancing with shadows")',
    minimalist: 'Create a simple, clean playlist name with minimal words (e.g., "focus", "drive", "study", "chill", "morning")',
    vintage: 'Create a nostalgic, retro playlist name that evokes past eras (e.g., "summer of \'85", "vinyl memories", "old soul vibes", "retro dreams")',
    edgy: 'Create an edgy, bold playlist name with attitude and confidence (e.g., "main character energy", "too cool for you", "midnight rebellion")',
    classic: 'Create a timeless, traditional playlist name that\'s straightforward and elegant (e.g., "Evening Jazz Collection", "Road Trip Classics", "Sunday Morning Blues")'
  }
  return stylePrompts[style]
}

export async function generatePlaylistRecommendations(
  request: PlaylistGenerationRequest
): Promise<{
  songs: AIGeneratedSong[]
  playlistName: string
  playlistDescription: string
}> {
  const { prompt, numberOfSongs = 20, includePopularSongs = true, excludeExplicit = false, nameStyle = 'casual' } = request

  const systemMessage = `You are a music expert and playlist curator. Your job is to recommend songs based on user prompts.

Guidelines:
- Recommend real, existing songs only
- Provide exact song titles and artist names as they appear on streaming platforms
- CRITICAL: Always format as "title" by "artist", never "artist" by "title"
- For collaborations, use format: "Song Title" by "Main Artist feat. Other Artist" or "Main Artist & Other Artist"
- Consider the mood, genre, activity, or theme described in the prompt
- ${includePopularSongs ? 'Include a mix of popular and lesser-known tracks' : 'Focus on unique and lesser-known tracks'}
- ${excludeExplicit ? 'Exclude songs with explicit content' : 'Include any appropriate songs'}
- Ensure variety in artists and avoid too many songs from the same artist
- Consider the flow and cohesiveness of the playlist
- Provide brief reasons for each song selection when possible

PLAYLIST NAMING STYLE:
${getPlaylistNameStylePrompt(nameStyle)}

Examples of correct song format:
- "Bohemian Rhapsody" by Queen
- "Empire State of Mind" by Jay-Z feat. Alicia Keys
- "Under Pressure" by Queen & David Bowie

Return exactly ${numberOfSongs} songs with a playlist name that matches the requested style.`

  try {
    const completion = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        {
          role: 'user',
          content: `Create a playlist for: ${prompt}`
        },
      ],
      response_format: zodResponseFormat(PlaylistSchema, 'playlist_response'),
      temperature: 0.8, // Add some creativity while maintaining consistency
    })

    const message = completion.choices[0]?.message
    if (message?.parsed) {
      return {
        songs: message.parsed.songs,
        playlistName: message.parsed.playlistName,
        playlistDescription: message.parsed.playlistDescription
      }
    }

    throw new Error('Failed to parse OpenAI response')
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate playlist recommendations')
  }
}

export async function refinePlaylistDescription(
  playlistName: string,
  songs: AIGeneratedSong[],
  originalPrompt: string
): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a music curator writing engaging playlist descriptions. Create a compelling 1-2 sentence description that captures the essence of the playlist.'
        },
        {
          role: 'user',
          content: `Playlist: "${playlistName}"
Original prompt: "${originalPrompt}"
Songs included: ${songs.map(s => `${s.title} by ${s.artist}`).join(', ')}

Write a catchy description for this playlist:`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    })

    return completion.choices[0]?.message?.content || playlistName
  } catch (error) {
    console.error('Failed to refine playlist description:', error)
    return `A curated playlist for ${originalPrompt.toLowerCase()}`
  }
}