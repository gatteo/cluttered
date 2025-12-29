import { create } from 'zustand'
import { soundManager } from '../services/soundManager'

interface ScanProgress {
  phase: 'discovering' | 'analyzing' | 'complete'
  currentPath?: string
  projectsFound: number
  totalSize: number
  ecosystemCounts?: Record<string, number>
  estimatedTimeRemaining?: number
}

interface ScanResult {
  projects: any[]
  totalSize: number
  totalProjects: number
  scanDuration: number
  ecosystemSummary: any[]
}

interface ScanState {
  isScanning: boolean
  progress: ScanProgress | null
  result: ScanResult | null
  error: string | null
  lastScanTime: Date | null

  // Actions
  startScan: () => Promise<void>
  cancelScan: () => void
  loadCachedResults: () => Promise<void>
  removeCleanedProjects: (projectIds: string[]) => void
  setProgress: (progress: ScanProgress) => void
  setResult: (result: ScanResult) => void
  setError: (error: string) => void
  reset: () => void
}

export const useScanStore = create<ScanState>((set, get) => ({
  isScanning: false,
  progress: null,
  result: null,
  error: null,
  lastScanTime: null,

  startScan: async () => {
    set({ isScanning: true, error: null, progress: null })
    soundManager.play('scan-start')

    try {
      console.log('[Scan] Starting scan...')
      const result = await window.electronAPI.startScan()
      console.log('[Scan] Scan complete:', result)

      if (!result || !result.projects) {
        console.error('[Scan] Invalid result:', result)
        set({ error: 'Scan returned invalid result', isScanning: false })
        return
      }

      // Build ecosystem summary from projects
      const ecosystemMap = new Map<string, { projectCount: number; totalSize: number; cleanableSize: number }>()

      for (const project of result.projects) {
        const existing = ecosystemMap.get(project.ecosystem) || { projectCount: 0, totalSize: 0, cleanableSize: 0 }
        existing.projectCount += 1
        existing.totalSize += project.totalSize
        if (!project.isProtected) {
          existing.cleanableSize += project.totalSize
        }
        ecosystemMap.set(project.ecosystem, existing)
      }

      const ecosystemSummary = Array.from(ecosystemMap.entries()).map(([ecosystem, data]) => ({
        ecosystem,
        ...data,
      }))

      set({
        result: {
          ...result,
          ecosystemSummary: ecosystemSummary.length > 0 ? ecosystemSummary : result.ecosystemSummary,
        },
        isScanning: false,
        lastScanTime: new Date(),
      })
      soundManager.play('scan-complete')
    } catch (error) {
      console.error('[Scan] Error:', error)
      set({ error: String(error), isScanning: false })
    }
  },

  cancelScan: () => {
    window.electronAPI.cancelScan()
    set({ isScanning: false })
  },

  loadCachedResults: async () => {
    try {
      const cached = await window.electronAPI.getCachedResults()
      if (cached.projects.length > 0) {
        // Build ecosystem summary from projects
        const ecosystemMap = new Map<string, { projectCount: number; totalSize: number; cleanableSize: number }>()

        for (const project of cached.projects) {
          const existing = ecosystemMap.get(project.ecosystem) || { projectCount: 0, totalSize: 0, cleanableSize: 0 }
          existing.projectCount += 1
          existing.totalSize += project.totalSize
          if (!project.isProtected) {
            existing.cleanableSize += project.totalSize
          }
          ecosystemMap.set(project.ecosystem, existing)
        }

        const ecosystemSummary = Array.from(ecosystemMap.entries()).map(([ecosystem, data]) => ({
          ecosystem,
          ...data,
        }))

        set({
          result: {
            projects: cached.projects,
            totalSize: cached.projects.reduce((sum: number, p: any) => sum + p.totalSize, 0),
            totalProjects: cached.projects.length,
            scanDuration: 0,
            ecosystemSummary,
          },
          lastScanTime: cached.lastScanTime ? new Date(cached.lastScanTime) : null,
        })
      }
    } catch (error) {
      console.error('Failed to load cached results:', error)
    }
  },

  removeCleanedProjects: (projectIds: string[]) => {
    const { result } = get()
    if (!result) return

    const idsToRemove = new Set(projectIds)
    const remainingProjects = result.projects.filter((p: any) => !idsToRemove.has(p.id))

    // Rebuild ecosystem summary
    const ecosystemMap = new Map<string, { projectCount: number; totalSize: number; cleanableSize: number }>()
    for (const project of remainingProjects) {
      const existing = ecosystemMap.get(project.ecosystem) || { projectCount: 0, totalSize: 0, cleanableSize: 0 }
      existing.projectCount += 1
      existing.totalSize += project.totalSize
      if (!project.isProtected) {
        existing.cleanableSize += project.totalSize
      }
      ecosystemMap.set(project.ecosystem, existing)
    }

    const ecosystemSummary = Array.from(ecosystemMap.entries()).map(([ecosystem, data]) => ({
      ecosystem,
      ...data,
    }))

    set({
      result: {
        ...result,
        projects: remainingProjects,
        totalSize: remainingProjects.reduce((sum: number, p: any) => sum + p.totalSize, 0),
        totalProjects: remainingProjects.length,
        ecosystemSummary,
      },
    })
  },

  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result, isScanning: false }),
  setError: (error) => set({ error, isScanning: false }),
  reset: () => set({ isScanning: false, progress: null, result: null, error: null }),
}))

// Set up progress listener
if (typeof window !== 'undefined' && window.electronAPI) {
  console.log('[ScanStore] Setting up progress listener')
  window.electronAPI.onScanProgress((progress) => {
    console.log('[ScanStore] Progress received:', progress)
    useScanStore.getState().setProgress(progress)
    // Note: Don't call loadCachedResults() on complete - startScan() already
    // sets the result directly. Calling loadCachedResults here causes a race
    // condition where the cache might be empty (just cleared) when we read it.
  })
}
