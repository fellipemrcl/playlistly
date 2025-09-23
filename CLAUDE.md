# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev        # Start development server with Turbopack
npm run build      # Build for production with Turbopack
npm run start      # Start production server
npm run lint       # Run ESLint linting
```

## Architecture Overview

**Playlistly** is a Next.js 15 application that generates AI-powered Spotify playlists using OpenAI and the Spotify Web API. The application follows a modern React architecture with comprehensive state management and TypeScript throughout.

### Core Architecture Patterns

**Authentication Flow**
- NextAuth.js v5 (beta) handles OAuth with Spotify
- JWT tokens include Spotify access/refresh tokens for API calls
- Session management extends default User/Session types in `src/types/next-auth.d.ts`
- Auth configuration in `src/lib/auth.ts` with custom callbacks for token handling

**State Management**
- Zustand store (`src/store/app-store.ts`) manages global application state
- Persistent storage for generation history using middleware
- State partitioning keeps only necessary data in localStorage
- TypeScript interfaces in `src/types/index.ts` define all state shapes

**API Architecture**
- Three main API routes in `src/app/api/`:
  - `generate-playlist/` - OpenAI integration for song recommendations
  - `create-spotify-playlist/` - Spotify playlist creation
  - `debug-env/` - Environment variable validation
- All routes use Next.js 15 App Router with proper TypeScript typing
- Authentication middleware validates Spotify tokens on each request

**Service Layer Pattern**
- `src/lib/spotify.ts` - Spotify API wrapper with error handling
- `src/lib/openai.ts` - OpenAI integration with structured prompts
- `src/lib/utils.ts` - Shared utilities and helpers
- Each service handles its own authentication and rate limiting

### Component Architecture

**Feature Components** (`src/components/features/`)
- `playlist-generator.tsx` - Main form with advanced settings
- `playlist-result.tsx` - Display generated playlists with Spotify integration

**Layout Components** (`src/components/layout/`)
- `header.tsx` - Navigation with authentication status
- Session and theme providers in `src/components/providers/`

**UI Components** (`src/components/ui/`)
- Complete shadcn/ui component library
- Radix UI primitives with custom Tailwind styling
- Components follow compound pattern (Card with CardHeader, CardContent, etc.)

### Data Flow

1. **User Input** → PlaylistGenerator component captures preferences
2. **AI Generation** → `/api/generate-playlist` calls OpenAI with structured prompts
3. **Spotify Search** → Service layer finds matching tracks on Spotify
4. **Track Matching** → Handles not-found songs with alternative suggestions
5. **Playlist Creation** → `/api/create-spotify-playlist` creates actual Spotify playlist
6. **State Updates** → Zustand store persists generation history

### Key TypeScript Patterns

**Request/Response Types**
- `PlaylistGenerationRequest` - API input validation
- `PlaylistGenerationResponse` - Structured API responses
- `SpotifyTrack`, `SpotifyPlaylist` - External API type matching
- `AIGeneratedSong` - OpenAI response structure

**State Management Types**
- `AppState` - Global application state shape
- `GenerationHistory` - Persistent user history
- Union types for status tracking (`'pending' | 'generating' | 'completed'`)

### Environment Configuration

Required environment variables (see `.env.example`):
- `NEXTAUTH_SECRET` - NextAuth.js session encryption
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` - Spotify OAuth
- `OPENAI_API_KEY` - GPT integration
- `DATABASE_URL` - PostgreSQL connection (Prisma ready)
- `REDIS_URL` - Optional caching layer

### Development Notes

**Spotify Integration**
- OAuth scopes include playlist modification and user library access
- Access tokens are stored in JWT and passed to service layer
- Refresh token handling implemented in NextAuth callbacks

**OpenAI Integration**
- Structured prompts in `generatePlaylistRecommendations()`
- JSON mode ensures consistent response format
- Prompt engineering includes genre, year, and reasoning context

**Error Handling**
- API routes return structured error responses
- Frontend components handle loading and error states
- Spotify API rate limiting and token refresh handled in service layer

**Testing Setup**
- Jest configured with React Testing Library
- `@testing-library/jest-dom` for DOM assertions
- Test utilities available but no tests implemented yet

**Code Style**
- Prettier and ESLint configured with Next.js defaults
- Husky and lint-staged for pre-commit formatting
- TypeScript strict mode enabled throughout