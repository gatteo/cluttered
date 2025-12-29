import { create } from 'zustand'
import { useProjectStore } from './projectStore'
import { useScanStore } from './scanStore'
import { soundManager } from '../services/soundManager'

interface CleanProgress {
  currentProject?: string
  projectsProcessed: number
  totalProjects: number
  bytesFreed: number
  filesDeleted: number
}

interface CleanResult {
  success: boolean
  bytesFreed: number
  filesDeleted: number
  projectsCleaned: string[]
  errors: Array<{ projectId: string; error: string }>
}

interface CleanState {
  isCleaning: boolean
  isComplete: boolean
  progress: CleanProgress | null
  result: CleanResult | null
  error: string | null

  // Actions
  startClean: (projectIds?: string[]) => Promise<void>
  setProgress: (progress: CleanProgress) => void
  setComplete: (result: CleanResult) => void
  reset: () => void
}

export const useCleanStore = create<CleanState>((set, get) => ({
  isCleaning: false,
  isComplete: false,
  progress: null,
  result: null,
  error: null,

  startClean: async (projectIds) => {
    const ids = projectIds ?? Array.from(useProjectStore.getState().selectedIds)

    console.log('[CleanStore] startClean called')
    console.log('[CleanStore] Project IDs to clean:', ids)

    if (ids.length === 0) {
      console.log('[CleanStore] No IDs to clean, returning')
      return
    }

    set({ isCleaning: true, isComplete: false, progress: null, result: null, error: null })

    try {
      console.log('[CleanStore] Calling electronAPI.cleanProjects with', ids.length, 'IDs')
      const result = await window.electronAPI.cleanProjects({
        projectIds: ids,
        dryRun: false,
        moveToTrash: true,
      })

      set({ result, isComplete: true, isCleaning: false })
      soundManager.playCleanSound(result.bytesFreed)

      // Update scan results to remove cleaned projects
      if (result.projectsCleaned && result.projectsCleaned.length > 0) {
        // The result contains project IDs that were cleaned
        // We need to get the IDs that were sent (the ones we selected)
        useScanStore.getState().removeCleanedProjects(ids)
      }

      // Clear selection for cleaned projects
      const projectStore = useProjectStore.getState()
      projectStore.deselectAll()
    } catch (error) {
      set({ error: String(error), isCleaning: false })
    }
  },

  setProgress: (progress) => set({ progress }),

  setComplete: (result) => set({ result, isComplete: true, isCleaning: false }),

  reset: () =>
    set({
      isCleaning: false,
      isComplete: false,
      progress: null,
      result: null,
      error: null,
    }),
}))

// Set up progress listener
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.onCleanProgress((progress) => {
    useCleanStore.getState().setProgress(progress)
  })
}
