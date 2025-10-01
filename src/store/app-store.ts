import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AppState, User, PlaylistGenerationResponse, GenerationHistory } from '@/types'

interface AppStore extends AppState {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setCurrentGeneration: (generation: PlaylistGenerationResponse | null) => void
  addToHistory: (history: GenerationHistory) => void
  clearHistory: () => void
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        currentGeneration: null,
        generationHistory: [],

        setUser: (user) => set({ user }),
        setLoading: (isLoading) => set({ isLoading }),
        setCurrentGeneration: (currentGeneration) => set({ currentGeneration }),
        addToHistory: (history) =>
          set((state) => ({
            generationHistory: [history, ...state.generationHistory]
          })),
        clearHistory: () => set({ generationHistory: [] })
      }),
      {
        name: 'playlistly-store',
        partialize: (state) => ({
          generationHistory: state.generationHistory
        })
      }
    )
  )
)